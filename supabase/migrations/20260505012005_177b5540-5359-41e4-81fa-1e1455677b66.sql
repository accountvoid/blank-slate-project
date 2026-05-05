-- Sequential player_id: SV-1, SV-2, SV-3...
CREATE SEQUENCE IF NOT EXISTS public.player_id_seq START WITH 1 INCREMENT BY 1;

-- Reassign existing rows in created_at order so numbering is stable
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.profiles
)
UPDATE public.profiles p
SET player_id = 'SV-' || ordered.rn
FROM ordered
WHERE p.id = ordered.id;

-- Advance sequence past existing rows
SELECT setval('public.player_id_seq', GREATEST((SELECT count(*) FROM public.profiles), 1));

-- Change default to draw from sequence
ALTER TABLE public.profiles
  ALTER COLUMN player_id SET DEFAULT ('SV-' || nextval('public.player_id_seq'));