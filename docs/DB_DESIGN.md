# Database Design

## Overview
Supabase PostgreSQL 기반 데이터베이스 설계 문서입니다.
**서버 사이드 API 아키텍처**를 전제로 설계되었으며, 모든 비즈니스 로직은 애플리케이션 서버에서 처리합니다.

## Architecture Philosophy

### 1. 서버 사이드 API 방식
- **모든 비즈니스 로직은 서버(Node.js/Express/Fastify 등)에서 처리**
- DB Function/Procedure는 최소화 (triggers만 유지)
- Supabase는 인증(Auth) + 데이터베이스 + 실시간(Realtime) 용도로만 사용

### 2. RLS (Row Level Security) Policy
**Policy가 필요한 경우:**
- 프론트엔드에서 Supabase Client로 직접 DB 접근할 때 (anon key 사용)
- 사용자별 데이터 접근 권한을 DB 레벨에서 제어해야 할 때

**Policy가 필요 없는 경우:**
- 서버에서 Service Role Key로 DB 접근할 때
- 모든 권한 로직을 API 서버에서 처리할 때

**현재 설정:**
- RLS는 활성화되어 있지만, 서버 API에서는 Service Role Key로 접근하므로 영향 없음
- 프론트엔드에서 읽기 전용(SELECT) 용도로 직접 접근할 수 있도록 허용
- 모든 쓰기 작업(INSERT/UPDATE/DELETE)은 서버 API를 통해서만 수행

**RLS를 완전히 비활성화하려면:**
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots DISABLE ROW LEVEL SECURITY;
```

### 3. Supabase vs 일반 PostgreSQL 차이점

| 항목 | 일반 PostgreSQL | Supabase PostgreSQL |
|------|-----------------|---------------------|
| **접근 방식** | 서버만 접근 | 클라이언트 직접 접근 가능 (optional) |
| **권한 제어** | 애플리케이션 레벨 | RLS Policy (optional) |
| **비즈니스 로직** | 서버 API | DB Function (optional) |
| **실시간 업데이트** | 별도 구현 필요 | Realtime 내장 |
| **인증** | 별도 구현 | Auth 내장 |

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

### 3. game_rounds
게임 라운드 관리 (1시간 단위)

```sql
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT one_active_round UNIQUE (is_active) WHERE (is_active = true)
);

CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number DESC);
CREATE INDEX idx_game_rounds_is_active ON game_rounds(is_active) WHERE is_active = true;
CREATE INDEX idx_game_rounds_end_time ON game_rounds(end_time);
```

**필드 설명:**
- `round_number`: 라운드 번호 (1부터 시작)
- `start_time`: 라운드 시작 시간
- `end_time`: 라운드 종료 시간
- `is_active`: 현재 진행 중인 라운드 여부

**제약조건:**
- `one_active_round`: 항상 활성 라운드는 1개만 존재

**라운드 관리 로직 (서버 API에서 구현):**
```typescript
// 라운드 종료 및 새 라운드 생성 (Cron Job)
async function advanceRound() {
  // 1. 현재 활성 라운드 비활성화
  await supabase
    .from('game_rounds')
    .update({ is_active: false })
    .eq('is_active', true)

  // 2. 리더보드 스냅샷 생성
  // 3. 새 라운드 생성
}
```

---

### 4. prompt_history
프롬프트 입력 이력 (1시간마다 입력)

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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_prompt_per_round UNIQUE (character_id, round_number)
);

CREATE INDEX idx_prompt_history_character_id ON prompt_history(character_id);
CREATE INDEX idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_round_number ON prompt_history(round_number);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);
```

**필드 설명:**
- `prompt`: 제출한 프롬프트 (최대 30자)
- `round_number`: 제출한 라운드 번호
- `*_gained`: 해당 라운드에서 획득한 점수

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

---

### 5. leaderboard_snapshots
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

## Business Logic (서버 API에서 구현)

모든 비즈니스 로직은 DB Function 대신 서버 API에서 구현합니다.

### 1. 프롬프트 제출 및 점수 계산

```typescript
// POST /api/prompts/submit
async function submitPrompt(req, res) {
  const { characterId, prompt } = req.body
  const userId = req.user.id

  // 1. 현재 활성 라운드 조회
  const { data: round } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!round) {
    return res.status(400).json({ error: 'No active round' })
  }

  // 2. 이미 제출했는지 확인
  const { data: existing } = await supabase
    .from('prompt_history')
    .select('id')
    .eq('character_id', characterId)
    .eq('round_number', round.round_number)
    .single()

  if (existing) {
    return res.status(400).json({ error: 'Already submitted this round' })
  }

  // 3. AI 점수 평가 (OpenAI/Claude/Gemini API 호출)
  const scores = await evaluatePromptWithAI(prompt)

  // 4. prompt_history 저장
  await supabase.from('prompt_history').insert({
    character_id: characterId,
    user_id: userId,
    prompt,
    round_number: round.round_number,
    strength_gained: scores.strength,
    charm_gained: scores.charm,
    creativity_gained: scores.creativity,
    total_score_gained: scores.total,
  })

  // 5. characters 점수 업데이트
  await supabase.rpc('increment_character_scores', {
    p_character_id: characterId,
    p_strength: scores.strength,
    p_charm: scores.charm,
    p_creativity: scores.creativity,
  })

  res.json({ success: true, scores })
}
```

### 2. 리더보드 조회

```typescript
// GET /api/leaderboard/current
async function getCurrentLeaderboard(req, res) {
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

  const leaderboard = data.map((char, index) => ({
    rank: index + 1,
    ...char,
  }))

  res.json(leaderboard)
}
```

### 3. 라운드 종료 및 새 라운드 생성

```typescript
// Cron Job (매 시간마다 실행)
async function advanceRound() {
  // 1. 현재 활성 라운드 조회
  const { data: currentRound } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!currentRound) return

  // 2. 현재 라운드 비활성화
  await supabase
    .from('game_rounds')
    .update({ is_active: false })
    .eq('id', currentRound.id)

  // 3. 리더보드 스냅샷 생성
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('is_active', true)
    .order('total_score', { ascending: false })

  const snapshots = characters.map((char, index) => ({
    round_number: currentRound.round_number,
    character_id: char.id,
    user_id: char.user_id,
    rank: index + 1,
    total_score: char.total_score,
    strength: char.strength,
    charm: char.charm,
    creativity: char.creativity,
  }))

  await supabase.from('leaderboard_snapshots').insert(snapshots)

  // 4. 새 라운드 생성
  await supabase.from('game_rounds').insert({
    round_number: currentRound.round_number + 1,
    start_time: new Date(),
    end_time: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후
    is_active: true,
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

1. **서버 사이드 API 우선**
   - 모든 비즈니스 로직은 서버에서 처리
   - DB는 데이터 저장 + 기본 제약조건만 담당

2. **RLS Policy는 선택사항**
   - 서버에서 Service Role Key 사용 시 RLS 무시됨
   - 프론트엔드 직접 접근이 필요한 경우만 RLS 활성화

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
   - Cron job (node-cron, vercel cron 등)으로 1시간마다 자동 라운드 전환
   - 또는 Supabase Edge Function + Cron Trigger 사용

7. **AI 점수 계산**
   - 서버 API에서 OpenAI/Claude/Gemini API 호출
   - 프롬프트 평가 후 점수 반영
