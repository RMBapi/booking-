-- Add MemberStatus enum and status column on user_businesses.
-- Existing memberships default to 'Active' so no one is locked out by the migration.

CREATE TYPE "MemberStatus" AS ENUM ('Pending', 'Active', 'Deactivated');

ALTER TABLE "user_businesses"
  ADD COLUMN "status" "MemberStatus" NOT NULL DEFAULT 'Active';
