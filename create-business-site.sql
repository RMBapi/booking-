-- ============================================================
-- Quick Fix: Create BusinessSite for Existing Business
-- ============================================================
-- This script helps you create a BusinessSite for an existing business
-- so that customers can register with the businessSiteSlug

-- ============================================================
-- STEP 1: Check existing businesses
-- ============================================================
-- Run this first to see what businesses you have
SELECT 
  id,
  name,
  slug,
  email,
  created_at
FROM businesses 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- ============================================================
-- STEP 2: Check existing business sites
-- ============================================================
-- See which businesses already have sites
SELECT 
  bs.id,
  bs.business_id,
  bs.name,
  bs.slug,
  b.name as business_name
FROM business_sites bs
JOIN businesses b ON bs.business_id = b.id
WHERE bs.deleted_at IS NULL
ORDER BY bs.created_at DESC;

-- ============================================================
-- STEP 3: Create BusinessSite for your business
-- ============================================================
-- INSTRUCTIONS:
-- 1. Copy the 'id' from STEP 1 for your business
-- 2. Replace 'YOUR_BUSINESS_ID_HERE' below with that id
-- 3. Update the 'name' and 'slug' as needed
-- 4. Run the INSERT statement

-- Example for "bapi-test" business:
-- (Uncomment and modify the line below after replacing YOUR_BUSINESS_ID_HERE)

-- INSERT INTO business_sites (id, business_id, name, slug, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'YOUR_BUSINESS_ID_HERE',  -- Replace with actual business ID from STEP 1
--   'Bapi Test Site',          -- Name of the business site
--   'bapi-test',               -- Slug that customers will use in registration
--   NOW(),
--   NOW()
-- );

-- ============================================================
-- STEP 4: Verify the BusinessSite was created
-- ============================================================
-- Run this to confirm the business site exists
SELECT 
  bs.id,
  bs.slug,
  bs.name,
  b.name as business_name,
  bs.created_at
FROM business_sites bs
JOIN businesses b ON bs.business_id = b.id
WHERE bs.slug = 'bapi-test'  -- Change to your slug
  AND bs.deleted_at IS NULL;

-- ============================================================
-- STEP 5: Test customer registration
-- ============================================================
-- After creating the BusinessSite, you should be able to register
-- a customer with the matching businessSiteSlug

-- Use this curl command or your frontend:
/*
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rafid",
    "lastName": "Bapi",
    "email": "bapi@gmail.com",
    "phone": "01778833706",
    "password": "password",
    "role": "Customer",
    "businessSiteSlug": "bapi-test"
  }'
*/

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- If you still get errors, check:

-- 1. Does the business exist?
SELECT id, name, slug FROM businesses WHERE slug LIKE '%bapi%';

-- 2. Does the business site exist?
SELECT id, business_id, slug FROM business_sites WHERE slug = 'bapi-test';

-- 3. Are there any deleted records interfering?
SELECT slug, deleted_at FROM business_sites WHERE slug = 'bapi-test';

-- 4. Check the exact slug format (case-sensitive!)
SELECT slug, length(slug), slug = 'bapi-test' as exact_match 
FROM business_sites 
WHERE slug LIKE '%bapi%';

-- ============================================================
-- CLEANUP (if needed)
-- ============================================================

-- If you created a duplicate or wrong BusinessSite, soft-delete it:
-- (Uncomment and modify if needed)

-- UPDATE business_sites 
-- SET deleted_at = NOW() 
-- WHERE id = 'BUSINESS_SITE_ID_TO_DELETE';

-- ============================================================
-- Notes:
-- - Slugs are case-sensitive
-- - Slugs should be lowercase with hyphens (e.g., 'my-business')
-- - Each business can have multiple sites with different slugs
-- - The slug must be unique per business (enforced by database)
-- ============================================================
