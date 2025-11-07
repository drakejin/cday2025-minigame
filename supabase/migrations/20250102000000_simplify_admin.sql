-- Create ENUM type for role (user or admin only)
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user' NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Drop admin_users table
DROP TABLE IF EXISTS admin_users CASCADE;
