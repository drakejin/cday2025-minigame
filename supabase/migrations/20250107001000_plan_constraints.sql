-- Additional constraints for character_plans (max 20 per stat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_character_plans_max20_lv1'
  ) THEN
    ALTER TABLE public.character_plans
      ADD CONSTRAINT chk_character_plans_max20_lv1
      CHECK (
        lv1_str <= 20 AND lv1_dex <= 20 AND lv1_con <= 20 AND lv1_int <= 20
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_character_plans_max20_lv2'
  ) THEN
    ALTER TABLE public.character_plans
      ADD CONSTRAINT chk_character_plans_max20_lv2
      CHECK (
        (lv2_str IS NULL OR lv2_str <= 20) AND
        (lv2_dex IS NULL OR lv2_dex <= 20) AND
        (lv2_con IS NULL OR lv2_con <= 20) AND
        (lv2_int IS NULL OR lv2_int <= 20)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_character_plans_max20_lv3'
  ) THEN
    ALTER TABLE public.character_plans
      ADD CONSTRAINT chk_character_plans_max20_lv3
      CHECK (
        (lv3_str IS NULL OR lv3_str <= 20) AND
        (lv3_dex IS NULL OR lv3_dex <= 20) AND
        (lv3_con IS NULL OR lv3_con <= 20) AND
        (lv3_int IS NULL OR lv3_int <= 20)
      );
  END IF;
END $$;


