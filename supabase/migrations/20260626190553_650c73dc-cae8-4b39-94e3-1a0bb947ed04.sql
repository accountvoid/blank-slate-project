DO $$
BEGIN
  IF to_regclass('public.payments_legacy_backup_20260626') IS NOT NULL THEN
    REVOKE ALL ON public.payments_legacy_backup_20260626 FROM public, anon, authenticated;
    GRANT ALL ON public.payments_legacy_backup_20260626 TO service_role;
    ALTER TABLE public.payments_legacy_backup_20260626 ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;