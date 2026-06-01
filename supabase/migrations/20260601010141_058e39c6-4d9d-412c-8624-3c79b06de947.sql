-- Drop existing profiles and dependent objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Sequence for sequential SV-# player IDs
CREATE SEQUENCE IF NOT EXISTS public.player_id_seq START 1;

-- Profiles table (new schema)
CREATE TABLE public.profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_player TEXT NOT NULL UNIQUE,
  name_player TEXT NOT NULL DEFAULT 'Hunter',
  rank_player TEXT NOT NULL DEFAULT 'E',
  level_player INTEGER NOT NULL DEFAULT 1,
  hp_player INTEGER NOT NULL DEFAULT 100,
  mb_player INTEGER NOT NULL DEFAULT 50,
  gold_player INTEGER NOT NULL DEFAULT 0,
  void_player INTEGER NOT NULL DEFAULT 0,
  stats_player JSONB NOT NULL DEFAULT '{"STR":1,"AGI":1,"SPI":1,"MIN":1}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Gates table
CREATE TABLE public.gates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_gate TEXT NOT NULL,
  name_gate TEXT NOT NULL,
  rank_gate TEXT NOT NULL DEFAULT 'E',
  power_gate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, id_gate)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gates TO authenticated;
GRANT ALL ON public.gates TO service_role;

ALTER TABLE public.gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gates_select_own" ON public.gates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "gates_insert_own" ON public.gates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gates_update_own" ON public.gates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "gates_delete_own" ON public.gates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gates_updated_at BEFORE UPDATE ON public.gates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on new auth user with sequential SV-# id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  next_num BIGINT;
BEGIN
  next_num := nextval('public.player_id_seq');
  INSERT INTO public.profiles (user_id, id_player, name_player)
  VALUES (
    NEW.id,
    'SV-' || next_num::text,
    COALESCE(NEW.raw_user_meta_data->>'player_name', 'Hunter')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();