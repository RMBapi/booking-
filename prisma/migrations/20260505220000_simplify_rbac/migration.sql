-- Simplify RBAC: drop Role/Permission/RolePermission/UserRole, add User.system_role,
-- UserBusiness.role, UserBusiness.created_at, and the user_permission table.

-- 1. Add new columns (with defaults so backfill is fast).
ALTER TABLE "users"
  ADD COLUMN "system_role" TEXT NOT NULL DEFAULT 'Customer';

ALTER TABLE "user_businesses"
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'Service_Provider',
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Backfill User.system_role from the existing UserRole join.
-- Priority: Super_Admin > Business_owner > Service_Provider > Customer.
UPDATE "users" u
SET "system_role" = sub.role_name
FROM (
  SELECT
    ur.user_id,
    CASE
      WHEN BOOL_OR(r.name = 'Super_Admin')        THEN 'Super_Admin'
      WHEN BOOL_OR(r.name = 'Business_owner')     THEN 'Business_owner'
      WHEN BOOL_OR(r.name = 'Service_Provider')   THEN 'Service_Provider'
      WHEN BOOL_OR(r.name = 'Customer')           THEN 'Customer'
      ELSE 'Customer'
    END AS role_name
  FROM "user_roles" ur
  JOIN "roles" r ON r.id = ur.role_id
  GROUP BY ur.user_id
) sub
WHERE u.id = sub.user_id;

-- 3. Backfill UserBusiness.role from the user's resolved system_role.
UPDATE "user_businesses" ub
SET "role" = CASE
  WHEN u.system_role = 'Business_owner' THEN 'Business_owner'
  ELSE 'Service_Provider'
END
FROM "users" u
WHERE ub.user_id = u.id;

-- 4. Drop legacy RBAC tables (cascades the FKs).
DROP TABLE IF EXISTS "role_permissions" CASCADE;
DROP TABLE IF EXISTS "user_roles"       CASCADE;
DROP TABLE IF EXISTS "permissions"      CASCADE;
DROP TABLE IF EXISTS "roles"            CASCADE;

-- 5. Indexes for UserBusiness.
CREATE INDEX "user_businesses_user_id_idx"     ON "user_businesses" ("user_id");
CREATE INDEX "user_businesses_business_id_idx" ON "user_businesses" ("business_id");

-- 6. Create the user_permission table.
CREATE TABLE "user_permission" (
  "id"          TEXT        NOT NULL,
  "user_id"     TEXT        NOT NULL,
  "business_id" TEXT        NOT NULL,
  "permission"  TEXT        NOT NULL,
  "granted_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "granted_by"  TEXT        NOT NULL,

  CONSTRAINT "user_permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_permission_user_id_business_id_permission_key"
  ON "user_permission" ("user_id", "business_id", "permission");

CREATE INDEX "user_permission_user_id_business_id_idx"
  ON "user_permission" ("user_id", "business_id");

ALTER TABLE "user_permission"
  ADD CONSTRAINT "user_permission_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_permission"
  ADD CONSTRAINT "user_permission_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
