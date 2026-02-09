-- Drop the unique constraint on email (this also drops its underlying index)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";
