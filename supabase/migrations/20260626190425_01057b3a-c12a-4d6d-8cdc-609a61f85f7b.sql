-- ============================================================
-- SETVOID — Rebuild payments with guaranteed user_id
-- Fixes legacy/broken payments schemas where public.payments.user_id
-- does not exist, which breaks create-payment and gold crediting.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL
     AND to_regclass('public.payments_legacy_backup_20260626') IS NULL THEN
    EXECUTE 'CREATE TABLE public.payments_legacy_backup_20260626 AS TABLE public.payments';
  END IF;
END $$;

DROP TABLE IF EXISTS public.payments CASCADE;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL DEFAULT 'nowpayments',
  nowpayments_invoice_id text UNIQUE,
  nowpayments_payment_id text UNIQUE,
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd > 0),
  gold_amount integer NOT NULL CHECK (gold_amount > 0),
  pay_currency text NOT NULL,
  pay_address text,
  pay_amount numeric(20,8),
  tx_hash text,
  status text NOT NULL DEFAULT 'waiting',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  credited boolean NOT NULL DEFAULT false,
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_payments_user_status_created ON public.payments(user_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  END IF;
END $$;

ALTER TABLE public.payments REPLICA IDENTITY FULL;

CREATE SEQUENCE IF NOT EXISTS public.player_id_seq START 1;

DO $$
DECLARE
  next_player_num bigint;
BEGIN
  SELECT COALESCE(MAX(REPLACE(id_player, 'SV-', '')::bigint), 0) + 1
    INTO next_player_num
    FROM public.profiles
   WHERE id_player ~ '^SV-[0-9]+$';

  PERFORM setval('public.player_id_seq', GREATEST(next_player_num, 1), false);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.credit_payment_gold(payment_id uuid)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pay public.payments;
BEGIN
  SELECT * INTO pay
    FROM public.payments
   WHERE id = payment_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment not found';
  END IF;

  IF pay.credited THEN
    RETURN pay;
  END IF;

  IF pay.status NOT IN ('finished', 'confirmed', 'sending') THEN
    RAISE EXCEPTION 'payment not in creditable state: %', pay.status;
  END IF;

  INSERT INTO public.profiles (user_id, id_player, name_player)
  VALUES (pay.user_id, 'SV-' || nextval('public.player_id_seq')::text, 'Hunter')
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
     SET gold_player = COALESCE(gold_player, 0) + pay.gold_amount
   WHERE user_id = pay.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found and could not be created for user %', pay.user_id;
  END IF;

  UPDATE public.payments
     SET credited = true,
         credited_at = now()
   WHERE id = payment_id
   RETURNING * INTO pay;

  RETURN pay;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_payment_gold(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_payment_gold(uuid) TO service_role;