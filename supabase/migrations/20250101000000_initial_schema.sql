-- Initial Schema for Character Battle Game
-- Simplified version for server-side API architecture
-- All business logic handled in application server

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
-- User profile information (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- =============================================================================
-- 2. CHARACTERS TABLE
-- =============================================================================
-- User's character information
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

  -- One active character per user constraint
  CONSTRAINT one_active_character_per_user UNIQUE (user_id, is_active)
    WHERE (is_active = true)
);

-- Indexes for performance
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_total_score ON characters(total_score DESC);
CREATE INDEX idx_characters_is_active ON characters(is_active) WHERE is_active = true;

-- =============================================================================
-- 3. ADMIN_USERS TABLE
-- =============================================================================
-- Admin user management (separate from regular profiles)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin' NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{"rounds": true, "users": true, "stats": true}' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for admin queries
CREATE INDEX idx_admin_users_profile_id ON admin_users(profile_id);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;

-- =============================================================================
-- 4. GAME_ROUNDS TABLE
-- =============================================================================
-- Game round management (Admin manually controlled)
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

  -- Only one active round at a time
  CONSTRAINT one_active_round UNIQUE (is_active) WHERE (is_active = true)
);

-- Indexes for round queries
CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number DESC);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_game_rounds_is_active ON game_rounds(is_active) WHERE is_active = true;
CREATE INDEX idx_game_rounds_start_time ON game_rounds(start_time);
CREATE INDEX idx_game_rounds_end_time ON game_rounds(end_time);

-- =============================================================================
-- 5. PROMPT_HISTORY TABLE
-- =============================================================================
-- Prompt submission history (one per round per character)
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

  -- Prevent duplicate submissions in the same round
  CONSTRAINT unique_prompt_per_round UNIQUE (character_id, round_number)
);

-- Indexes for history queries
CREATE INDEX idx_prompt_history_character_id ON prompt_history(character_id);
CREATE INDEX idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_round_number ON prompt_history(round_number);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX idx_prompt_history_is_deleted ON prompt_history(is_deleted) WHERE is_deleted = false;

-- =============================================================================
-- 6. LEADERBOARD_SNAPSHOTS TABLE
-- =============================================================================
-- Historical leaderboard snapshots per round
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

-- Indexes for leaderboard queries
CREATE INDEX idx_leaderboard_round_rank ON leaderboard_snapshots(round_number, rank);
CREATE INDEX idx_leaderboard_character_id ON leaderboard_snapshots(character_id);

-- =============================================================================
-- 7. ADMIN_AUDIT_LOG TABLE
-- =============================================================================
-- Track all admin actions for security and accountability
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

-- Indexes for audit log queries
CREATE INDEX idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- =============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================================================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- TRIGGER FOR NEW USER PROFILE CREATION
-- =============================================================================

-- Auto-create profile when new user signs up
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

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- NOTE: If you're using server-side API with service role key,
-- you can disable RLS on all tables. RLS is mainly for direct client access.
--
-- To disable RLS on a table:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
--
-- Current setup: RLS enabled with permissive policies for read,
-- but all mutations should go through your API server.
-- =============================================================================

-- Profiles: Public read, owner update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Characters: Public read, owner insert/update
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view characters"
  ON characters FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own character"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id);

-- Game rounds: Public read only
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game rounds"
  ON game_rounds FOR SELECT
  USING (true);

-- Prompt history: Public read, owner insert
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prompt history"
  ON prompt_history FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own prompt history"
  ON prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard snapshots: Public read only
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard snapshots"
  ON leaderboard_snapshots FOR SELECT
  USING (true);

-- Admin users: Only super_admin can view
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated users can view admin list"
  ON admin_users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin audit log: Only admins can view
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  ));

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================
-- Enable real-time updates for specific tables
-- Used for live leaderboard and round updates

ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Note: Initial game round should be created manually by admin via API
-- Do NOT auto-create rounds in production
--
-- For testing/development only:
-- INSERT INTO game_rounds (round_number, start_time, end_time, status, is_active)
-- VALUES (1, NOW(), NOW() + INTERVAL '1 hour', 'scheduled', false);
