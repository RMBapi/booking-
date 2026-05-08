-- BusinessInvitation: pending invitations to join a business
CREATE TABLE "business_invitations" (
    "id"          TEXT        NOT NULL,
    "business_id" TEXT        NOT NULL,
    "email"       TEXT        NOT NULL,
    "role"        TEXT        NOT NULL DEFAULT 'Business_owner',
    "invited_by"  TEXT        NOT NULL,
    "token_hash"  TEXT        NOT NULL,
    "expires_at"  TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by" TEXT,
    "revoked_at"  TIMESTAMP(3),
    "revoked_by"  TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_invitations_token_hash_key"
    ON "business_invitations"("token_hash");

CREATE INDEX "business_invitations_business_id_idx"
    ON "business_invitations"("business_id");

CREATE INDEX "business_invitations_email_idx"
    ON "business_invitations"("email");


-- FailedEmail: dead-letter table for emails that exhausted retry attempts
CREATE TABLE "failed_emails" (
    "id"        TEXT        NOT NULL,
    "to_email"  TEXT        NOT NULL,
    "template"  TEXT        NOT NULL,
    "payload"   JSONB       NOT NULL,
    "error"     TEXT        NOT NULL,
    "attempts"  INTEGER     NOT NULL DEFAULT 1,
    "failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "failed_emails_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "failed_emails_template_idx"
    ON "failed_emails"("template");

CREATE INDEX "failed_emails_failed_at_idx"
    ON "failed_emails"("failed_at");
