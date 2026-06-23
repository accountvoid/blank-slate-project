// SETVOID — NowPayments IPN webhook.
// Hardened: never crashes, structured logs, verifies HMAC-SHA512, idempotent credit.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { createHmac } from 'node:crypto';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[ipn ${reqId}]`, ...a);
  const errLog = (...a: unknown[]) => console.error(`[ipn ${reqId}]`, ...a);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: corsHeaders });

  try {
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!ipnSecret || !supabaseUrl || !serviceKey) {
      errLog('missing env');
      return new Response('not configured', { status: 500, headers: corsHeaders });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-nowpayments-sig') ?? '';

    let payload: Record<string, unknown>;
    try { payload = JSON.parse(rawBody); }
    catch (e) { errLog('bad json', e); return new Response('bad json', { status: 400, headers: corsHeaders }); }

    const sortedString = JSON.stringify(sortObject(payload));
    const expected = createHmac('sha512', ipnSecret).update(sortedString).digest('hex');
    if (expected !== signature) {
      errLog('signature mismatch');
      return new Response('invalid signature', { status: 401, headers: corsHeaders });
    }

    const orderId = String(payload.order_id ?? '');
    const status = String(payload.payment_status ?? 'unknown');
    const paymentId = payload.payment_id != null ? String(payload.payment_id) : null;
    const txHash = (payload.outcome as any)?.hash ?? payload.payin_hash ?? null;
    log('IPN', { orderId, status, paymentId });

    const service = createClient(supabaseUrl, serviceKey);

    if (paymentId) {
      const { data: dup } = await service
        .from('payments').select('id').eq('nowpayments_payment_id', paymentId).maybeSingle();
      if (dup && dup.id !== orderId) {
        errLog('duplicate payment_id for different order', paymentId);
        return new Response('duplicate', { status: 409, headers: corsHeaders });
      }
    }

    const { data: pay, error: updErr } = await service.from('payments')
      .update({ status, nowpayments_payment_id: paymentId, tx_hash: txHash, raw_payload: payload })
      .eq('id', orderId)
      .select('*').maybeSingle();

    if (updErr) { errLog('update error', updErr); return new Response('db error', { status: 500, headers: corsHeaders }); }
    if (!pay) { errLog('payment not found', orderId); return new Response('payment not found', { status: 404, headers: corsHeaders }); }

    if (['finished', 'confirmed', 'sending'].includes(status) && !pay.credited) {
      const { error: credErr } = await service.rpc('credit_payment_gold', { payment_id: pay.id });
      if (credErr) {
        errLog('credit failed', credErr);
        return new Response('credit failed', { status: 500, headers: corsHeaders });
      }
      log('credited', pay.gold_amount, 'GOLD to', pay.user_id);
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    errLog('unhandled', e);
    return new Response('error', { status: 500, headers: corsHeaders });
  }
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
