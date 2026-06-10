import type { StatusTone } from "@/components/ui/StatusPill";
import type { TicketStatus } from "@/types";

/**
 * Support-ticket status presentation — label + pill tone. Statuses come from
 * the API in PascalCase (see contact-us-integration.md); humanise them here so
 * the list and detail views stay consistent.
 */
export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; tone: StatusTone }
> = {
  Open: { label: "Open", tone: "info" },
  InProgress: { label: "In progress", tone: "warning" },
  WaitingForCustomer: { label: "Waiting for customer", tone: "neutral" },
  Resolved: { label: "Resolved", tone: "success" },
  Closed: { label: "Closed", tone: "muted" },
};

/** Ordered statuses for filter dropdowns and the status picker. */
export const TICKET_STATUSES: TicketStatus[] = [
  "Open",
  "InProgress",
  "WaitingForCustomer",
  "Resolved",
  "Closed",
];

export function ticketStatusLabel(status: TicketStatus): string {
  return TICKET_STATUS_META[status]?.label ?? status;
}

export function ticketStatusTone(status: TicketStatus): StatusTone {
  return TICKET_STATUS_META[status]?.tone ?? "neutral";
}
