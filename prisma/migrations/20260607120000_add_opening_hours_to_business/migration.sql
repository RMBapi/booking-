-- Per-business opening hours (CRM settings), stored as JSONB.
ALTER TABLE "businesses" ADD COLUMN "opening_hours" JSONB;
