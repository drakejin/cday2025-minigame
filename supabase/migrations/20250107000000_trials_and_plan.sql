-- Trials and Character Plan schema for GameRule.md (3 Trials, 4 Stats, Level rules)
-- idempotent guards

-- 1) character_plans: store Lv1~Lv3 planned stats and skills
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'character_plans'
  ) THEN
    CREATE TABLE public.character_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
      -- Level 1 base stats and skill
      lv1_str INTEGER NOT NULL DEFAULT 10,
      lv1_dex INTEGER NOT NULL DEFAULT 10,
      lv1_con INTEGER NOT NULL DEFAULT 10,
      lv1_int INTEGER NOT NULL DEFAULT 10,
      lv1_skill TEXT,
      -- Level 2 planned stats (after +1/+1 distributed) and skill
      lv2_str INTEGER,
      lv2_dex INTEGER,
      lv2_con INTEGER,
      lv2_int INTEGER,
      lv2_skill TEXT,
      -- Level 3 planned stats (after +1/+1 distributed twice) and skill
      lv3_str INTEGER,
      lv3_dex INTEGER,
      lv3_con INTEGER,
      lv3_int INTEGER,
      lv3_skill TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_character_plan UNIQUE (character_id)
    );

    -- updated_at trigger
    CREATE TRIGGER update_character_plans_updated_at
      BEFORE UPDATE ON public.character_plans
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 2) Extend characters with new 4-stat fields (non-breaking, keep old fields)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='characters' AND column_name='dexterity') THEN
    ALTER TABLE public.characters ADD COLUMN dexterity INTEGER DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='characters' AND column_name='constitution') THEN
    ALTER TABLE public.characters ADD COLUMN constitution INTEGER DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='characters' AND column_name='intelligence') THEN
    ALTER TABLE public.characters ADD COLUMN intelligence INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- 3) trials: per-round trial definitions (trial_no 1..3, level 1..3, weight multiplier 1/2/4)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trials'
  ) THEN
    CREATE TABLE public.trials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
      trial_no SMALLINT NOT NULL CHECK (trial_no IN (1,2,3)),
      level SMALLINT NOT NULL CHECK (level IN (1,2,3)),
      weight_multiplier SMALLINT NOT NULL DEFAULT 1 CHECK (weight_multiplier IN (1,2,3,4)),
      status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','completed','cancelled')),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_trial_per_round UNIQUE (round_id, trial_no)
    );

    CREATE TRIGGER update_trials_updated_at
      BEFORE UPDATE ON public.trials
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 4) trial_results: per character per trial scored result, linked to prompt_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trial_results'
  ) THEN
    CREATE TABLE public.trial_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trial_id UUID NOT NULL REFERENCES public.trials(id) ON DELETE CASCADE,
      character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      prompt_history_id UUID NOT NULL REFERENCES public.prompt_history(id) ON DELETE CASCADE,
      -- sub-scores for transparency (optional)
      score_strength INTEGER NOT NULL DEFAULT 0,
      score_dexterity INTEGER NOT NULL DEFAULT 0,
      score_constitution INTEGER NOT NULL DEFAULT 0,
      score_intelligence INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      weighted_total INTEGER NOT NULL DEFAULT 0,
      needs_revalidation BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_result_per_trial UNIQUE (trial_id, character_id)
    );

    CREATE INDEX idx_trial_results_character ON public.trial_results(character_id);
    CREATE INDEX idx_trial_results_trial ON public.trial_results(trial_id);
    CREATE INDEX idx_trial_results_user ON public.trial_results(user_id);

    CREATE TRIGGER update_trial_results_updated_at
      BEFORE UPDATE ON public.trial_results
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 5) Realtime publications (optional; safe if already added)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.trials';
  EXCEPTION WHEN others THEN
    -- ignore if already added
    NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.trial_results';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- 6) Stale marking function: when character_plans updated, mark related trial_results as needs_revalidation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'mark_trial_results_stale'
  ) THEN
    CREATE OR REPLACE FUNCTION public.mark_trial_results_stale()
    RETURNS TRIGGER AS $fn$
    BEGIN
      UPDATE public.trial_results
      SET needs_revalidation = true
      WHERE character_id = NEW.character_id;
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_mark_trial_results_stale
      AFTER UPDATE ON public.character_plans
      FOR EACH ROW
      EXECUTE FUNCTION public.mark_trial_results_stale();
  END IF;
END $$;

-- 7) Helper view for leaderboard aggregation (weighted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_weighted_scores'
  ) THEN
    CREATE OR REPLACE VIEW public.v_weighted_scores AS
    SELECT
      tr.character_id,
      SUM(tr.weighted_total) AS weighted_total
    FROM public.trial_results tr
    GROUP BY tr.character_id;
  END IF;
END $$;


