"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  Mail,
  Phone,
  Send,
  UserCircle,
} from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { Button } from "@/components/buttons";
import { Dropdown, StatusPill } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { getTeam } from "@/services";
import { useSupportTicket } from "@/features/business-owner/hooks/useSupportTickets";
import { TicketConversation } from "@/features/business-owner/components/contacts/TicketConversation";
import {
  TICKET_STATUSES,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/lib/supportTickets";
import type { TicketStatus } from "@/types";
import { formatDate } from "@/utils";

export default function TicketDetailPage() {
  return (
    <FeatureGate feature="view_tickets" fallback={<AccessDenied />}>
      <TicketDetailContent />
    </FeatureGate>
  );
}

function TicketDetailContent() {
  const params = useParams<{ businessId: string; ticketId: string }>();
  const { businessId, ticketId } = params;
  const { hasFeature } = usePermissions();
  const canManage = hasFeature("manage_tickets");

  const { ticket, isLoading, reply, isReplying, updateTicket, isUpdating } =
    useSupportTicket(businessId, ticketId);

  const teamQuery = useQuery({
    queryKey: ["team", businessId],
    queryFn: () => getTeam(businessId),
    enabled: !!businessId && canManage,
  });
  const assignees = (teamQuery.data ?? []).filter((m) => m.status === "Active");

  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const message = draft.trim();
    if (!message || isReplying) return;
    reply(message, { onSuccess: () => setDraft("") });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-7 w-48 rounded-md shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-10 text-center max-w-5xl">
        <p className="text-sm text-text-tertiary">
          Couldn&apos;t load this ticket.
        </p>
        <Link
          href={`/app/${businessId}/contacts`}
          className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Back to Contacts
        </Link>
      </div>
    );
  }

  const isClosed = ticket.status === "Closed";

  return (
    <main className="flex flex-col gap-6 max-w-5xl">
      <header>
        <Link
          href={`/app/${businessId}/contacts`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Contacts
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary tracking-display">
            {ticket.subject}
          </h1>
          <StatusPill tone={ticketStatusTone(ticket.status)}>
            {ticketStatusLabel(ticket.status)}
          </StatusPill>
        </div>
        <p className="mt-1 text-sm text-text-tertiary tabular">
          Ticket #{ticket.ticketNumber} · opened {formatDate(ticket.createdAt)}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Conversation + reply */}
        <div className="rounded-2xl border border-border-subtle bg-surface flex flex-col">
          <div className="p-6 flex-1">
            <TicketConversation messages={ticket.messages} />
          </div>

          {canManage ? (
            <div className="border-t border-border-subtle p-4">
              {isClosed && (
                <p className="mb-2 text-xs text-text-tertiary">
                  This ticket is closed. Replying will email the customer and
                  re-open the conversation.
                </p>
              )}
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={3}
                placeholder="Write a reply… (⌘/Ctrl + Enter to send)"
                className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary resize-y focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-text-quaternary">
                  Your reply is emailed to {ticket.requesterEmail}.
                </p>
                <Button
                  size="sm"
                  onClick={handleSend}
                  isLoading={isReplying}
                  disabled={!draft.trim()}
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Send reply
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border-subtle p-4">
              <p className="text-xs text-text-tertiary">
                You need the “manage tickets” permission to reply.
              </p>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border-subtle bg-surface p-5">
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              Requester
            </h2>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-primary">
                {ticket.requesterName}
              </p>
              <a
                href={`mailto:${ticket.requesterEmail}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 transition-colors break-all"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                {ticket.requesterEmail}
              </a>
              {ticket.requesterPhone && (
                <a
                  href={`tel:${ticket.requesterPhone}`}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                  {ticket.requesterPhone}
                </a>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-4">
            <div>
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                Status
              </h2>
              {canManage ? (
                <Dropdown className="w-full">
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      disabled={isUpdating}
                      className="w-full inline-flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-border-subtle bg-surface text-sm font-medium text-text-secondary hover:bg-subtle transition-colors disabled:opacity-50"
                    >
                      {ticketStatusLabel(ticket.status)}
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Menu className="w-full">
                    {TICKET_STATUSES.map((s: TicketStatus) => (
                      <Dropdown.Item
                        key={s}
                        selected={ticket.status === s}
                        onClick={() => updateTicket({ status: s })}
                      >
                        {ticketStatusLabel(s)}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <StatusPill tone={ticketStatusTone(ticket.status)}>
                  {ticketStatusLabel(ticket.status)}
                </StatusPill>
              )}
            </div>

            <div>
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                Assignee
              </h2>
              {canManage ? (
                <Dropdown className="w-full">
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      disabled={isUpdating}
                      className="w-full inline-flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-border-subtle bg-surface text-sm font-medium text-text-secondary hover:bg-subtle transition-colors disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <UserCircle className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                        {ticket.assignedTo?.name ?? "Unassigned"}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Menu className="w-full">
                    <Dropdown.Item
                      selected={!ticket.assignedTo}
                      onClick={() => updateTicket({ assignedToUserId: null })}
                    >
                      Unassigned
                    </Dropdown.Item>
                    {assignees.length > 0 && <Dropdown.Divider />}
                    {assignees.map((m) => (
                      <Dropdown.Item
                        key={m.userId}
                        selected={ticket.assignedTo?.id === m.userId}
                        onClick={() =>
                          updateTicket({ assignedToUserId: m.userId })
                        }
                      >
                        {m.firstName} {m.lastName}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <p className="text-sm text-text-secondary">
                  {ticket.assignedTo?.name ?? "Unassigned"}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
