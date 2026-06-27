
-- ==========================================================
-- SETVOID Advertisement System
-- ==========================================================

-- Enums
DO $$ BEGIN CREATE TYPE public.ad_type AS ENUM ('banner','video','sponsored_mission'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ad_status AS ENUM ('active','inactive','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ad_banner_size AS ENUM ('horizontal','square','full_width'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ad_category AS ENUM ('strength','mind','spirit','agility'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ad_event_type AS ENUM ('view','click','start','complete','claim'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ad_packages
CREATE TABLE IF NOT EXISTS public.ad_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 0,
  gold_reward integer NOT NULL DEFAULT 0,
  priority_boost integer NOT NULL DEFAULT 0,
  max_duration_days integer NOT NULL DEFAULT 7,
  max_impressions integer,
  max_sponsored_missions integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_packages TO anon, authenticated;
GRANT ALL ON public.ad_packages TO service_role;
ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ad_packages_read_active ON public.ad_packages;
CREATE POLICY ad_packages_read_active ON public.ad_packages
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- ads
CREATE TABLE IF NOT EXISTS public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.ad_type NOT NULL,
  status public.ad_status NOT NULL DEFAULT 'active',
  package_id uuid REFERENCES public.ad_packages(id) ON DELETE SET NULL,
  placement text NOT NULL DEFAULT 'home',
  banner_size public.ad_banner_size,
  category public.ad_category,
  priority integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  advertiser_name text,
  advertiser_logo_url text,
  sponsor_name text,
  sponsor_logo_url text,
  title text NOT NULL,
  subtitle text,
  description text,
  image_url text,
  video_url text,
  video_thumbnail_url text,
  skip_after_seconds integer,
  button_text text,
  destination_url text,
  internal_route text,
  xp_reward integer NOT NULL DEFAULT 0,
  gold_reward integer NOT NULL DEFAULT 0,
  reward_multiplier numeric(5,2) NOT NULL DEFAULT 1.0,
  mission_duration_minutes integer,
  repeat_interval_hours integer,
  difficulty text,
  completion_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  views_count integer NOT NULL DEFAULT 0,
  unique_views_count integer NOT NULL DEFAULT 0,
  clicks_count integer NOT NULL DEFAULT 0,
  mission_starts_count integer NOT NULL DEFAULT 0,
  mission_completions_count integer NOT NULL DEFAULT 0,
  reward_claims_count integer NOT NULL DEFAULT 0,
  total_xp_granted integer NOT NULL DEFAULT 0,
  total_gold_granted integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  last_clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ads_active_lookup_idx ON public.ads (type, placement, status, priority DESC, display_order ASC);
CREATE INDEX IF NOT EXISTS ads_category_idx ON public.ads (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS ads_window_idx ON public.ads (start_at, end_at);
GRANT SELECT ON public.ads TO anon, authenticated;
GRANT ALL  ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ads_read_active_window ON public.ads;
CREATE POLICY ads_read_active_window ON public.ads
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND start_at <= now() AND (end_at IS NULL OR end_at > now()));

-- ad_events
CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type public.ad_event_type NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_events_ad_idx ON public.ad_events (ad_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_events_user_idx ON public.ad_events (user_id) WHERE user_id IS NOT NULL;
GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT ALL ON public.ad_events TO service_role;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ad_events_insert_own ON public.ad_events;
CREATE POLICY ad_events_insert_own ON public.ad_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS ad_events_select_own ON public.ad_events;
CREATE POLICY ad_events_select_own ON public.ad_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_ads_updated_at ON public.ads;
CREATE TRIGGER trg_ads_updated_at BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_ad_packages_updated_at ON public.ad_packages;
CREATE TRIGGER trg_ad_packages_updated_at BEFORE UPDATE ON public.ad_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ads'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_packages'; EXCEPTION WHEN others THEN NULL; END $$;

-- Storage policy: public read of ad-media bucket
DROP POLICY IF EXISTS "ad-media public read" ON storage.objects;
CREATE POLICY "ad-media public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ad-media');

-- Seed packages
INSERT INTO public.ad_packages (name, slug, price_usd, xp_reward, gold_reward, priority_boost, max_duration_days, max_impressions, max_sponsored_missions) VALUES
  ('Basic','basic',9.99,25,10,1,7,10000,1),
  ('Standard','standard',29.99,75,50,5,30,50000,3),
  ('Premium','premium',99.99,250,200,20,90,250000,10),
  ('Legendary','legendary',299.99,1000,750,100,365,NULL,50)
ON CONFLICT (slug) DO NOTHING;
