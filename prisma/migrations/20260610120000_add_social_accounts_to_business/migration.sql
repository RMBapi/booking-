-- Per-business social account links (e.g. facebook, instagram), stored as JSONB.
-- Shape: [{ "platform": "facebook", "url": "https://..." }, ...]
ALTER TABLE "businesses" ADD COLUMN "social_accounts" JSONB;
