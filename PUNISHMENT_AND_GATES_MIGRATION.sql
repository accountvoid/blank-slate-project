-- ============================================================
-- SETVOID — RUN THIS IN SUPABASE SQL EDITOR (one shot, idempotent)
-- Punishment hardening + Gates Catalog + Payments (NowPayments)
-- ============================================================

-- ---------- PUNISHMENT ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS punishment_reason text,
  ADD COLUMN IF NOT EXISTS last_daily_check timestamptz,
  ADD COLUMN IF NOT EXISTS punishment_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_deadline_at timestamptz;

CREATE OR REPLACE FUNCTION public.start_punishment(
  uid uuid, hours integer DEFAULT 4, reason text DEFAULT 'Missed daily required quests'
) RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  IF uid <> auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.profiles
     SET punishment_active=true, punishment_started_at=now(),
         punishment_end_at=now()+(hours||' hours')::interval,
         punishment_reason=reason,
         punishment_count=COALESCE(punishment_count,0)+1,
         hp_player=GREATEST(1, hp_player-50), hp_last_tick_at=now(),
         last_daily_check=now()
   WHERE user_id=uid RETURNING * INTO p;
  RETURN p;
END; $$;
GRANT EXECUTE ON FUNCTION public.start_punishment(uuid,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_and_apply_punishment(uid uuid)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; q jsonb; main_quests jsonb; total_main int; completed_main int; deadline timestamptz;
BEGIN
  IF uid <> auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id=uid;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Auto-clear when punishment expires.
  IF p.punishment_active AND p.punishment_end_at IS NOT NULL AND now() >= p.punishment_end_at THEN
    UPDATE public.profiles
       SET punishment_active=false, punishment_end_at=NULL, punishment_started_at=NULL,
           punishment_reason=NULL,
           daily_deadline_at=now()+interval '24 hours', last_daily_check=now()
     WHERE user_id=uid RETURNING * INTO p;
    RETURN p;
  END IF;

  IF p.punishment_active THEN RETURN p; END IF;

  q := COALESCE(p."Quests", '{}'::jsonb);
  main_quests := COALESCE(q->'mainQuests', '[]'::jsonb);

  IF jsonb_array_length(main_quests)=0 THEN
    IF p.daily_deadline_at IS NULL THEN
      UPDATE public.profiles
         SET daily_deadline_at=now()+interval '24 hours', last_daily_check=now()
       WHERE user_id=uid RETURNING * INTO p;
    END IF;
    RETURN p;
  END IF;

  deadline := COALESCE(p.daily_deadline_at, p.created_at+interval '24 hours');
  IF now() < deadline THEN
    UPDATE public.profiles SET last_daily_check=now() WHERE user_id=uid RETURNING * INTO p;
    RETURN p;
  END IF;

  SELECT jsonb_array_length(main_quests),
         (SELECT count(*) FROM jsonb_array_elements(main_quests) e WHERE (e->>'completed')::boolean=true)
    INTO total_main, completed_main;

  IF completed_main < total_main THEN
    UPDATE public.profiles
       SET punishment_active=true, punishment_started_at=now(),
           punishment_end_at=now()+interval '4 hours',
           punishment_reason='Daily required quests not completed before deadline',
           punishment_count=COALESCE(punishment_count,0)+1,
           hp_player=GREATEST(1, hp_player-50), hp_last_tick_at=now(),
           last_daily_check=now(), daily_deadline_at=now()+interval '24 hours'
     WHERE user_id=uid RETURNING * INTO p;
  ELSE
    UPDATE public.profiles
       SET last_daily_check=now(), daily_deadline_at=now()+interval '24 hours'
     WHERE user_id=uid RETURNING * INTO p;
  END IF;
  RETURN p;
END; $$;
GRANT EXECUTE ON FUNCTION public.check_and_apply_punishment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_punishment_drain(uid uuid)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  IF uid <> auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  PERFORM public.check_and_apply_punishment(uid);
  SELECT * INTO p FROM public.profiles WHERE user_id=uid;
  RETURN p;
END; $$;
GRANT EXECUTE ON FUNCTION public.apply_punishment_drain(uuid) TO authenticated;

-- ---------- GATES CATALOG ----------
CREATE TABLE IF NOT EXISTS public.gates_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_gate text NOT NULL UNIQUE,
  name_gate text NOT NULL,
  description text,
  rank_gate text NOT NULL DEFAULT 'E',
  gate_type text NOT NULL DEFAULT 'normal',
  image_url text,
  power_gate integer NOT NULL DEFAULT 0,
  required_level integer NOT NULL DEFAULT 1,
  required_rank text NOT NULL DEFAULT 'E',
  boss_name text, boss_hp integer, boss_attack integer,
  reward_gold integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  force_show boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  start_date timestamptz, end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gates_catalog TO authenticated, anon;
GRANT ALL ON public.gates_catalog TO service_role;

ALTER TABLE public.gates_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gates_catalog_select_public ON public.gates_catalog;
CREATE POLICY gates_catalog_select_public ON public.gates_catalog
  FOR SELECT TO authenticated, anon USING (is_hidden=false AND is_active=true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_gates_catalog_updated_at ON public.gates_catalog;
CREATE TRIGGER trg_gates_catalog_updated_at BEFORE UPDATE ON public.gates_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='gates_catalog') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.gates_catalog';
  END IF;
END $$;
ALTER TABLE public.gates_catalog REPLICA IDENTITY FULL;

INSERT INTO public.gates_catalog
  (id_gate,name_gate,description,rank_gate,gate_type,power_gate,required_level,required_rank,reward_gold,reward_xp) VALUES
  ('GATE-CAT-E','بوابة E','بوابة منخفضة الخطورة','E','normal',5,1,'E',50,100),
  ('GATE-CAT-D','بوابة D','بوابة بسيطة الخطورة','D','normal',10,10,'D',100,250),
  ('GATE-CAT-C','بوابة C','بوابة متوسطة الخطورة','C','normal',20,20,'C',200,500),
  ('GATE-CAT-B','بوابة B','بوابة عالية الخطورة','B','normal',35,35,'B',400,1000),
  ('GATE-CAT-A','بوابة A','بوابة خطرة جداً','A','boss',60,50,'A',0,2500),
  ('GATE-CAT-S','بوابة S','بوابة كارثية','S','boss',100,80,'S',0,10000)
ON CONFLICT (id_gate) DO NOTHING;

-- ---------- PAYMENTS (NowPayments) ----------
CREATE TABLE IF NOT EXISTS public.payments (
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT TO authenticated USING (user_id=auth.uid());

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='payments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  END IF;
END $$;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.credit_payment_gold(payment_id uuid)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pay public.payments;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE id=payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;
  IF pay.credited THEN RETURN pay; END IF;
  IF pay.status NOT IN ('finished','confirmed','sending') THEN
    RAISE EXCEPTION 'payment not in creditable state: %', pay.status;
  END IF;
  UPDATE public.profiles SET gold_player=COALESCE(gold_player,0)+pay.gold_amount
   WHERE user_id=pay.user_id;
  UPDATE public.payments SET credited=true WHERE id=payment_id RETURNING * INTO pay;
  RETURN pay;
END; $$;
REVOKE ALL ON FUNCTION public.credit_payment_gold(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_payment_gold(uuid) TO service_role;
