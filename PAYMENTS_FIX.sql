-- ============================================================
-- SETVOID — Clean Payments fix (run in Supabase SQL Editor)
-- Resolves: "column user_id does not exist" — the old payments table
-- was created with a different schema. We drop and recreate cleanly.
-- Safe to re-run.
-- ============================================================

-- 0) Drop the broken/legacy table (no production data yet).
DROP TABLE IF EXISTS public.payments CASCADE;

-- 1) Recreate cleanly.
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nowpayments_invoice_id text UNIQUE,
  nowpayments_payment_id text UNIQUE,
  amount_usd numeric(12,2) NOT NULL,
  gold_amount integer NOT NULL,
  pay_currency text NOT NULL,
  pay_address text,
  pay_amount numeric(20,8),
  tx_hash text,
  status text NOT NULL DEFAULT 'waiting',
  raw_payload jsonb,
  credited boolean NOT NULL DEFAULT false,
  provider text NOT NULL DEFAULT 'nowpayments',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user   ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- 2) Grants — Data API requires these in addition to RLS.
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- 3) RLS — full CRUD policy set keyed on auth.uid().
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select_own ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY payments_insert_own ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY payments_update_own ON public.payments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4) updated_at trigger.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Realtime for live status updates.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='payments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  END IF;
END $$;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- 6) Service-role RPC: atomically credit gold when payment confirmed.
CREATE OR REPLACE FUNCTION public.credit_payment_gold(payment_id uuid)
RETURNS public.payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pay public.payments;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE id = payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;
  IF pay.credited THEN RETURN pay; END IF;
  IF pay.status NOT IN ('finished','confirmed','sending') THEN
    RAISE EXCEPTION 'payment not in creditable state: %', pay.status;
  END IF;
  UPDATE public.profiles
     SET gold_player = COALESCE(gold_player,0) + pay.gold_amount
   WHERE user_id = pay.user_id;
  UPDATE public.payments SET credited = true WHERE id = payment_id RETURNING * INTO pay;
  RETURN pay;
END; $$;
REVOKE ALL ON FUNCTION public.credit_payment_gold(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_payment_gold(uuid) TO service_role;
