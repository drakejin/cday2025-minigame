# Database Schema

## Overview
PostgreSQL database schema for Character Battle game service.

---

## Tables

### 1. profiles
User profile information synced with Supabase Auth.

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name varchar NOT NULL,
  avatar_url text,
  email varchar NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

**Columns:**
- `id`: User UUID (from auth.users)
- `display_name`: User's display name
- `avatar_url`: Profile image URL
- `email`: User email (unique)
- `role`: User role (user/admin/super_admin)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

---

### 2. characters
User's game character with current prompt.

```sql
CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name varchar NOT NULL,
  current_prompt text NOT NULL CHECK (char_length(current_prompt) <= 30),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT characters_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**Columns:**
- `id`: Character UUID
- `user_id`: Owner user ID
- `name`: Character name
- `current_prompt`: Latest prompt (max 30 chars)
- `is_active`: Active status (false when banned)
- `created_at`: Character creation timestamp
- `updated_at`: Last update timestamp

---

### 3. character_plans
Character's stat distribution plan for 3 levels.

```sql
CREATE TABLE public.character_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL UNIQUE,
  
  -- Level 1
  lv1_str integer NOT NULL DEFAULT 10,
  lv1_dex integer NOT NULL DEFAULT 10,
  lv1_con integer NOT NULL DEFAULT 10,
  lv1_int integer NOT NULL DEFAULT 10,
  lv1_skill text,
  
  -- Level 2
  lv2_str integer,
  lv2_dex integer,
  lv2_con integer,
  lv2_int integer,
  lv2_skill text,
  
  -- Level 3
  lv3_str integer,
  lv3_dex integer,
  lv3_con integer,
  lv3_int integer,
  lv3_skill text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  game_round integer,
  trial_no integer
  
  CONSTRAINT character_plans_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
```

**Columns:**
- `character_id`: Character UUID (unique, 1:1 relationship)
- `lv1_*`: Level 1 stats (STR, DEX, CON, INT) and skill
- `lv2_*`: Level 2 stats and skill
- `lv3_*`: Level 3 stats and skill

---

### 4. game_rounds
Game round management with admin tracking.

```sql
CREATE TABLE public.game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL UNIQUE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  actual_end_time timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  status varchar NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  started_by uuid,
  ended_by uuid,
  trial_text text,
  trial_no integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns:**
- `round_number`: Sequential round number (unique)
- `start_time`: Scheduled start time
- `end_time`: Scheduled end time
- `actual_end_time`: Actual end time (when manually ended)
- `is_active`: Current active status
- `status`: Round status (scheduled/active/completed/cancelled)
- `started_by`: Admin who started the round
- `ended_by`: Admin who ended the round
- `trial_text`: Trial description text

---

### 5. prompt_history
History of all submitted prompts with AI-generated stats.

```sql
CREATE TABLE public.prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL,
  user_id uuid NOT NULL,
  prompt text NOT NULL CHECK (char_length(prompt) <= 30),
  round_number integer NOT NULL,
  
  -- AI-generated stats
  str integer,
  dex integer,
  con integer,
  int integer,
  skill text,
  
  -- Soft delete
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_by uuid,
  deleted_at timestamptz,
  delete_reason text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT prompt_history_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT prompt_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**Columns:**
- `prompt`: User's submitted prompt (max 30 chars)
- `round_number`: Round when submitted
- `str/dex/con/int`: AI-generated stat gains
- `skill`: AI-generated skill description
- `is_deleted`: Soft delete flag
- `deleted_by`: Admin who deleted
- `deleted_at`: Deletion timestamp
- `delete_reason`: Reason for deletion

---

### 6. leaderboard_snapshots
Snapshot of leaderboard at round end.

```sql
CREATE TABLE public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL,
  character_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rank integer NOT NULL,
  total_score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT leaderboard_snapshots_round_number_fkey 
    FOREIGN KEY (round_number) REFERENCES public.game_rounds(round_number),
  CONSTRAINT leaderboard_snapshots_character_id_fkey 
    FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT leaderboard_snapshots_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**Columns:**
- `round_number`: Round number
- `character_id`: Character UUID
- `user_id`: User UUID
- `rank`: Final rank in the round
- `total_score`: Total score at round end

---

### 7. admin_audit_log
Audit log for all admin actions.

```sql
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action varchar NOT NULL,
  resource_type varchar NOT NULL,
  resource_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns:**
- `admin_id`: Admin user ID
- `action`: Action type (START_ROUND, END_ROUND, DELETE_PROMPT, etc.)
- `resource_type`: Resource type (game_rounds, prompt_history, etc.)
- `resource_id`: Resource UUID
- `changes`: JSONB of before/after changes
- `ip_address`: Admin's IP address
- `user_agent`: Admin's user agent

---

## Relationships

```
auth.users (Supabase Auth)
  └─→ profiles (1:1)
       └─→ characters (1:N)
            ├─→ character_plans (1:1)
            ├─→ prompt_history (1:N)
            └─→ leaderboard_snapshots (1:N)

game_rounds
  └─→ leaderboard_snapshots (1:N)
```

---

## Indexes

Recommended indexes for performance:

```sql
-- Characters
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_is_active ON characters(is_active);

-- Prompt History
CREATE INDEX idx_prompt_history_character_id ON prompt_history(character_id);
CREATE INDEX idx_prompt_history_round_number ON prompt_history(round_number);
CREATE INDEX idx_prompt_history_is_deleted ON prompt_history(is_deleted);

-- Game Rounds
CREATE INDEX idx_game_rounds_is_active ON game_rounds(is_active);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);

-- Leaderboard Snapshots
CREATE INDEX idx_leaderboard_snapshots_round_number ON leaderboard_snapshots(round_number);
CREATE INDEX idx_leaderboard_snapshots_rank ON leaderboard_snapshots(rank);

-- Admin Audit Log
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);
```

---

## Notes

- All timestamps use `timestamptz` (timestamp with time zone)
- UUIDs are generated with `gen_random_uuid()`
- Soft delete pattern used for `prompt_history`
- Foreign keys ensure referential integrity
- Check constraints validate data (e.g., prompt length, status values)