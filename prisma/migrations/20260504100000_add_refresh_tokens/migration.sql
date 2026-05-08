-- RefreshToken: rotated refresh tokens with family-based reuse detection
CREATE TABLE "refresh_tokens" (
    "id"             TEXT        NOT NULL,
    "user_id"        TEXT        NOT NULL,
    "family_id"      TEXT        NOT NULL,
    "token_hash"     TEXT        NOT NULL,
    "expires_at"     TIMESTAMP(3) NOT NULL,
    "revoked_at"     TIMESTAMP(3),
    "replaced_by_id" TEXT,
    "user_agent"     TEXT,
    "ip"             TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key"
    ON "refresh_tokens"("token_hash");

CREATE INDEX "refresh_tokens_user_id_idx"
    ON "refresh_tokens"("user_id");

CREATE INDEX "refresh_tokens_family_id_idx"
    ON "refresh_tokens"("family_id");
