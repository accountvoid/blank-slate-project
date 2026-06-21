// SETVOID — Create a NowPayments invoice for a Gold package.
// POST { gold_amount, amount_usd, pay_currency } -> { invoice_url, payment_id }
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const ALLOWED_OFFERS = [
  { gold: 1000,  usd: 1 },
  { gold: 5000,  usd: 4 },
  { gold: 15000, usd: 10 },
  { gold: 50000, usd: 30 },
];
const ALLOWED_CURRENCIES = new Set(['usdttrc20', 'usdtbsc', 'usdterc20']);

const Body = z.object({
  gold_amount: z.number().int().positive(),
  amount_usd: z.number().positive(),
  pay_currency: z.string().refine(v => ALLOWED_CURRENCIES.has(v.toLowerCase()), 'unsupported currency'),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: cErr } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (cErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { gold_amount, amount_usd } = parsed.data;
    const pay_currency = parsed.data.pay_currency.toLowerCase();

    // Enforce known offers — block tampering.
    const offer = ALLOWED_OFFERS.find(o => o.gold === gold_amount && o.usd === amount_usd);
    if (!offer) return json({ error: 'Invalid offer' }, 400);

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) return json({ error: 'Payment provider not configured' }, 500);

    // Create a NowPayments invoice (hosted checkout) — simpler than payments API,
    // and we still get IPN callbacks. https://documenter.getpostman.com/view/7907941/2s93JusNJt
    const projectUrl = Deno.env.get('SUPABASE_URL')!;
    const ipnUrl = `${projectUrl.replace(/\/$/, '')}/functions/v1/nowpayments-webhook`;

    // Insert payment row FIRST so order_id ties webhook back to it.
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: payRow, error: payErr } = await service
      .from('payments')
      .insert({ user_id: userId, amount_usd, gold_amount, pay_currency, status: 'waiting' })
      .select('*')
      .single();
    if (payErr) return json({ error: payErr.message }, 500);

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
        success_url: `${req.headers.get('origin') ?? ''}/?payment=success`,
        cancel_url: `${req.headers.get('origin') ?? ''}/?payment=cancel`,
      }),
    });
    const invoice = await invoiceRes.json();
    if (!invoiceRes.ok) {
      await service.from('payments').update({ status: 'failed', raw_payload: invoice }).eq('id', payRow.id);
      return json({ error: 'Invoice creation failed', detail: invoice }, 502);
    }

    await service.from('payments')
      .update({ nowpayments_invoice_id: String(invoice.id), raw_payload: invoice })
      .eq('id', payRow.id);

    return json({
      payment_id: payRow.id,
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
    });
  } catch (e) {
    console.error('create-payment error', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
