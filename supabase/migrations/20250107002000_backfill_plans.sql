-- Backfill default character_plans for existing characters
-- Idempotent: only inserts plans for characters without a plan
DO $$
BEGIN
  INSERT INTO public.character_plans (
    character_id,
    lv1_str, lv1_dex, lv1_con, lv1_int,
    lv1_skill,
    lv2_str, lv2_dex, lv2_con, lv2_int, lv2_skill,
    lv3_str, lv3_dex, lv3_con, lv3_int, lv3_skill
  )
  SELECT
    c.id,
    10, 10, 10, 10,
    NULL,
    NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL
  FROM public.characters c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.character_plans p WHERE p.character_id = c.id
  );
END $$;


