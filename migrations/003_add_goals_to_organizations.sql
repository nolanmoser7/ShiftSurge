-- Shift Surge: Replace Staff Capacity with Goals in Organizations
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/eopeghiffhenhetwfnfv/sql

-- Step 1: Add goals column
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS goals TEXT[];

-- Step 2: Remove staff capacity columns (optional - you may want to keep the data)
-- Uncomment these lines if you want to remove the old columns:
-- ALTER TABLE organizations DROP COLUMN IF EXISTS staff_min;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS staff_max;

-- Step 3: Reload PostgREST schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Verify column was added
SELECT 
  table_name, 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name IN ('goals', 'staff_min', 'staff_max')
ORDER BY column_name;
