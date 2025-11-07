# Database Design

## Overview
Supabase PostgreSQL 기반 데이터베이스 설계

**핵심 원칙:**
- 모든 비즈니스 로직은 Supabase Edge Functions (Deno)에서 처리
- DB는 데이터 저장 + 기본 제약조건만 담당
- **프론트엔드는 DB에 직접 접근 금지 - 모든 요청은 Edge Functions를 통해서만**
- 읽기/쓰기 모든 작업은 Edge Functions API를 통해서만 수행

---

## Tables

### 1. profiles
사용자 프로필 (auth.users와 1:1, Google OAuth 로그인)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_email ON profiles(email);
```

**필드 설명:**
- `display_name`: 닉네임 (구글 이름 또는 사용자가 설정)
- `email`: 구글 계정 이메일
- `avatar_url`: 구글 프로필 이미지

### 2. characters
캐릭터 정보 (사용자당 활성 캐릭터 1개)

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  current_prompt TEXT NOT NULL CHECK (char_length(current_prompt) <= 30),
  total_score INTEGER DEFAULT 0 NOT NULL,
  strength INTEGER DEFAULT 0 NOT NULL,
  charm INTEGER DEFAULT 0 NOT NULL,
  creativity INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- One active character per user constraint (partial unique index)
CREATE UNIQUE INDEX idx_one_active_character_per_user
  ON characters(user_id)
  WHERE is_active = true;

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_total_score ON characters(total_score DESC);
CREATE INDEX idx_characters_is_active ON characters(is_active) WHERE is_active = true;
```

**중요:** `one_active_character_per_user` - 사용자당 활성 캐릭터 1개만 허용

### 3. admin_users
Admin 권한 관리

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin' NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{"rounds": true, "users": true, "stats": true}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_admin_users_profile_id ON admin_users(profile_id);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;
```

**권한 등급:**
- `super_admin`: 모든 권한 (Admin 계정 생성/삭제 포함)
- `admin`: 라운드 관리, 사용자 관리, 통계 조회
- `moderator`: 콘텐츠 삭제, 통계 조회만

### 4. game_rounds
게임 라운드 (Admin 수동 관리)

```sql
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  actual_end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' NOT NULL
    CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  started_by UUID REFERENCES admin_users(id),
  ended_by UUID REFERENCES admin_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Only one active round at a time (partial unique index)
CREATE UNIQUE INDEX idx_one_active_round
  ON game_rounds(is_active)
  WHERE is_active = true;

CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number DESC);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_game_rounds_is_active ON game_rounds(is_active) WHERE is_active = true;
```

**중요:**
- `one_active_round` - 활성 라운드는 항상 1개만
- Admin이 수동으로 시작/종료 (Cron Job 없음)

### 5. prompt_history
프롬프트 제출 이력 (라운드당 1번)

```sql
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL CHECK (char_length(prompt) <= 30),
  round_number INTEGER NOT NULL,
  strength_gained INTEGER DEFAULT 0 NOT NULL,
  charm_gained INTEGER DEFAULT 0 NOT NULL,
  creativity_gained INTEGER DEFAULT 0 NOT NULL,
  total_score_gained INTEGER DEFAULT 0 NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  deleted_by UUID REFERENCES admin_users(id),
  deleted_at TIMESTAMPTZ,
  delete_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_prompt_per_round UNIQUE (character_id, round_number)
);

CREATE INDEX idx_prompt_history_character_id ON prompt_history(character_id);
CREATE INDEX idx_prompt_history_round_number ON prompt_history(round_number);
CREATE INDEX idx_prompt_history_is_deleted ON prompt_history(is_deleted) WHERE is_deleted = false;
```

**중요:** `unique_prompt_per_round` - 캐릭터는 라운드당 1번만 제출 가능

### 6. character_plans
캐릭터 성장 계획 (Lv1~Lv3 스탯/스킬, 단일 플랜)

```sql
CREATE TABLE character_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  lv1_str INTEGER NOT NULL,
  lv1_dex INTEGER NOT NULL,
  lv1_con INTEGER NOT NULL,
  lv1_int INTEGER NOT NULL,
  lv1_skill TEXT,
  lv2_str INTEGER NOT NULL,
  lv2_dex INTEGER NOT NULL,
  lv2_con INTEGER NOT NULL,
  lv2_int INTEGER NOT NULL,
  lv2_skill TEXT,
  lv3_str INTEGER NOT NULL,
  lv3_dex INTEGER NOT NULL,
  lv3_con INTEGER NOT NULL,
  lv3_int INTEGER NOT NULL,
  lv3_skill TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_character_plan UNIQUE (character_id)
);
```

제약(요지):
- 각 스탯 최대 20
- Lv2 = Lv1 + 1 + 1 (서로 다른 2스탯)
- Lv3 = Lv2 + 1 + 1 (서로 다른 2스탯)
- 플랜 변경 시 관련 시련 결과 `needs_revalidation = true`

### 7. trials
라운드별 시련 정의(1~3번, 레벨/가중치)

```sql
CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  trial_no SMALLINT NOT NULL CHECK (trial_no IN (1,2,3)),
  level SMALLINT NOT NULL CHECK (level IN (1,2,3)),
  weight_multiplier SMALLINT NOT NULL CHECK (weight_multiplier IN (1,2,3,4)),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_trial_per_round UNIQUE (round_id, trial_no)
);
```

### 8. trial_results
시련별 평가 결과(원점수/가중 합계)

```sql
CREATE TABLE trial_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_history_id UUID NOT NULL REFERENCES prompt_history(id) ON DELETE CASCADE,
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
```

### 9. v_weighted_scores (VIEW)
시련 결과의 가중 총합 기준 리더보드 집계 뷰

```sql
CREATE OR REPLACE VIEW v_weighted_scores AS
SELECT character_id, SUM(weighted_total) AS weighted_total
FROM trial_results
GROUP BY character_id;
```

### 10. leaderboard_snapshots
라운드별 순위 스냅샷

```sql
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL REFERENCES game_rounds(round_number),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  strength INTEGER NOT NULL,
  charm INTEGER NOT NULL,
  creativity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_character_per_snapshot UNIQUE (round_number, character_id)
);

CREATE INDEX idx_leaderboard_round_rank ON leaderboard_snapshots(round_number, rank);
```

### 11. admin_audit_log
Admin 행동 추적 로그

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);
```

---

## Triggers

### 1. Auto-update updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2. Auto-create profile on Google OAuth signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Realtime Subscriptions

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE trials;
ALTER PUBLICATION supabase_realtime ADD TABLE trial_results;
```

---

## Initial Data

```sql
-- 초기 super_admin 생성 (Auth 가입 후 수동 INSERT)
INSERT INTO admin_users (id, profile_id, role, permissions)
VALUES (
  'auth-user-uuid',
  'profile-uuid',
  'super_admin',
  '{"rounds": true, "users": true, "stats": true, "prompts": true, "admin_manage": true}'
);
```

---

## 중요 포인트

1. **Edge Functions 우선**: 모든 비즈니스 로직은 Edge Functions에서 처리
2. **RLS는 선택사항**: Service Role Key 사용 시 RLS 무시됨
3. **제약조건이 핵심**:
   - 사용자당 활성 캐릭터 1개
   - 활성 라운드 1개
   - 라운드당 프롬프트 제출 1번
4. **Admin 수동 관리**: Cron Job 없음, Admin이 모든 라운드 제어
5. **Audit Log 필수**: 모든 Admin 행동 추적
