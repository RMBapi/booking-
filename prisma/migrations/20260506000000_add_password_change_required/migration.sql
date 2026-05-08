-- Add password_change_required flag. Existing rows get the default `false`.
ALTER TABLE "users"
  ADD COLUMN "password_change_required" BOOLEAN NOT NULL DEFAULT false;
