-- Add Admin Features to Existing Supabase Schema
-- Execute this in Supabase SQL Editor

-- 1. Add super_admin to existing user_role enum (if not already there)
DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create organizations table (for restaurant groups)
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  neighborhood_id VARCHAR(100),
  logo_url TEXT,
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_plan_id VARCHAR(100),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Create audit_logs table (for admin activity tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Create admin user with super_admin role
-- Password: admin123 (hashed with scrypt)
INSERT INTO users (email, password, role, created_at)
VALUES (
  'admin@shiftsurge.com',
  '90e0e5baa6da0ede462b5a8b6cae2fe3:83312dbd071c4bfba04410949729f275f6b25718c5a70cb32c70f2d29ad4bdc9604a0dfe9ac8a2f9ce6b942f5c4771f9ef15e278122590ded75b1586c0498524',
  'super_admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  role = 'super_admin';

-- 5. Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ✅ Done! Admin features added to existing schema
