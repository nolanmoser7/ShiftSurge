# Supabase Database Setup Instructions

## Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **eopeghiffhenhetwfnfv**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** button

## Step 2: Execute Schema Setup

1. Open the file `setup-supabase-schema.sql` in this project
2. **Copy the entire contents** of that file
3. **Paste into the Supabase SQL Editor**
4. Click the **Run** button (or press Ctrl+Enter)

## Step 3: Verify Setup

After running the SQL, you should see:

✅ **Tables Created:**
- users (with super_admin role support)
- worker_profiles
- restaurant_profiles
- promotions
- claims
- redemptions
- organizations
- audit_logs

✅ **Admin User Created:**
- Email: admin@shiftsurge.com
- Password: admin123
- Role: super_admin

✅ **Indexes Created** for performance optimization

## Step 4: Test the Connection

Once the schema is set up, the Shift Surge app will automatically connect and you can:

1. Login as admin at `/admin/login`
2. Use credentials: admin@shiftsurge.com / admin123
3. Access admin dashboard, users, organizations, and audit logs

## What This Sets Up

The schema includes:
- **User authentication** with worker, restaurant, and super_admin roles
- **Worker profiles** for service industry workers
- **Restaurant profiles** for business accounts
- **Promotions system** with claims and redemptions
- **Organizations** for restaurant groups
- **Audit logs** for admin tracking

All with proper relationships, indexes, and the admin user pre-configured!
