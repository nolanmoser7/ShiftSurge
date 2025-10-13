-- Complete Supabase Migration for Shift Surge
-- This adds admin features to your existing schema
-- Execute this in Supabase SQL Editor

-- ========================================
-- PART 1: Add super_admin to user_role enum
-- ========================================
DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- PART 2: Create organizations table
-- ========================================
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

-- ========================================
-- PART 3: Create audit_logs table
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ========================================
-- PART 4: Create admin user
-- ========================================
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

-- ========================================
-- PART 5: Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

-- ========================================
-- PART 6: Verify existing tables and add missing indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_claims_worker_id ON claims(worker_id);
CREATE INDEX IF NOT EXISTS idx_claims_promotion_id ON claims(promotion_id);
CREATE INDEX IF NOT EXISTS idx_claims_code ON claims(code);
CREATE INDEX IF NOT EXISTS idx_redemptions_claim_id ON redemptions(claim_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_user_id ON restaurant_profiles(user_id);

-- ========================================
-- ✅ Migration Complete!
-- ========================================
-- You now have:
-- - super_admin role added to user_role enum
-- - organizations table for admin
-- - audit_logs table for admin tracking
-- - admin@shiftsurge.com user with super_admin role
-- - Performance indexes on all tables
