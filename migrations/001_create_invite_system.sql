-- Shift Surge: Invite System Tables Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/eopeghiffhenhetwfnfv/sql

-- Step 1: Create neighborhoods table
CREATE TABLE IF NOT EXISTS neighborhoods (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR,
  token VARCHAR NOT NULL UNIQUE,
  created_by_user_id VARCHAR NOT NULL REFERENCES users(id),
  invite_type VARCHAR NOT NULL CHECK (invite_type IN ('admin', 'staff')),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable Row Level Security
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Public read access" ON neighborhoods;
CREATE POLICY "Public read access" ON neighborhoods 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Service role has full access" ON invite_tokens;
CREATE POLICY "Service role has full access" ON invite_tokens 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 5: Insert default neighborhoods
INSERT INTO neighborhoods (name, slug, is_active) VALUES
  ('Downtown', 'downtown', true),
  ('Midtown', 'midtown', true),
  ('Uptown', 'uptown', true),
  ('Waterfront', 'waterfront', true),
  ('Arts District', 'arts-district', true)
ON CONFLICT (slug) DO NOTHING;

-- Step 6: Update organizations table for wizard
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS neighborhood_id VARCHAR REFERENCES neighborhoods(id),
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS staff_min INTEGER,
  ADD COLUMN IF NOT EXISTS staff_max INTEGER;

-- Step 7: Reload PostgREST schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Verify tables were created
SELECT 'neighborhoods' as table_name, COUNT(*) as row_count FROM neighborhoods
UNION ALL
SELECT 'invite_tokens', COUNT(*) FROM invite_tokens;
