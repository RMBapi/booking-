-- Contact Us / Support ticketing.
-- Adds support_tickets (tenant + platform) and support_messages (thread).

BEGIN;

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE "SupportTicketType" AS ENUM ('Business', 'Platform');
CREATE TYPE "SupportTicketStatus" AS ENUM ('Open', 'InProgress', 'WaitingForCustomer', 'Resolved', 'Closed');
CREATE TYPE "SupportMessageAuthor" AS ENUM ('Customer', 'Staff', 'System');

-- ============================================================
-- support_tickets
-- ============================================================

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" SERIAL NOT NULL,
    "type" "SupportTicketType" NOT NULL DEFAULT 'Business',
    "business_id" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'Open',
    "subject" TEXT NOT NULL,
    "requester_user_id" TEXT,
    "requester_name" TEXT NOT NULL,
    "requester_email" TEXT NOT NULL,
    "requester_phone" TEXT,
    "assigned_to_user_id" TEXT,
    "last_reply_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");
CREATE INDEX "support_tickets_business_id_status_idx" ON "support_tickets"("business_id", "status");
CREATE INDEX "support_tickets_type_status_idx" ON "support_tickets"("type", "status");
CREATE INDEX "support_tickets_assigned_to_user_id_idx" ON "support_tickets"("assigned_to_user_id");

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_user_id_fkey"
    FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_user_id_fkey"
    FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- support_messages
-- ============================================================

CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_type" "SupportMessageAuthor" NOT NULL,
    "author_user_id" TEXT,
    "author_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "via_email" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_messages_ticket_id_idx" ON "support_messages"("ticket_id");

ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey"
    FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_user_id_fkey"
    FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
