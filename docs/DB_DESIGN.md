# Database Design

## Overview
Supabase PostgreSQL 기반 데이터베이스 설계 문서입니다.
**100% Supabase Edge Functions 아키텍처**를 전제로 설계되었으며, 모든 비즈니스 로직은 Edge Functions (Deno)에서 처리합니다.

## Architecture Philosophy

### 1. 100% Supabase Edge Functions 방식
- **모든 비즈니스 로직은 Supabase Edge Functions (Deno)에서 처리**
- DB Function/Procedure는 최소화 (triggers만 유지)
- Supabase 풀스택: Auth + Database + Realtime + Edge Functions
- 프론트엔드는 읽기 전용으로 Client SDK 직접 사용 가능 (리더보드, 라운드 정보 등)
- 모든 쓰기 작업은 Edge Functions를 통해서만 수행

### 2. RLS (Row Level Security) Policy
**Policy가 필요한 경우:**
- 프론트엔드에서 Supabase Client로 직접 DB 접근할 때 (anon key 사용)
- 사용자별 데이터 접근 권한을 DB 레벨에서 제어해야 할 때

**Policy가 필요 없는 경우:**
- Edge Functions에서 Service Role Key로 DB 접근할 때
- 모든 권한 로직을 Edge Functions에서 처리할 때

**현재 설정:**
- RLS는 활성화되어 있지만, Edge Functions에서는 Service Role Key로 접근하므로 영향 없음
- 프론트엔드에서 읽기 전용(SELECT) 용도로 직접 접근할 수 있도록 허용
- 모든 쓰기 작업(INSERT/UPDATE/DELETE)은 Edge Functions를 통해서만 수행

**RLS를 완전히 비활성화하려면:**
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots DISABLE ROW LEVEL SECURITY;
```

### 3. Supabase vs 일반 PostgreSQL 차이점

| 항목 | 일반 PostgreSQL + Node.js | Supabase (Edge Functions) |
|------|---------------------------|---------------------------|
| **접근 방식** | Node.js 서버만 접근 | Edge Functions + 클라이언트 직접 접근 (읽기) |
| **권한 제어** | 애플리케이션 레벨 | RLS Policy (읽기) + Edge Functions (쓰기) |
| **비즈니스 로직** | Node.js/Express | Edge Functions (Deno) |
| **실시간 업데이트** | Socket.io 등 별도 구현 | Realtime 내장 |
| **인증** | JWT 직접 구현 | Auth 내장 |
| **배포** | Vercel/Railway 등 | Supabase CLI (내장) |

---

## Tables

### 1. profiles
사용자 프로필 정보 (Supabase Auth의 users 테이블과 1:1 관계)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_username ON profiles(username);
```

**필드 설명:**
- `id`: auth.users와 1:1 매핑
- `username`: 고유 사용자명 (로그인용)
- `display_name`: 화면에 표시될 닉네임
- `avatar_url`: 프로필 이미지 URL

---

### 2. characters
사용자가 생성한 캐릭터 정보

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
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT one_active_character_per_user UNIQUE (user_id, is_active)
    WHERE (is_active = true)
);

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_total_score ON characters(total_score DESC);
CREATE INDEX idx_characters_is_active ON characters(is_active) WHERE is_active = true;
```

**필드 설명:**
- `current_prompt`: 현재 라운드에 제출한 프롬프트 (최대 30자)
- `total_score`: 총점 (strength + charm + creativity 누적)
- `is_active`: 활성 캐릭터 (사용자당 1개만 활성)

**제약조건:**
- `one_active_character_per_user`: 사용자당 활성 캐릭터 1개만 허용

---

### 3. admin_users
Admin 사용자 관리 (게임 운영진)

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

**필드 설명:**
- `profile_id`: profiles 테이블과 연결
- `role`: Admin 권한 등급 (super_admin > admin > moderator)
- `permissions`: JSONB 형태의 세부 권한 설정
- `is_active`: Admin 계정 활성화 여부

**권한 등급:**
- `super_admin`: 모든 권한 (Admin 계정 생성/삭제 포함)
- `admin`: 라운드 관리, 사용자 관리, 통계 조회
- `moderator`: 부적절한 콘텐츠 삭제, 통계 조회만 가능

---

### 4. game_rounds
게임 라운드 관리 (Admin 수동 제어)

```sql
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  actual_end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  started_by UUID REFERENCES admin_users(id),
  ended_by UUID REFERENCES admin_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT one_active_round UNIQUE (is_active) WHERE (is_active = true)
);

CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number DESC);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_game_rounds_is_active ON game_rounds(is_active) WHERE is_active = true;
CREATE INDEX idx_game_rounds_start_time ON game_rounds(start_time);
CREATE INDEX idx_game_rounds_end_time ON game_rounds(end_time);
```

**필드 설명:**
- `round_number`: 라운드 번호 (1부터 시작)
- `start_time`: 라운드 예정 시작 시간
- `end_time`: 라운드 예정 종료 시간
- `actual_end_time`: 실제 종료 시간 (연장된 경우)
- `is_active`: 현재 진행 중인 라운드 여부
- `status`: 라운드 상태
  - `scheduled`: 예정됨 (아직 시작 전)
  - `active`: 진행 중
  - `completed`: 정상 종료
  - `cancelled`: 취소됨
- `started_by`: 라운드를 시작한 Admin ID
- `ended_by`: 라운드를 종료한 Admin ID
- `notes`: Admin 메모 (예: "서버 점검으로 인한 조기 종료")

**제약조건:**
- `one_active_round`: 항상 활성 라운드는 1개만 존재

**라운드 관리 로직 (Admin API):**
```typescript
// POST /api/admin/rounds/start
async function startRound(adminId: string, roundId: string) {
  // 1. 라운드 상태를 'active'로 변경
  await supabase
    .from('game_rounds')
    .update({
      is_active: true,
      status: 'active',
      started_by: adminId
    })
    .eq('id', roundId)

  // 2. Admin audit log 기록
  await logAdminAction(adminId, 'START_ROUND', roundId)
}

// POST /api/admin/rounds/:id/end
async function endRound(adminId: string, roundId: string) {
  // 1. 현재 라운드 종료
  await supabase
    .from('game_rounds')
    .update({
      is_active: false,
      status: 'completed',
      actual_end_time: new Date(),
      ended_by: adminId
    })
    .eq('id', roundId)

  // 2. 리더보드 스냅샷 생성
  await createLeaderboardSnapshot(roundId)

  // 3. Admin audit log 기록
  await logAdminAction(adminId, 'END_ROUND', roundId)
}
```

---

### 5. prompt_history
프롬프트 입력 이력 (라운드당 1번 제출)

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
CREATE INDEX idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_round_number ON prompt_history(round_number);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX idx_prompt_history_is_deleted ON prompt_history(is_deleted) WHERE is_deleted = false;
```

**필드 설명:**
- `prompt`: 제출한 프롬프트 (최대 30자)
- `round_number`: 제출한 라운드 번호
- `*_gained`: 해당 라운드에서 획득한 점수
- `is_deleted`: 부적절한 콘텐츠로 인한 삭제 여부
- `deleted_by`: 삭제를 수행한 Admin ID
- `delete_reason`: 삭제 사유

**제약조건:**
- `unique_prompt_per_round`: 캐릭터는 라운드당 1번만 제출 가능

**프롬프트 제출 로직 (서버 API에서 구현):**
```typescript
async function submitPrompt(characterId: string, prompt: string) {
  // 1. 현재 활성 라운드 확인
  // 2. 중복 제출 방지 (unique constraint)
  // 3. AI 점수 평가
  // 4. prompt_history 저장
  // 5. characters 테이블 업데이트 (점수 반영)
}
```

**Admin 프롬프트 삭제 로직:**
```typescript
// DELETE /api/admin/prompts/:id
async function deletePrompt(adminId: string, promptId: string, reason: string) {
  // 1. prompt_history 소프트 삭제
  await supabase
    .from('prompt_history')
    .update({
      is_deleted: true,
      deleted_by: adminId,
      deleted_at: new Date(),
      delete_reason: reason
    })
    .eq('id', promptId)

  // 2. 점수 롤백 (characters 테이블)
  // 3. Admin audit log 기록
}
```

---

### 6. leaderboard_snapshots
시간별 리더보드 스냅샷 (순위 기록용)

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
CREATE INDEX idx_leaderboard_character_id ON leaderboard_snapshots(character_id);
```

**필드 설명:**
- `rank`: 해당 라운드 종료 시점의 순위
- `*_score`: 해당 라운드 종료 시점의 점수 스냅샷

**스냅샷 생성 로직 (서버 API에서 구현):**
```typescript
async function createLeaderboardSnapshot(roundNumber: number) {
  // 1. 현재 characters 테이블에서 순위 계산
  // 2. leaderboard_snapshots에 저장
}
```

---

### 7. admin_audit_log
Admin 행동 추적 로그 (보안 및 책임 추적)

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
CREATE INDEX idx_audit_log_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);
```

**필드 설명:**
- `admin_id`: 행동을 수행한 Admin ID
- `action`: 수행한 작업 (예: START_ROUND, END_ROUND, DELETE_PROMPT, BAN_USER)
- `resource_type`: 작업 대상 타입 (예: game_rounds, prompt_history, profiles)
- `resource_id`: 작업 대상 ID
- `changes`: 변경 내용 (before/after JSON)
- `ip_address`: Admin의 IP 주소
- `user_agent`: Admin의 브라우저 정보

**사용 예시:**
```typescript
async function logAdminAction(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: any
) {
  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    changes,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  })
}
```

---

## Triggers (DB에서 자동 처리)

### 1. update_updated_at()
updated_at 자동 갱신 (DB 레벨에서 처리)

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

**용도:** profiles, characters 업데이트 시 자동으로 updated_at 갱신

---

### 2. handle_new_user()
새 사용자 등록 시 자동으로 profile 생성 (DB 레벨에서 처리)

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**용도:** auth.users에 새 사용자 추가 시 자동으로 profiles 생성

---

## Business Logic (Edge Functions에서 구현)

모든 비즈니스 로직은 Supabase Edge Functions (Deno)에서 구현합니다.

### 1. 프롬프트 제출 및 점수 계산

**파일**: `supabase/functions/submit-prompt/index.ts`

```typescript
// Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. JWT 검증
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Service Role Key
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // 2. Request Body 파싱
    const { characterId, prompt } = await req.json()

    // 3. 현재 활성 라운드 조회
    const { data: round } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!round) {
      return new Response(JSON.stringify({ error: 'No active round' }), { status: 400 })
    }

    // 4. 중복 제출 확인
    const { data: existing } = await supabase
      .from('prompt_history')
      .select('id')
      .eq('character_id', characterId)
      .eq('round_number', round.round_number)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Already submitted this round' }),
        { status: 400 }
      )
    }

    // 5. AI 점수 평가
    const scores = await evaluatePromptWithAI(prompt)

    // 6. prompt_history 저장
    await supabase.from('prompt_history').insert({
      character_id: characterId,
      user_id: user.id,
      prompt,
      round_number: round.round_number,
      strength_gained: scores.strength,
      charm_gained: scores.charm,
      creativity_gained: scores.creativity,
      total_score_gained: scores.total,
    })

    // 7. characters 점수 업데이트
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    await supabase
      .from('characters')
      .update({
        current_prompt: prompt,
        strength: character.strength + scores.strength,
        charm: character.charm + scores.charm,
        creativity: character.creativity + scores.creativity,
        total_score: character.total_score + scores.total,
      })
      .eq('id', characterId)

    return new Response(
      JSON.stringify({ success: true, scores }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function evaluatePromptWithAI(prompt: string) {
  // OpenAI/Claude/Gemini API 호출
  // 간단한 예시 (실제로는 AI API 호출)
  return {
    strength: Math.floor(Math.random() * 50),
    charm: Math.floor(Math.random() * 50),
    creativity: Math.floor(Math.random() * 50),
    total: 0, // 위 3개의 합
  }
}
```

### 2. 리더보드 조회

**프론트엔드에서 Client SDK로 직접 조회 (읽기 전용)**

```typescript
// Frontend code
import { supabase } from '@/lib/supabase'

async function getCurrentLeaderboard() {
  const { data } = await supabase
    .from('characters')
    .select(`
      id,
      name,
      total_score,
      strength,
      charm,
      creativity,
      current_prompt,
      profiles:user_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('is_active', true)
    .order('total_score', { ascending: false })
    .limit(100)

  return data.map((char, index) => ({
    rank: index + 1,
    ...char,
  }))
}
```

### 3. Admin - 라운드 수동 시작/종료

**파일**: `supabase/functions/admin-rounds-start/index.ts`

```typescript
// Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. JWT 검증 및 Admin 확인
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (!admin || !admin.permissions.rounds) {
      return new Response(JSON.stringify({ error: 'Admin permission required' }), { status: 403 })
    }

    // 2. Request Body 파싱
    const { roundId } = await req.json()

    // 3. 라운드 시작
    const { data: round, error } = await supabase
      .from('game_rounds')
      .update({
        is_active: true,
        status: 'active',
        started_by: admin.id
      })
      .eq('id', roundId)
      .eq('status', 'scheduled')
      .select()
      .single()

    if (error || !round) {
      return new Response(
        JSON.stringify({ error: 'Round not found or already started' }),
        { status: 400 }
      )
    }

    // 4. Audit log 기록
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'START_ROUND',
      resource_type: 'game_rounds',
      resource_id: roundId,
      changes: { status: 'scheduled -> active' },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent')
    })

    return new Response(
      JSON.stringify({ success: true, round }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})

// POST /api/admin/rounds/:id/end
async function endRound(req: Request, res: Response) {
  const { id: roundId } = req.params
  const { notes } = req.body
  const adminId = req.admin.id

  // 1. 현재 라운드 종료
  const { data: round } = await supabase
    .from('game_rounds')
    .update({
      is_active: false,
      status: 'completed',
      actual_end_time: new Date(),
      ended_by: adminId,
      notes
    })
    .eq('id', roundId)
    .eq('is_active', true)
    .single()

  if (!round) {
    return res.status(400).json({ error: 'No active round found' })
  }

  // 2. 리더보드 스냅샷 생성
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('is_active', true)
    .order('total_score', { ascending: false })

  const snapshots = characters.map((char, index) => ({
    round_number: round.round_number,
    character_id: char.id,
    user_id: char.user_id,
    rank: index + 1,
    total_score: char.total_score,
    strength: char.strength,
    charm: char.charm,
    creativity: char.creativity,
  }))

  await supabase.from('leaderboard_snapshots').insert(snapshots)

  // 3. Audit log 기록
  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'END_ROUND',
    resource_type: 'game_rounds',
    resource_id: roundId,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  })

  res.json({ success: true })
}

// POST /api/admin/rounds/create
async function createRound(req: Request, res: Response) {
  const { round_number, start_time, end_time } = req.body
  const adminId = req.admin.id

  const { data: round } = await supabase.from('game_rounds').insert({
    round_number,
    start_time,
    end_time,
    status: 'scheduled',
    is_active: false
  }).single()

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'CREATE_ROUND',
    resource_type: 'game_rounds',
    resource_id: round.id
  })

  res.json({ success: true, round })
}
```

### 4. Admin - 통계 조회

```typescript
// GET /api/admin/stats
async function getStats(req: Request, res: Response) {
  const adminId = req.admin.id

  // 1. 전체 통계
  const { data: stats } = await supabase.rpc('get_admin_stats')

  // 또는 직접 쿼리:
  const [
    { count: totalUsers },
    { count: totalCharacters },
    { count: totalPrompts },
    { data: currentRound }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('prompt_history').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('game_rounds').select('*').eq('is_active', true).single()
  ])

  res.json({
    totalUsers,
    totalCharacters,
    totalPrompts,
    currentRound,
    submissionRate: totalPrompts / totalCharacters
  })
}
```

---

## Real-time Subscriptions

Supabase Realtime을 사용하여 실시간 업데이트 구현

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;
```

**클라이언트 코드 예시:**

```typescript
// 리더보드 실시간 구독
const subscription = supabase
  .channel('leaderboard')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'characters' },
    (payload) => {
      console.log('Character updated:', payload.new)
      // 리더보드 UI 업데이트
    }
  )
  .subscribe()
```

---

## Initial Data

첫 번째 게임 라운드 생성

```sql
INSERT INTO game_rounds (round_number, start_time, end_time, is_active)
VALUES (
  1,
  NOW(),
  NOW() + INTERVAL '1 hour',
  true
);
```

---

## Considerations

1. **100% Supabase Edge Functions**
   - 모든 비즈니스 로직은 Edge Functions (Deno)에서 처리
   - DB는 데이터 저장 + 기본 제약조건만 담당
   - 프론트엔드는 읽기 전용으로 Client SDK 직접 사용 가능

2. **RLS Policy는 선택사항**
   - Edge Functions에서 Service Role Key 사용 시 RLS 무시됨
   - 프론트엔드 직접 접근 (읽기)을 위해 RLS 활성화

3. **실시간성**
   - Supabase Realtime으로 리더보드 실시간 업데이트
   - WebSocket 연결로 효율적인 데이터 동기화

4. **확장성**
   - leaderboard_snapshots로 과거 순위 조회 성능 개선
   - 인덱스 최적화로 대용량 데이터 처리

5. **보안**
   - 서버 API에서 사용자 인증 및 권한 검증
   - Supabase Auth JWT 토큰 검증

6. **게임 라운드 관리**
   - **Admin이 수동으로 라운드 시작/종료 (Edge Functions)**
   - 특정 시간대에만 진행 (예: 09:00~23:00)
   - 라운드 생성, 시작, 종료, 취소 모두 Admin이 제어
   - Cron Job 없음 (완전 수동 관리)

7. **Admin 시스템**
   - Admin 권한 3단계: super_admin, admin, moderator
   - Admin 행동 추적 (Audit Log)
   - Admin Panel: 라운드 관리, 사용자 관리, 통계 대시보드
   - 부적절한 프롬프트 삭제 및 점수 롤백
   - 모든 Admin API는 Edge Functions로 구현

8. **AI 점수 계산**
   - Edge Functions에서 OpenAI/Claude/Gemini API 호출
   - Deno에서 직접 외부 API 호출 가능
   - 프롬프트 평가 후 점수 반영

9. **보안 및 책임 추적**
   - 모든 Admin 행동은 admin_audit_log에 기록
   - IP 주소, User-Agent 추적
   - 변경 내역 JSONB 형태로 저장

10. **배포 및 관리**
   - `supabase functions deploy` 명령어로 간단 배포
   - Supabase Dashboard에서 Edge Functions 로그 확인
   - 환경 변수는 Supabase Secrets로 관리
