"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, Inbox } from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import {
  DataTable,
  DataTableEmptyState,
  DataTableFooter,
  PersonCell,
  StatusPill,
  SearchInput,
  FilterBar,
  Dropdown,
  COL,
  type DataTableColumn,
} from "@/components/ui";
import { useSupportTickets } from "@/features/business-owner/hooks/useSupportTickets";
import {
  TICKET_STATUSES,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/lib/supportTickets";
import type { Ticket, TicketStatus } from "@/types";
import { cn, formatDate, formatTime } from "@/utils";

const PAGE_SIZE = 20;

export default function ContactsPage() {
  return (
    <FeatureGate feature="view_tickets" fallback={<AccessDenied />}>
      <ContactsContent />
    </FeatureGate>
  );
}

function ContactsContent() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [unassigned, setUnassigned] = useState(false);
  const [page, setPage] = useState(1);

  const { tickets, meta, isLoading } = useSupportTickets(businessId, {
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
    unassigned: unassigned || undefined,
    sortBy: "lastReplyAt",
    sortOrder: "desc",
  });

  const total = meta?.total ?? tickets.length;
  const pageCount = meta?.totalPages ?? 1;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const hasActiveFilters = Boolean(search || status || unassigned);

  const resetToFirstPage = () => setPage(1);

  const columns = useMemo<DataTableColumn<Ticket>[]>(
    () => [
      {
        key: "subject",
        header: "Ticket",
        width: 300,
        truncate: true,
        cell: (t) => (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {t.subject}
            </p>
            <p className="text-xs text-text-tertiary tabular mt-0.5">
              #{t.ticketNumber}
            </p>
          </div>
        ),
      },
      {
        key: "requester",
        header: "Requester",
        width: COL.person,
        cell: (t) => (
          <PersonCell name={t.requesterName} secondary={t.requesterEmail} />
        ),
      },
      {
        key: "status",
        header: "Status",
        width: 180,
        cell: (t) => (
          <StatusPill tone={ticketStatusTone(t.status)}>
            {ticketStatusLabel(t.status)}
          </StatusPill>
        ),
      },
      {
        key: "assignee",
        header: "Assignee",
        width: 160,
        cell: (t) =>
          t.assignedTo ? (
            <div className="text-sm text-text-secondary truncate">
              {t.assignedTo.name}
            </div>
          ) : (
            <span className="text-xs text-text-quaternary">Unassigned</span>
          ),
      },
      {
        key: "activity",
        header: "Last activity",
        width: COL.date,
        cell: (t) => {
          const ts = t.lastReplyAt ?? t.createdAt;
          return (
            <div title={formatDate(ts, "MMM D, YYYY h:mm A")}>
              <p className="text-sm text-text-secondary tabular">
                {formatDate(ts)}
              </p>
              <p className="text-xs text-text-tertiary tabular mt-0.5">
                {formatTime(ts, "h:mm A")}
              </p>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <main className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Contact Center
        </p>
        <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
          Contacts
        </h1>
        <p className="mt-1.5 text-sm text-text-tertiary">
          Support tickets from your customers. Reply to keep the conversation
          going — every reply emails the customer.
        </p>
      </header>

      <FilterBar
        search={
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            onClear={() => {
              setSearch("");
              resetToFirstPage();
            }}
            placeholder="Search subject, name, email, or message"
          />
        }
        hasActiveFilters={hasActiveFilters}
        onClearAll={() => {
          setSearch("");
          setStatus("");
          setUnassigned(false);
          resetToFirstPage();
        }}
        trailing={
          <>
            <button
              type="button"
              onClick={() => {
                setUnassigned((v) => !v);
                resetToFirstPage();
              }}
              className={cn(
                "h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
                unassigned
                  ? "border-primary-200 bg-primary-50/60 text-primary-700"
                  : "border-border-subtle bg-surface text-text-secondary hover:bg-subtle",
              )}
            >
              Unassigned
            </button>
            <Dropdown>
              <Dropdown.Trigger>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border-subtle bg-surface text-sm font-medium text-text-secondary hover:bg-subtle transition-colors"
                >
                  Status: {status ? ticketStatusLabel(status) : "All"}
                  <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Menu align="right">
                <Dropdown.Item
                  selected={status === ""}
                  onClick={() => {
                    setStatus("");
                    resetToFirstPage();
                  }}
                >
                  All statuses
                </Dropdown.Item>
                <Dropdown.Divider />
                {TICKET_STATUSES.map((s) => (
                  <Dropdown.Item
                    key={s}
                    selected={status === s}
                    onClick={() => {
                      setStatus(s);
                      resetToFirstPage();
                    }}
                  >
                    {ticketStatusLabel(s)}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={tickets}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        onRowClick={(t) => router.push(`/app/${businessId}/contacts/${t.id}`)}
        emptyState={
          <DataTableEmptyState
            icon={<Inbox />}
            title={hasActiveFilters ? "No matching tickets" : "No tickets yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Tickets submitted from your public site will show up here."
            }
          />
        }
      />

      {total > 0 && (
        <DataTableFooter
          total={total}
          start={start}
          end={end}
          page={page}
          pageCount={pageCount}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
        />
      )}
    </main>
  );
}
