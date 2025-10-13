# Schema Differences - User's Supabase vs Our Code

## User's Actual Supabase Schema:

### promotions table:
- id, restaurant_id (FK to restaurant_profiles)
- title, description, image_url
- discount_type, discount_value
- status (enum), start_date, end_date
- max_claims, current_claims, impressions
- created_at, updated_at

### restaurant_profiles table:
- id, user_id (FK to users)
- name, address, logo_url
- created_at
- **No organization_id**

### worker_profiles table:
- id, user_id (FK to users)
- name, worker_role (enum)
- is_verified (boolean)
- created_at
- **No organization_id**

### claims table:
- id, promotion_id, worker_id
- code, claimed_at, expires_at, is_redeemed

## Our Current Code Expects:
- promotions.organizationId (not restaurant_id)
- restaurant_profiles.organizationId (doesn't exist)
- worker_profiles.organizationId (doesn't exist)

## Action Items:
1. Update storage layer to use restaurant_id instead of organization_id for promotions
2. Remove organization_id references from restaurant/worker profiles
3. Add max_claims, current_claims, impressions to promotions
