-- Add line_user_id column to profiles table for LINE authentication
ALTER TABLE profiles ADD COLUMN line_user_id TEXT UNIQUE;
CREATE INDEX idx_profiles_line_user_id ON profiles(line_user_id);
