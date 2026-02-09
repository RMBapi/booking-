-- Step 1: Add roles column as an array (initially allowing NULL)
ALTER TABLE "users" ADD COLUMN "roles" "UserRole"[];

-- Step 2: Migrate existing role data to roles array
UPDATE "users" SET "roles" = ARRAY["role"] WHERE "role" IS NOT NULL;

-- Step 3: Make roles NOT NULL after migration
ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL;

-- Step 4: Merge duplicate email records (keep the first one, aggregate roles)
-- First, identify emails with multiple records
WITH duplicate_emails AS (
  SELECT email, MIN(id) as keep_id
  FROM "users"
  WHERE deleted_at IS NULL
  GROUP BY email
  HAVING COUNT(*) > 1
),
users_to_merge AS (
  SELECT u.id, u.email, u.roles, de.keep_id
  FROM "users" u
  INNER JOIN duplicate_emails de ON u.email = de.email
  WHERE u.id != de.keep_id
)
-- Update the kept user with all roles from duplicates
UPDATE "users" u
SET "roles" = (
  SELECT array_agg(DISTINCT unnested_role)
  FROM (
    SELECT unnest(u2.roles) as unnested_role
    FROM "users" u2
    WHERE u2.email = u.email AND u2.deleted_at IS NULL
  ) subquery
)
FROM duplicate_emails de
WHERE u.id = de.keep_id;

-- Step 5: Update foreign key references to point to the kept user
-- Update user_businesses
UPDATE "user_businesses" ub
SET "user_id" = (
  SELECT MIN(id) FROM "users" WHERE email = (SELECT email FROM "users" WHERE id = ub.user_id)
)
WHERE EXISTS (
  SELECT 1 FROM "users" u1, "users" u2
  WHERE u1.email = u2.email AND u1.id != u2.id AND ub.user_id = u2.id
);

-- Update user_oauths
UPDATE "user_oauths" uo
SET "user_id" = (
  SELECT MIN(id) FROM "users" WHERE email = (SELECT email FROM "users" WHERE id = uo.user_id)
)
WHERE EXISTS (
  SELECT 1 FROM "users" u1, "users" u2
  WHERE u1.email = u2.email AND u1.id != u2.id AND uo.user_id = u2.id
);

-- Update service_providers
UPDATE "service_providers" sp
SET "user_id" = (
  SELECT MIN(id) FROM "users" WHERE email = (SELECT email FROM "users" WHERE id = sp.user_id)
)
WHERE EXISTS (
  SELECT 1 FROM "users" u1, "users" u2
  WHERE u1.email = u2.email AND u1.id != u2.id AND sp.user_id = u2.id
);

-- Update contact_users
UPDATE "contact_users" cu
SET "user_id" = (
  SELECT MIN(id) FROM "users" WHERE email = (SELECT email FROM "users" WHERE id = cu.user_id)
)
WHERE EXISTS (
  SELECT 1 FROM "users" u1, "users" u2
  WHERE u1.email = u2.email AND u1.id != u2.id AND cu.user_id = u2.id
);

-- Update bookings
UPDATE "bookings" b
SET "user_id" = (
  SELECT MIN(id) FROM "users" WHERE email = (SELECT email FROM "users" WHERE id = b.user_id)
)
WHERE EXISTS (
  SELECT 1 FROM "users" u1, "users" u2
  WHERE u1.email = u2.email AND u1.id != u2.id AND b.user_id = u2.id
);

-- Step 6: Delete duplicate user records (keep only the one with MIN(id) per email)
DELETE FROM "users"
WHERE id NOT IN (
  SELECT MIN(id)
  FROM "users"
  WHERE deleted_at IS NULL
  GROUP BY email
)
AND deleted_at IS NULL;

-- Step 7: Drop the composite unique constraint on (email, role)
DROP INDEX IF EXISTS "users_email_role_key";

-- Step 8: Create unique constraint on email only
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- Step 9: Drop the old role column
ALTER TABLE "users" DROP COLUMN "role";
