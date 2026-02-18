-- ============================================================
-- Migration: Add BusinessSites for All Existing Businesses
-- ============================================================
-- This script creates a default BusinessSite for each existing Business
-- that doesn't already have one.
--
-- USE CASE: If you have existing businesses created before the code fix,
-- this script will create BusinessSites for them automatically.
--
-- SAFE TO RUN: Uses INSERT ... ON CONFLICT DO NOTHING to prevent duplicates
-- ============================================================

DO $$
DECLARE
  business_record RECORD;
  new_site_id UUID;
BEGIN
  -- Loop through all businesses that don't have deleted_at set
  FOR business_record IN 
    SELECT 
      b.id as business_id,
      b.name as business_name,
      b.slug as business_slug
    FROM businesses b
    WHERE b.deleted_at IS NULL
  LOOP
    -- Check if this business already has a site with the same slug
    IF NOT EXISTS (
      SELECT 1 
      FROM business_sites bs 
      WHERE bs.business_id = business_record.business_id 
        AND bs.slug = business_record.business_slug
        AND bs.deleted_at IS NULL
    ) THEN
      -- Create a new BusinessSite
      new_site_id := gen_random_uuid();
      
      INSERT INTO business_sites (id, business_id, name, slug, created_at, updated_at)
      VALUES (
        new_site_id,
        business_record.business_id,
        business_record.business_name || ' Site',  -- Append " Site" to business name
        business_record.business_slug,              -- Use the same slug as business
        NOW(),
        NOW()
      )
      ON CONFLICT (business_id, slug) DO NOTHING;  -- Skip if somehow already exists
      
      RAISE NOTICE 'Created BusinessSite for business: % (slug: %)', 
        business_record.business_name, 
        business_record.business_slug;
    ELSE
      RAISE NOTICE 'BusinessSite already exists for business: % (slug: %)', 
        business_record.business_name, 
        business_record.business_slug;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- ============================================================
-- Verify the migration results
-- ============================================================
SELECT 
  b.name as business_name,
  b.slug as business_slug,
  COUNT(bs.id) as business_sites_count,
  STRING_AGG(bs.slug, ', ') as site_slugs
FROM businesses b
LEFT JOIN business_sites bs ON b.id = bs.business_id AND bs.deleted_at IS NULL
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.name, b.slug
ORDER BY b.created_at DESC;

-- ============================================================
-- Summary Report
-- ============================================================
SELECT 
  'Total Businesses' as metric,
  COUNT(*) as count
FROM businesses
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Total Business Sites' as metric,
  COUNT(*) as count
FROM business_sites
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Businesses Without Sites' as metric,
  COUNT(*) as count
FROM businesses b
WHERE b.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM business_sites bs 
    WHERE bs.business_id = b.id 
      AND bs.deleted_at IS NULL
  );
