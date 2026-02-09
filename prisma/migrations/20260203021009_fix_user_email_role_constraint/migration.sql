-- Drop the old unique constraint on just email
DROP INDEX IF EXISTS "users_email_key";

-- Create the composite unique constraint on (email, role) as specified in Prisma schema
CREATE UNIQUE INDEX "users_email_role_key" ON "users"("email", "role");
