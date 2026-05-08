-- Add 'CRM' to BookingSource enum so staff-placed bookings are distinguishable
-- in reports from website / phone / walk-in / mobile sources.
ALTER TYPE "BookingSource" ADD VALUE 'CRM';

-- Allow guest bookings: userId becomes nullable, and guest contact fields
-- are stored alongside the booking row when no User record exists.
-- The user_id FK already cascades on delete, but with nullable we need to
-- relax the NOT NULL and the FK constraint stays the same.
ALTER TABLE "bookings"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN "guest_first_name" TEXT,
  ADD COLUMN "guest_last_name" TEXT,
  ADD COLUMN "guest_email" TEXT,
  ADD COLUMN "guest_phone" TEXT;
