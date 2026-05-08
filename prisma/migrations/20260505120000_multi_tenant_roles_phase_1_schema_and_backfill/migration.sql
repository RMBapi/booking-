-- Multi-tenant roles, phase 1: schema + backfill.
--
-- DDL and DML are wrapped in a single BEGIN...COMMIT. A DO $$ assertion runs
-- before COMMIT and RAISE EXCEPTION on inconsistent state, which rolls back
-- the entire transaction. Postgres-specific (relies on transactional DDL).
--
-- Idempotence: backfill INSERT uses ON CONFLICT DO NOTHING so a retry after
-- partial failure is safe. The standalone UPDATE/DELETE steps are naturally
-- idempotent.

-- gen_random_uuid() is in core on Postgres 13+, but the pgcrypto extension
-- is the historically portable home — declare defensively.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- ============================================================
-- DDL: Role and UserRole multi-tenant scoping
-- ============================================================

-- Role: drop global @unique(name), add nullable business_id, add composite
-- @@unique([businessId, name]) so the same name can repeat across businesses.
DROP INDEX "roles_name_key";
ALTER TABLE "roles" ADD COLUMN "business_id" TEXT;
CREATE INDEX "roles_business_id_idx" ON "roles"("business_id");
CREATE UNIQUE INDEX "roles_business_id_name_key" ON "roles"("business_id", "name");
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- UserRole: drop @@unique([userId, roleId]), add nullable business_id, add
-- 3-tuple uniqueness + lookup indexes.
DROP INDEX "user_roles_user_id_role_id_key";
ALTER TABLE "user_roles" ADD COLUMN "business_id" TEXT;
CREATE INDEX "user_roles_user_id_business_id_idx" ON "user_roles"("user_id", "business_id");
CREATE INDEX "user_roles_business_id_idx" ON "user_roles"("business_id");
CREATE UNIQUE INDEX "user_roles_user_id_role_id_business_id_key" ON "user_roles"("user_id", "role_id", "business_id");
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Backfill
-- ============================================================

-- (a) Existing roles are all system roles; business_id was just added as NULL,
--     so this UPDATE is a no-op. Included for explicit audit trail.
UPDATE "roles" SET "business_id" = NULL;

-- (b) Fan out Business_owner / Service_Provider user_role rows to one row per
--     UserBusiness membership. ON CONFLICT keeps the step idempotent.
INSERT INTO "user_roles" ("id", "user_id", "role_id", "business_id")
SELECT
    gen_random_uuid()::text AS id,
    ur.user_id,
    ur.role_id,
    ub.business_id
FROM "user_roles" ur
JOIN "roles" r ON r.id = ur.role_id
JOIN "user_businesses" ub ON ub.user_id = ur.user_id
WHERE r.name IN ('Business_owner', 'Service_Provider')
  AND ur.business_id IS NULL
ON CONFLICT ("user_id", "role_id", "business_id") DO NOTHING;

-- (c) Remove the original NULL-business_id rows for users whose memberships
--     have now been fanned out. Users with NO UserBusiness rows keep their
--     NULL row as a transitional state (tracked for follow-up cleanup).
DELETE FROM "user_roles" ur
USING "roles" r
WHERE ur.role_id = r.id
  AND r.name IN ('Business_owner', 'Service_Provider')
  AND ur.business_id IS NULL
  AND EXISTS (
      SELECT 1 FROM "user_businesses" ub WHERE ub.user_id = ur.user_id
  );

-- ============================================================
-- Sanity-check assertion (rolls back the whole transaction on failure)
-- ============================================================

DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- After backfill, no Business_owner/Service_Provider user_role row should
    -- have business_id=NULL UNLESS the user has zero user_business rows.
    SELECT COUNT(*) INTO orphan_count
    FROM "user_roles" ur
    JOIN "roles" r ON r.id = ur.role_id
    WHERE r.name IN ('Business_owner', 'Service_Provider')
      AND ur.business_id IS NULL
      AND ur.user_id IN (SELECT user_id FROM "user_businesses");

    IF orphan_count > 0 THEN
        RAISE EXCEPTION
          'Backfill incomplete: % UserRole rows still NULL despite UserBusiness membership',
          orphan_count;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- Manual verification queries (commented; run after migration)
-- ============================================================

-- Expected: only rows for users with NO UserBusiness membership.
-- SELECT COUNT(*) FROM user_roles ur
-- JOIN roles r ON ur.role_id = r.id
-- WHERE r.name IN ('Business_owner', 'Service_Provider')
--   AND ur.business_id IS NULL;

-- Expected: every (user, business) pair for fanned-out users.
-- SELECT u.email, b.name AS business, r.name AS role
-- FROM user_roles ur
-- JOIN users u      ON u.id = ur.user_id
-- JOIN roles r      ON r.id = ur.role_id
-- JOIN businesses b ON b.id = ur.business_id
-- WHERE r.name IN ('Business_owner', 'Service_Provider')
-- ORDER BY u.email, b.name;
