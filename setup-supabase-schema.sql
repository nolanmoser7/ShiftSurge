-- Shift Surge Complete Database Schema for Supabase
-- Execute this SQL in your Supabase SQL Editor

-- 1. Create user_role enum with super_admin
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('worker', 'restaurant', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Create worker_profiles table
CREATE TABLE IF NOT EXISTS worker_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  worker_role VARCHAR(100) NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Create restaurant_profiles table
CREATE TABLE IF NOT EXISTS restaurant_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id VARCHAR NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  discount_percentage INTEGER NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id VARCHAR NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  promotion_id VARCHAR NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  claim_code VARCHAR(20) UNIQUE NOT NULL,
  claimed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_redeemed BOOLEAN DEFAULT false NOT NULL
);

-- 7. Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id VARCHAR UNIQUE NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 8. Create organizations table (for restaurant groups)
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

-- 9. Create audit_logs table (for admin tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 10. Create admin user with hashed password for 'admin123'
-- Password: admin123 (hashed with scrypt)
INSERT INTO users (email, password, role, created_at)
VALUES (
  'admin@shiftsurge.com',
  '90e0e5baa6da0ede462b5a8b6cae2fe3:83312dbd071c4bfba04410949729f275f6b25718c5a70cb32c70f2d29ad4bdc9604a0dfe9ac8a2f9ce6b942f5c4771f9ef15e278122590ded75b1586c0498524',
  'super_admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  password = '90e0e5baa6da0ede462b5a8b6cae2fe3:83312dbd071c4bfba04410949729f275f6b25718c5a70cb32c70f2d29ad4bdc9604a0dfe9ac8a2f9ce6b942f5c4771f9ef15e278122590ded75b1586c0498524',
  role = 'super_admin';

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_profiles_user_id ON restaurant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_claims_worker_id ON claims(worker_id);
CREATE INDEX IF NOT EXISTS idx_claims_promotion_id ON claims(promotion_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_code ON claims(claim_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_claim_id ON redemptions(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Done! Schema created successfully
