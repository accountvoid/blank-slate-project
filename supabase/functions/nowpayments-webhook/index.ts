// SETVOID — NowPayments IPN webhook.
// Hardened: never crashes, structured logs, verifies HMAC-SHA512, idempotent credit.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const jsonResp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[ipn ${reqId}]`, ...a);
  const errLog = (...a: unknown[]) => console.error(`[ipn ${reqId}]`, ...a);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResp({ success: false, error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!ipnSecret || !supabaseUrl || !serviceKey) {
      errLog('missing env');
      return jsonResp({ success: false, error: 'SERVER_MISCONFIGURED' }, 200);
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-nowpayments-sig') ?? '';

    let payload: Record<string, unknown>;
    try { payload = JSON.parse(rawBody); }
    catch (e) { errLog('bad json', e); return jsonResp({ success: false, error: 'BAD_JSON', details: (e as Error).message }, 400); }

    const sortedString = JSON.stringify(sortObject(payload));
    const expected = createHmac('sha512', ipnSecret).update(sortedString).digest('hex');
    if (expected !== signature) {
      errLog('signature mismatch');
      return jsonResp({ success: false, error: 'INVALID_SIGNATURE' }, 401);
    }

    const orderId = String(payload.order_id ?? '');
    if (!orderId) return jsonResp({ success: false, error: 'MISSING_ORDER_ID' }, 400);

    const status = String(payload.payment_status ?? 'unknown');
    const paymentId = payload.payment_id != null ? String(payload.payment_id) : null;
    const txHash = (payload.outcome as any)?.hash ?? payload.payin_hash ?? null;
    log('IPN', { orderId, status, paymentId });

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (paymentId) {
      const { data: dup } = await service
        .from('payments').select('id').eq('nowpayments_payment_id', paymentId).maybeSingle();
      if (dup && dup.id !== orderId) {
        errLog('duplicate payment_id for different order', paymentId);
        return jsonResp({ success: false, error: 'DUPLICATE_PAYMENT_ID' }, 409);
      }
    }

    const { data: pay, error: updErr } = await service.from('payments')
      .update({
        status,
        nowpayments_payment_id: paymentId,
        tx_hash: txHash,
        pay_address: payload.pay_address ?? null,
        pay_amount: payload.pay_amount ?? null,
        raw_payload: payload,
      })
      .eq('id', orderId)
      .select('*').maybeSingle();

    if (updErr) { errLog('update error', updErr); return jsonResp({ success: false, error: 'DB_UPDATE_FAILED', details: updErr.message }, 200); }
    if (!pay) { errLog('payment not found', orderId); return jsonResp({ success: false, error: 'PAYMENT_NOT_FOUND' }, 404); }

    if (['finished', 'confirmed', 'sending'].includes(status) && !pay.credited) {
      const { error: credErr } = await service.rpc('credit_payment_gold', { payment_id: pay.id });
      if (credErr) {
        errLog('credit failed', credErr);
        return jsonResp({ success: false, error: 'GOLD_CREDIT_FAILED', details: credErr.message }, 200);
      }
      log('credited', pay.gold_amount, 'GOLD to', pay.user_id);
    }

    return jsonResp({ success: true, status, order_id: orderId });
  } catch (e) {
    errLog('unhandled', e);
    return jsonResp({ success: false, error: 'UNEXPECTED_ERROR', details: (e as Error)?.message ?? String(e) }, 200);
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
