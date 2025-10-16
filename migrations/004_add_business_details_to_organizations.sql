-- Migration: Add business details and employee limit to organizations
-- Add columns for Google Places data and employee management

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS max_employees INTEGER,
  ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS business_hours TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1);

-- Add comment for documentation
COMMENT ON COLUMN organizations.max_employees IS 'Maximum number of employees allowed (actual limit is this + 5)';
COMMENT ON COLUMN organizations.google_place_id IS 'Google Places API place ID for this restaurant';
COMMENT ON COLUMN organizations.phone IS 'Restaurant phone number from Google Business';
COMMENT ON COLUMN organizations.business_hours IS 'JSON string of business hours from Google';
COMMENT ON COLUMN organizations.rating IS 'Google Business rating (1.0 - 5.0)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
