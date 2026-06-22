// SETVOID — NowPayments IPN webhook.
// Verifies HMAC-SHA512 signature, updates payment row, credits gold once on success.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { createHmac } from 'node:crypto';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
  if (!ipnSecret) return new Response('not configured', { status: 500 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-nowpayments-sig') ?? '';

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody); } catch { return new Response('bad json', { status: 400 }); }
  const sortedString = JSON.stringify(sortObject(payload));
  const expected = createHmac('sha512', ipnSecret).update(sortedString).digest('hex');

  if (expected !== signature) {
    console.warn('IPN signature mismatch');
    return new Response('invalid signature', { status: 401 });
  }

  const orderId = String(payload.order_id ?? '');
  const status = String(payload.payment_status ?? 'unknown');
  const paymentId = payload.payment_id != null ? String(payload.payment_id) : null;
  const txHash = (payload.outcome as any)?.hash ?? payload.payin_hash ?? null;

  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (paymentId) {
    const { data: dup } = await service
      .from('payments').select('id, user_id').eq('nowpayments_payment_id', paymentId).maybeSingle();
    if (dup && dup.id !== orderId) {
      console.warn('duplicate payment_id for different order');
      return new Response('duplicate', { status: 409 });
    }
  }

  const { data: pay, error: updErr } = await service.from('payments')
    .update({
      status,
      nowpayments_payment_id: paymentId,
      tx_hash: txHash,
      raw_payload: payload,
    })
    .eq('id', orderId)
    .select('*').single();

  if (updErr || !pay) {
    console.error('payment not found for order_id', orderId, updErr);
    return new Response('payment not found', { status: 404 });
  }

  if (['finished', 'confirmed', 'sending'].includes(status) && !pay.credited) {
    const { error: credErr } = await service.rpc('credit_payment_gold', { payment_id: pay.id });
    if (credErr) {
      console.error('credit failed', credErr);
      return new Response('credit failed', { status: 500 });
    }
  }

  return new Response('ok', { headers: corsHeaders });
});

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>).sort().reduce((acc, k) => {
      (acc as Record<string, unknown>)[k] = sortObject((obj as Record<string, unknown>)[k]);
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
}
