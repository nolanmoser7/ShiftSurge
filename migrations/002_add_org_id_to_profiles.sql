-- Shift Surge: Add org_id to Profile Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/eopeghiffhenhetwfnfv/sql

-- Step 1: Add org_id column to restaurant_profiles
ALTER TABLE restaurant_profiles 
  ADD COLUMN IF NOT EXISTS org_id VARCHAR REFERENCES organizations(id);

-- Step 2: Add org_id column to worker_profiles
ALTER TABLE worker_profiles 
  ADD COLUMN IF NOT EXISTS org_id VARCHAR REFERENCES organizations(id);

-- Step 3: Reload PostgREST schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Verify columns were added
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('restaurant_profiles', 'worker_profiles') 
  AND column_name = 'org_id';
