
-- =========================================
-- PHASE 1: SECURITY FOUNDATION
-- =========================================

-- Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'moderator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','moderator')
  )
$$;

CREATE POLICY "users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "super_admin manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "super_admin inserts audit" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Generic audit trigger for content tables
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_before jsonb;
  v_after jsonb;
  v_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD); v_after := NULL; v_id := (OLD).id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD); v_after := to_jsonb(NEW); v_id := (NEW).id::text;
  ELSE
    v_before := NULL; v_after := to_jsonb(NEW); v_id := (NEW).id::text;
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, table_name, record_id, before, after)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_id, v_before, v_after);
  RETURN COALESCE(NEW, OLD);
END $$;

-- system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "super_admin writes settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- =========================================
-- PHASE 2: CONTENT TABLES
-- =========================================

CREATE OR REPLACE FUNCTION public._touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Reusable quest schema
CREATE TABLE IF NOT EXISTS public.main_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'easy',
  estimated_minutes int NOT NULL DEFAULT 10,
  xp_reward int NOT NULL DEFAULT 0,
  gold_reward int NOT NULL DEFAULT 0,
  warning_ar text,
  warning_en text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  rewards jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.main_quests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.main_quests TO authenticated;
GRANT ALL ON public.main_quests TO service_role;
ALTER TABLE public.main_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "main_quests public read active" ON public.main_quests FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "main_quests super_admin write" ON public.main_quests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER main_quests_touch BEFORE UPDATE ON public.main_quests FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER main_quests_audit AFTER INSERT OR UPDATE OR DELETE ON public.main_quests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TABLE IF NOT EXISTS public.side_quests (LIKE public.main_quests INCLUDING ALL);
GRANT SELECT ON public.side_quests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.side_quests TO authenticated;
GRANT ALL ON public.side_quests TO service_role;
ALTER TABLE public.side_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "side_quests public read active" ON public.side_quests FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "side_quests super_admin write" ON public.side_quests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER side_quests_touch BEFORE UPDATE ON public.side_quests FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER side_quests_audit AFTER INSERT OR UPDATE OR DELETE ON public.side_quests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- grand_quests
CREATE TABLE IF NOT EXISTS public.grand_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  banner text,
  image text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rewards jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority int NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.grand_quests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.grand_quests TO authenticated;
GRANT ALL ON public.grand_quests TO service_role;
ALTER TABLE public.grand_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grand_quests public read active" ON public.grand_quests FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "grand_quests super_admin write" ON public.grand_quests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER grand_quests_touch BEFORE UPDATE ON public.grand_quests FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER grand_quests_audit AFTER INSERT OR UPDATE OR DELETE ON public.grand_quests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- admin_gates (global gate templates, distinct from per-player `gates`)
CREATE TABLE IF NOT EXISTS public.admin_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rank text NOT NULL DEFAULT 'E',
  description text,
  image text,
  background text,
  rewards jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_level int NOT NULL DEFAULT 1,
  cooldown_minutes int NOT NULL DEFAULT 0,
  drops jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulty text NOT NULL DEFAULT 'normal',
  open_time timestamptz,
  close_time timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_gates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.admin_gates TO authenticated;
GRANT ALL ON public.admin_gates TO service_role;
ALTER TABLE public.admin_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gates public read enabled" ON public.admin_gates FOR SELECT USING (enabled OR public.is_admin(auth.uid()));
CREATE POLICY "admin_gates super_admin write" ON public.admin_gates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER admin_gates_touch BEFORE UPDATE ON public.admin_gates FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER admin_gates_audit AFTER INSERT OR UPDATE OR DELETE ON public.admin_gates FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- items (main + side share schema)
CREATE TABLE IF NOT EXISTS public.main_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rarity text NOT NULL DEFAULT 'common',
  category text NOT NULL DEFAULT 'misc',
  image text,
  effect jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration int,
  stackable boolean NOT NULL DEFAULT true,
  sell_price int NOT NULL DEFAULT 0,
  buy_price int NOT NULL DEFAULT 0,
  tradable boolean NOT NULL DEFAULT true,
  drop_rate numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.main_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.main_items TO authenticated;
GRANT ALL ON public.main_items TO service_role;
ALTER TABLE public.main_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "main_items public read active" ON public.main_items FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "main_items super_admin write" ON public.main_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER main_items_touch BEFORE UPDATE ON public.main_items FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER main_items_audit AFTER INSERT OR UPDATE OR DELETE ON public.main_items FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TABLE IF NOT EXISTS public.side_items (LIKE public.main_items INCLUDING ALL);
GRANT SELECT ON public.side_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.side_items TO authenticated;
GRANT ALL ON public.side_items TO service_role;
ALTER TABLE public.side_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "side_items public read active" ON public.side_items FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "side_items super_admin write" ON public.side_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER side_items_touch BEFORE UPDATE ON public.side_items FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER side_items_audit AFTER INSERT OR UPDATE OR DELETE ON public.side_items FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  banner text,
  image text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  rewards jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility text NOT NULL DEFAULT 'public',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read enabled" ON public.events FOR SELECT USING (enabled OR public.is_admin(auth.uid()));
CREATE POLICY "events super_admin write" ON public.events
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();
CREATE TRIGGER events_audit AFTER INSERT OR UPDATE OR DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Dashboard stats RPC (SECURITY DEFINER, admin-only)
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM auth.users),
    'today_registrations', (SELECT count(*) FROM auth.users WHERE created_at::date = current_date),
    'today_logins', (SELECT count(*) FROM auth.users WHERE last_sign_in_at::date = current_date),
    'total_gold', (SELECT COALESCE(sum(gold_player),0) FROM public.profiles),
    'total_gates', (SELECT count(*) FROM public.admin_gates),
    'total_main_quests', (SELECT count(*) FROM public.main_quests),
    'total_side_quests', (SELECT count(*) FROM public.side_quests),
    'total_events', (SELECT count(*) FROM public.events),
    'total_purchases', (SELECT count(*) FROM public.payments WHERE credited = true),
    'revenue_usd', (SELECT COALESCE(sum(amount_usd),0) FROM public.payments WHERE credited = true)
  ) INTO result;
  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
