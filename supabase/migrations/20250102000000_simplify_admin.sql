-- Create ENUM type for role
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user' NOT NULL;

-- Add index
CREATE INDEX idx_profiles_role ON profiles(role);

-- Drop admin_users table
DROP TABLE IF EXISTS admin_users CASCADE;
