-- Replace customer_business_sites (site-scoped) with business_customers (business-scoped).
-- Backfill from existing site memberships, then drop the old table.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- ============================================================
-- business_customers
-- ============================================================

CREATE TABLE "business_customers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_customers_user_id_business_id_key"
    ON "business_customers"("user_id", "business_id");
CREATE INDEX "business_customers_business_id_idx" ON "business_customers"("business_id");
CREATE INDEX "business_customers_user_id_idx" ON "business_customers"("user_id");

ALTER TABLE "business_customers" ADD CONSTRAINT "business_customers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_customers" ADD CONSTRAINT "business_customers_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one membership per user+business (dedupe multiple sites on same business)
INSERT INTO "business_customers" ("id", "user_id", "business_id", "status", "created_at")
SELECT
    gen_random_uuid()::text,
    cbs."user_id",
    bs."business_id",
    'Active'::"MemberStatus",
    CURRENT_TIMESTAMP
FROM "customer_business_sites" cbs
JOIN "business_sites" bs ON bs."id" = cbs."business_site_id"
ON CONFLICT ("user_id", "business_id") DO NOTHING;

-- ============================================================
-- Drop legacy customer_business_sites
-- ============================================================

ALTER TABLE "customer_business_sites" DROP CONSTRAINT IF EXISTS "customer_business_sites_user_id_fkey";
ALTER TABLE "customer_business_sites" DROP CONSTRAINT IF EXISTS "customer_business_sites_business_site_id_fkey";
DROP TABLE IF EXISTS "customer_business_sites";

-- ============================================================
-- users.email uniqueness (active accounts only)
-- ============================================================

CREATE UNIQUE INDEX "users_email_key" ON "users"("email") WHERE "deleted_at" IS NULL;

-- ============================================================
-- contacts: one email per business (active contacts)
-- ============================================================

CREATE UNIQUE INDEX "contacts_business_id_email_key"
    ON "contacts"("business_id", "email") WHERE "deleted_at" IS NULL;

-- ============================================================
-- bookings: tenant + customer lookup index
-- ============================================================

CREATE INDEX "bookings_business_id_user_id_idx" ON "bookings"("business_id", "user_id");

-- ============================================================
-- refresh_tokens: preserve customer tenant on rotation
-- ============================================================

ALTER TABLE "refresh_tokens" ADD COLUMN "business_id" TEXT;

COMMIT;
