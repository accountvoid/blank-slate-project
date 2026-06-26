// SETVOID — Create a NowPayments invoice for a Gold package.
// Hardened: always returns structured JSON, never crashes, idempotent.
// POST { gold_amount, amount_usd, pay_currency, client_nonce? }
//   -> { success: true, order_id, invoice_url, payment, warning? }
//   -> { success: false, error, details?, order_id? }
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const ALLOWED_OFFERS = [
  { gold: 1000,  usd: 1 },
  { gold: 5000,  usd: 4 },
  { gold: 15000, usd: 10 },
  { gold: 50000, usd: 30 },
];
const ALLOWED_CURRENCIES = new Set(['usdttrc20', 'usdtbsc', 'usdterc20']);

const jsonResp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const ok = (data: Record<string, unknown>) =>
  jsonResp({ success: true, warning: null, ...data }, 200);

const fail = (error: string, details?: unknown, order_id: string | null = null, status = 200) =>
  jsonResp({ success: false, error, details: details ?? null, order_id }, status);

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[create-payment ${reqId}]`, ...a);
  const errLog = (...a: unknown[]) => console.error(`[create-payment ${reqId}]`, ...a);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', `Use POST, got ${req.method}`);

  try {
    log('request received');

    // ----- Auth -----
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return fail('UNAUTHORIZED', 'Missing bearer token');
    }
    const jwt = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');

    if (!supabaseUrl || !anonKey || !serviceKey) {
      errLog('missing supabase env vars');
      return fail('SERVER_MISCONFIGURED', 'Supabase env vars missing');
    }
    if (!apiKey) {
      errLog('NOWPAYMENTS_API_KEY not set');
      return fail('PROVIDER_NOT_CONFIGURED', 'NOWPAYMENTS_API_KEY is missing');
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uErr } = await userClient.auth.getUser(jwt);
    if (uErr || !userData?.user?.id) {
      return fail('UNAUTHORIZED', uErr?.message ?? 'Invalid session');
    }
    const userId = userData.user.id;
    log('user', userId);

    // ----- Safe body parse -----
    let body: any = {};
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return fail('BAD_JSON', (e as Error).message);
    }

    const gold_amount = Number(body.gold_amount);
    const amount_usd = Number(body.amount_usd);
    const pay_currency = String(body.pay_currency ?? '').toLowerCase();
    const clientNonce = typeof body.client_nonce === 'string' ? body.client_nonce.slice(0, 80) : null;

    if (!Number.isFinite(gold_amount) || gold_amount <= 0) return fail('INVALID_INPUT', 'gold_amount must be a positive number');
    if (!Number.isFinite(amount_usd) || amount_usd <= 0)   return fail('INVALID_INPUT', 'amount_usd must be a positive number');
    if (!ALLOWED_CURRENCIES.has(pay_currency))             return fail('INVALID_INPUT', `Unsupported currency: ${pay_currency}`);

    const offer = ALLOWED_OFFERS.find((o) => o.gold === gold_amount && o.usd === amount_usd);
    if (!offer) return fail('INVALID_OFFER', `No offer for ${gold_amount} GOLD @ $${amount_usd}`);

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ----- Idempotency: reuse a recent waiting payment for same user+offer+currency -----
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: existing, error: existingErr } = await service
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('gold_amount', gold_amount)
      .eq('pay_currency', pay_currency)
      .eq('status', 'waiting')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      errLog('db lookup failed', existingErr);
      return fail('DB_SCHEMA_OR_LOOKUP_FAILED', existingErr.message, null);
    }

    if (existing && existing.raw_payload && (existing.raw_payload as any).invoice_url) {
      log('reusing recent waiting payment', existing.id);
      return ok({
        order_id: existing.id,
        invoice_url: (existing.raw_payload as any).invoice_url,
        invoice_id: existing.nowpayments_invoice_id,
        payment: existing,
        warning: 'Reused existing pending invoice',
      });
    }

    // ----- Insert payment row FIRST (never lose order_id) -----
    const { data: payRow, error: payErr } = await service
      .from('payments')
      .insert({ user_id: userId, provider: 'nowpayments', amount_usd, gold_amount, pay_currency, status: 'waiting' })
      .select('*')
      .single();
    if (payErr || !payRow) {
      errLog('db insert failed', payErr);
      return fail('DB_INSERT_FAILED', payErr?.message ?? 'Could not create payment record');
    }
    log('payment row created', payRow.id);

    // ----- Call NowPayments (fully guarded) -----
    const ipnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/nowpayments-webhook`;
    const origin = req.headers.get('origin') ?? '';
    let invoice: any = null;
    let providerStatus = 0;
    let providerErr: string | null = null;
    try {
      const invoiceRes = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_amount: amount_usd,
          price_currency: 'usd',
          pay_currency,
          order_id: payRow.id,
          order_description: `SETVOID ${gold_amount} GOLD`,
          ipn_callback_url: ipnUrl,
          success_url: `${origin}/?payment=success`,
          cancel_url: `${origin}/?payment=cancel`,
        }),
      });
      providerStatus = invoiceRes.status;
      const text = await invoiceRes.text();
      try { invoice = text ? JSON.parse(text) : null; }
      catch { providerErr = `Provider returned non-JSON (status ${providerStatus}): ${text.slice(0,200)}`; }
      if (invoiceRes.ok && invoice?.invoice_url) {
        log('invoice created', invoice.id);
      } else if (!providerErr) {
        providerErr = invoice?.message || `Provider HTTP ${providerStatus}`;
      }
    } catch (e) {
      providerErr = (e as Error).message || 'network error';
      errLog('provider fetch threw', providerErr);
    }

    // ----- Fallback: keep DB row, mark as provider-failed, return structured warning -----
    if (!invoice?.invoice_url) {
      const { error: providerUpdateErr } = await service.from('payments')
        .update({ status: 'pending_payment_provider_failed', raw_payload: { error: providerErr, invoice } })
        .eq('id', payRow.id);
      if (providerUpdateErr) errLog('provider failure status update failed', providerUpdateErr);
      errLog('provider failed', providerErr);
      return fail('PROVIDER_FAILED', providerErr ?? 'Unknown provider error', payRow.id);
    }

    const { error: invoiceUpdateErr } = await service.from('payments')
      .update({
        nowpayments_invoice_id: String(invoice.id),
        pay_address: invoice.pay_address ?? null,
        pay_amount: invoice.pay_amount ?? null,
        raw_payload: { ...invoice, invoice_url: invoice.invoice_url, client_nonce: clientNonce },
      })
      .eq('id', payRow.id);

    if (invoiceUpdateErr) {
      errLog('invoice db update failed', invoiceUpdateErr);
      return fail('DB_INVOICE_UPDATE_FAILED', invoiceUpdateErr.message, payRow.id);
    }

    return ok({
      order_id: payRow.id,
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      payment: { ...payRow, status: 'waiting' },
    });
  } catch (e) {
    errLog('unhandled', e);
    return fail('UNEXPECTED_ERROR', (e as Error)?.message ?? String(e));
  }
});
