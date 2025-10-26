# Database Design

## Overview
Supabase PostgreSQL 기반 데이터베이스 설계 문서입니다.
Supabase Auth를 사용하여 사용자 인증을 처리합니다.

## Tables

### 1. profiles
사용자 프로필 정보 (Supabase Auth의 users 테이블과 1:1 관계)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2. characters
사용자가 생성한 캐릭터 정보

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  current_prompt TEXT NOT NULL CHECK (char_length(current_prompt) <= 30),
  total_score INTEGER DEFAULT 0,
  strength INTEGER DEFAULT 0,
  charm INTEGER DEFAULT 0,
  creativity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 하나의 활성 캐릭터만 가능
  CONSTRAINT one_active_character_per_user UNIQUE (user_id, is_active)
    WHERE (is_active = true)
);

-- Indexes
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_total_score ON characters(total_score DESC);
CREATE INDEX idx_characters_is_active ON characters(is_active);

-- RLS 정책
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Characters are viewable by everyone"
  ON characters FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own character"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3. prompt_history
프롬프트 입력 이력 (1시간마다 입력)

```sql
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL CHECK (char_length(prompt) <= 30),
  round_number INTEGER NOT NULL,
  strength_gained INTEGER DEFAULT 0,
  charm_gained INTEGER DEFAULT 0,
  creativity_gained INTEGER DEFAULT 0,
  total_score_gained INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 라운드에 중복 제출 방지
  CONSTRAINT unique_prompt_per_round UNIQUE (character_id, round_number)
);

-- Indexes
CREATE INDEX idx_prompt_history_character_id ON prompt_history(character_id);
CREATE INDEX idx_prompt_history_round_number ON prompt_history(round_number);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);

-- RLS 정책
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt history viewable by everyone"
  ON prompt_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own prompt history"
  ON prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. game_rounds
게임 라운드 관리 (1시간 단위)

```sql
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 하나의 활성 라운드만 존재
  CONSTRAINT one_active_round UNIQUE (is_active) WHERE (is_active = true)
);

-- Indexes
CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number DESC);
CREATE INDEX idx_game_rounds_is_active ON game_rounds(is_active);

-- RLS 정책
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game rounds are viewable by everyone"
  ON game_rounds FOR SELECT
  USING (true);
```

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
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_character_per_snapshot UNIQUE (round_number, character_id)
);

-- Indexes
CREATE INDEX idx_leaderboard_round_rank ON leaderboard_snapshots(round_number, rank);
CREATE INDEX idx_leaderboard_character_id ON leaderboard_snapshots(character_id);

-- RLS 정책
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard snapshots are viewable by everyone"
  ON leaderboard_snapshots FOR SELECT
  USING (true);
```

## Functions

### 1. handle_new_user()
새 사용자 등록 시 자동으로 profile 생성

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. update_updated_at()
updated_at 자동 갱신

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3. calculate_prompt_score()
프롬프트 점수 계산 함수 (AI 평가 결과 반영)

```sql
CREATE OR REPLACE FUNCTION calculate_prompt_score(
  p_character_id UUID,
  p_prompt TEXT,
  p_strength INTEGER,
  p_charm INTEGER,
  p_creativity INTEGER
)
RETURNS void AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  v_total_score := p_strength + p_charm + p_creativity;

  -- 캐릭터 점수 업데이트
  UPDATE characters
  SET
    current_prompt = p_prompt,
    strength = strength + p_strength,
    charm = charm + p_charm,
    creativity = creativity + p_creativity,
    total_score = total_score + v_total_score
  WHERE id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. get_current_leaderboard()
현재 리더보드 조회

```sql
CREATE OR REPLACE FUNCTION get_current_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  rank BIGINT,
  character_id UUID,
  character_name VARCHAR,
  username VARCHAR,
  display_name VARCHAR,
  avatar_url TEXT,
  total_score INTEGER,
  strength INTEGER,
  charm INTEGER,
  creativity INTEGER,
  current_prompt TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY c.total_score DESC) as rank,
    c.id as character_id,
    c.name as character_name,
    p.username,
    p.display_name,
    p.avatar_url,
    c.total_score,
    c.strength,
    c.charm,
    c.creativity,
    c.current_prompt
  FROM characters c
  JOIN profiles p ON c.user_id = p.id
  WHERE c.is_active = true
  ORDER BY c.total_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. get_current_round()
현재 활성 라운드 조회

```sql
CREATE OR REPLACE FUNCTION get_current_round()
RETURNS TABLE (
  id UUID,
  round_number INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gr.id,
    gr.round_number,
    gr.start_time,
    gr.end_time,
    gr.end_time - NOW() as time_remaining
  FROM game_rounds gr
  WHERE gr.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Real-time Subscriptions

### Supabase Realtime 설정
특정 테이블에 대한 실시간 구독 활성화

```sql
-- 리더보드 실시간 업데이트
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;
```

## Initial Data

### 첫 번째 게임 라운드 생성

```sql
INSERT INTO game_rounds (round_number, start_time, end_time, is_active)
VALUES (
  1,
  NOW(),
  NOW() + INTERVAL '1 hour',
  true
);
```

## Considerations

1. **확장성**: 사용자가 많아질 경우 leaderboard_snapshots를 활용하여 과거 순위 조회 성능 개선
2. **실시간성**: Supabase Realtime을 통해 리더보드 실시간 업데이트
3. **보안**: RLS를 통해 데이터 접근 제어
4. **게임 라운드 관리**: Cron job 또는 Edge Function으로 1시간마다 자동 라운드 전환
5. **AI 점수 계산**: 별도 서비스(Edge Function)에서 프롬프트 평가 후 점수 반영
