# Database Schema

> **WARNING**: This schema is for reference only and is not meant to be executed directly.
> Table order and constraints may not be valid for execution.

---

## 1. profiles

User profiles (1:1 with auth.users)

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name character varying NOT NULL,
  avatar_url text,
  email character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role USER-DEFINED NOT NULL DEFAULT 'user'::user_role,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

---

## 2. characters

Character information (one active character per user)

```sql
CREATE TABLE public.characters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  current_prompt text NOT NULL CHECK (char_length(current_prompt) <= 30),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT characters_pkey PRIMARY KEY (id),
  CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

---

## 3. character_plans

Character growth plans (Lv1~Lv3 stats/skills)

```sql
CREATE TABLE public.character_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL UNIQUE,
  lv1_str integer NOT NULL DEFAULT 10,
  lv1_dex integer NOT NULL DEFAULT 10,
  lv1_con integer NOT NULL DEFAULT 10,
  lv1_int integer NOT NULL DEFAULT 10,
  lv1_skill text,
  lv2_str integer,
  lv2_dex integer,
  lv2_con integer,
  lv2_int integer,
  lv2_skill text,
  lv3_str integer,
  lv3_dex integer,
  lv3_con integer,
  lv3_int integer,
  lv3_skill text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT character_plans_pkey PRIMARY KEY (id),
  CONSTRAINT character_plans_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
```

---

## 4. game_rounds

Game rounds (admin managed)

```sql
CREATE TABLE public.game_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  round_number integer NOT NULL UNIQUE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  actual_end_time timestamp with time zone,
  is_active boolean NOT NULL DEFAULT false,
  status character varying NOT NULL DEFAULT 'scheduled'::character varying
    CHECK (status::text = ANY (ARRAY[
      'scheduled'::character varying,
      'active'::character varying,
      'completed'::character varying,
      'cancelled'::character varying
    ]::text[])),
  started_by uuid,
  ended_by uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT game_rounds_pkey PRIMARY KEY (id)
);
```

---

## 5. trials

Round trials (1~3 per round)

```sql
CREATE TABLE public.trials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL,
  trial_no smallint NOT NULL CHECK (trial_no = ANY (ARRAY[1, 2, 3])),
  status character varying NOT NULL DEFAULT 'scheduled'::character varying
    CHECK (status::text = ANY (ARRAY[
      'scheduled'::character varying,
      'active'::character varying,
      'completed'::character varying,
      'cancelled'::character varying
    ]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  trial_text text,
  CONSTRAINT trials_pkey PRIMARY KEY (id),
  CONSTRAINT trials_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.game_rounds(id)
);
```

---

## 6. prompt_history

Prompt submission history (one per round per character)

```sql
CREATE TABLE public.prompt_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL,
  user_id uuid NOT NULL,
  prompt text NOT NULL CHECK (char_length(prompt) <= 30),
  round_number integer NOT NULL,
  strength_gained integer NOT NULL DEFAULT 0,
  charm_gained integer NOT NULL DEFAULT 0,
  creativity_gained integer NOT NULL DEFAULT 0,
  total_score_gained integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_by uuid,
  deleted_at timestamp with time zone,
  delete_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_history_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_history_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT prompt_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

---

## 7. trial_results

Trial evaluation results (scores per trial)

```sql
CREATE TABLE public.trial_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trial_id uuid NOT NULL,
  character_id uuid NOT NULL,
  user_id uuid NOT NULL,
  prompt_history_id uuid NOT NULL,
  score_str integer NOT NULL DEFAULT 0,
  score_dex integer NOT NULL DEFAULT 0,
  score_con integer NOT NULL DEFAULT 0,
  score_int integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  needs_revalidation boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trial_results_pkey PRIMARY KEY (id),
  CONSTRAINT trial_results_trial_id_fkey FOREIGN KEY (trial_id) REFERENCES public.trials(id),
  CONSTRAINT trial_results_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT trial_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT trial_results_prompt_history_id_fkey FOREIGN KEY (prompt_history_id) REFERENCES public.prompt_history(id)
);
```

---

## 8. leaderboard_snapshots

Round leaderboard snapshots

```sql
CREATE TABLE public.leaderboard_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  round_number integer NOT NULL,
  character_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rank integer NOT NULL,
  total_score integer NOT NULL,
  trial_no smallint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leaderboard_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT leaderboard_snapshots_round_number_fkey FOREIGN KEY (round_number) REFERENCES public.game_rounds(round_number),
  CONSTRAINT leaderboard_snapshots_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT leaderboard_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

---

## 9. admin_audit_log

Admin action tracking log

```sql
CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action character varying NOT NULL,
  resource_type character varying NOT NULL,
  resource_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
);
```