"use client";

import React, { useCallback, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Inbox,
  Pencil,
  Plus,
  XCircle,
} from "lucide-react";
import {
  ActionMenu,
  type ActionMenuItem,
  COL,
  DataTable,
  type DataTableColumn,
  DataTableEmptyState,
  DataTableFooter,
  Dropdown,
  FilterBar,
  SearchInput,
  StatusPill,
  type StatusTone,
} from "@/components/ui";
import { useGetBookings, useGetContacts, useUpdateBookingStatus } from "../hooks";
import { Booking, BookingStatus, Contact } from "@/types";
import * as toast from "@/lib/toast";
import { cn } from "@/utils";
import { Button } from "@/components/buttons";
import { CancelBookingDialog } from "./CancelBookingDialog";
import { CreateBookingModal } from "./CreateBookingModal";
import { EditBookingModal } from "./EditBookingModal";

interface BookingsAndContactsProps {
  businessId: string;
}

const STATUS_OPTIONS: Array<{ value: BookingStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Completed", label: "Completed" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function statusTone(status: BookingStatus): StatusTone {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Pending":
      return "warning";
    case "Cancelled":
      return "danger";
    case "Completed":
      return "info";
    default:
      return "neutral";
  }
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const absMin = Math.abs(diffMs / 60000);
  const absDay = absMin / 1440;

  const past = diffMs < 0;
  if (absMin < 1) return "Just now";
  if (absMin < 60) return past ? `${Math.round(absMin)}m ago` : `in ${Math.round(absMin)}m`;
  const absHr = absMin / 60;
  if (absHr < 24) return past ? `${Math.round(absHr)}h ago` : `in ${Math.round(absHr)}h`;
  if (absDay < 7) return past ? `${Math.round(absDay)}d ago` : `in ${Math.round(absDay)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const BookingsAndContacts: React.FC<BookingsAndContactsProps> = ({
  businessId,
}) => {
  const [activeTab, setActiveTab] = useState<"bookings" | "contacts">("bookings");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);

  const bookingParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: searchTerm.trim() || undefined,
      status: statusFilter || undefined,
    }),
    [currentPage, pageSize, searchTerm, statusFilter]
  );

  const contactParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: searchTerm.trim() || undefined,
    }),
    [currentPage, pageSize, searchTerm]
  );

  // Lazy-fetch: only the active tab's data is queried; the inactive tab is
  // hydrated when the user switches to it (cached afterwards by react-query).
  const {
    bookings,
    meta: bookingsMeta,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetBookings(businessId, bookingParams, {
    enabled: activeTab === "bookings",
  });
  const {
    contacts,
    meta: contactsMeta,
    isLoading: contactsLoading,
  } = useGetContacts(businessId, contactParams, {
    enabled: activeTab === "contacts",
  });
  const { updateStatus, isUpdating } = useUpdateBookingStatus();

  const handleConfirmBooking = (bookingId: string) => {
    updateStatus(
      {
        id: bookingId,
        status: "Confirmed",
        businessId,
      },
      {
        onSuccess: () => {
          toast.success("Booking confirmed successfully!");
          refetchBookings();
        },
      }
    );
  };

  const handleCompleteBooking = (bookingId: string) => {
    updateStatus(
      {
        id: bookingId,
        status: "Completed",
        businessId,
      },
      {
        onSuccess: () => {
          toast.success("Booking marked as completed!");
          refetchBookings();
        },
      }
    );
  };

  const matchesSelectedDate = useCallback(
    (isoDateString: string): boolean => {
      if (!selectedDate) return true;
      const [year, month, day] = selectedDate.split("-").map(Number);
      const date = new Date(isoDateString);
      return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
      );
    },
    [selectedDate],
  );

  const filteredBookings = useMemo(() => {
    if (!selectedDate) return bookings;
    return bookings.filter((booking) => {
      const bookingStart = booking.bookingTime?.start;
      if (!bookingStart) return true;
      return matchesSelectedDate(bookingStart);
    });
  }, [bookings, selectedDate, matchesSelectedDate]);

  const filteredContacts = useMemo(() => {
    if (!selectedDate) return contacts;
    return contacts.filter((contact) => {
      const contactStart = contact.bookingTime?.start;
      if (!contactStart) return true;
      return matchesSelectedDate(contactStart);
    });
  }, [contacts, selectedDate, matchesSelectedDate]);

  const totalEntries =
    activeTab === "bookings"
      ? bookingsMeta?.total ?? bookings.length
      : contactsMeta?.total ?? contacts.length;
  const totalPages =
    activeTab === "bookings"
      ? bookingsMeta?.totalPages ?? Math.max(1, Math.ceil(filteredBookings.length / pageSize))
      : contactsMeta?.totalPages ?? Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  // Only show the badge count once that tab's data has actually been fetched.
  // Otherwise we'd show "0" on tabs that simply haven't been opened yet.
  const bookingCountLabel = bookingsMeta?.total;
  const contactCountLabel = contactsMeta?.total;

  const currentItems = activeTab === "bookings" ? filteredBookings : filteredContacts;
  const start = currentItems.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalEntries);

  const selectedStatusLabel =
    STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "All statuses";

  const bookingColumns: DataTableColumn<Booking>[] = [
    {
      key: "datetime",
      header: "Date",
      width: COL.date,
      cell: (b) =>
        b.bookingTime?.start ? (
          <div title={fullDateTime(b.bookingTime.start)}>
            <p className="text-sm font-semibold text-text-primary tabular">
              {shortDate(b.bookingTime.start)}
            </p>
            <p className="text-xs text-text-tertiary tabular mt-0.5">
              {shortTime(b.bookingTime.start)} · {relativeTime(b.bookingTime.start)}
            </p>
          </div>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "user",
      header: "User",
      width: COL.person,
      truncate: true,
      cell: (b) => {
        const u = b.user || b.customer;
        if (!u) return <span className="text-text-quaternary">—</span>;
        const initials = `${(u.firstName?.[0] ?? "")}${(u.lastName?.[0] ?? "")}`.toUpperCase();
        const fullName = `${u.firstName} ${u.lastName ?? ""}`.trim();
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[10px] font-semibold shrink-0">
              {initials || "?"}
            </span>
            <span className="text-sm font-semibold text-text-primary truncate" title={fullName}>
              {fullName}
            </span>
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "Number",
      width: COL.short,
      truncate: true,
      cell: (b) => {
        const u = b.user || b.customer;
        return u?.phone ? (
          <span className="text-sm text-text-secondary tabular block truncate" title={u.phone}>
            {u.phone}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      width: COL.email,
      truncate: true,
      cell: (b) => {
        const u = b.user || b.customer;
        return u?.email ? (
          <span className="text-sm text-text-secondary block truncate" title={u.email}>
            {u.email}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        );
      },
    },
    {
      key: "service",
      header: "Service",
      width: COL.short,
      truncate: true,
      cell: (b) =>
        b.service?.name ? (
          <span className="text-sm text-text-secondary block truncate" title={b.service.name}>
            {b.service.name}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "provider",
      header: "Provider",
      width: COL.short,
      truncate: true,
      cell: (b) => {
        const sp = b.serviceProvider;
        if (!sp) return <span className="text-text-quaternary">—</span>;
        const name = `${sp.firstName ?? ""} ${sp.lastName ?? ""}`.trim();
        return name ? (
          <span className="text-sm text-text-secondary block truncate" title={name}>
            {name}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: COL.status,
      cell: (b) => <StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill>,
    },
    {
      key: "notes",
      header: "Note",
      truncate: true,
      cell: (b) =>
        b.customerNotes ? (
          <span
            className="text-sm text-text-tertiary block truncate"
            title={b.customerNotes}
          >
            {b.customerNotes}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: COL.action,
      cell: (b) => {
        const isEditable = b.status !== "Cancelled" && b.status !== "Completed";
        const items: ActionMenuItem[] = [];
        if (b.status === "Pending") {
          items.push({
            key: "confirm",
            label: "Confirm",
            icon: <CheckCircle2 />,
            onClick: () => handleConfirmBooking(b.id),
            disabled: isUpdating,
          });
        }
        if (b.status === "Confirmed") {
          items.push({
            key: "complete",
            label: "Complete booking",
            icon: <BadgeCheck />,
            onClick: () => handleCompleteBooking(b.id),
            disabled: isUpdating,
          });
        }
        items.push({
          key: "view",
          label: "View details",
          icon: <Eye />,
          disabled: true,
          title: "Booking details view is coming soon.",
        });
        items.push({
          key: "edit",
          label: "Edit booking",
          icon: <Pencil />,
          onClick: () => setEditBooking(b),
          disabled: !isEditable,
          title: isEditable
            ? undefined
            : b.status === "Completed"
              ? "Completed bookings can't be edited."
              : "Cancelled bookings can't be edited.",
        });
        if (isEditable) {
          items.push({
            key: "cancel",
            label: "Cancel booking",
            icon: <XCircle />,
            onClick: () => setCancelBooking(b),
            danger: true,
          });
        }
        return <ActionMenu items={items} triggerLabel={`Actions for booking ${b.id}`} />;
      },
    },
  ];

  const contactColumns: DataTableColumn<Contact>[] = [
    {
      key: "datetime",
      header: "Date",
      width: COL.date,
      cell: (c) =>
        c.bookingTime?.start ? (
          <div title={fullDateTime(c.bookingTime.start)}>
            <p className="text-sm font-semibold text-text-primary tabular">
              {shortDate(c.bookingTime.start)}
            </p>
            <p className="text-xs text-text-tertiary tabular mt-0.5">
              {relativeTime(c.bookingTime.start)}
            </p>
          </div>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "guest",
      header: "Guest",
      width: COL.person,
      truncate: true,
      cell: (c) => {
        const initials = `${(c.firstName?.[0] ?? "")}${(c.lastName?.[0] ?? "")}`.toUpperCase();
        const fullName = `${c.firstName} ${c.lastName}`.trim();
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-text-secondary text-[10px] font-semibold border border-border-subtle shrink-0">
              {initials || "?"}
            </span>
            <span className="text-sm font-semibold text-text-primary truncate" title={fullName}>
              {fullName}
            </span>
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "Number",
      width: COL.short,
      truncate: true,
      cell: (c) =>
        c.phone ? (
          <span className="text-sm text-text-secondary tabular block truncate" title={c.phone}>
            {c.phone}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "email",
      header: "Email",
      width: COL.email,
      truncate: true,
      cell: (c) =>
        c.email ? (
          <span className="text-sm text-text-secondary block truncate" title={c.email}>
            {c.email}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "service",
      header: "Service",
      width: COL.short,
      truncate: true,
      cell: (c) =>
        c.service?.name ? (
          <span className="text-sm text-text-secondary block truncate" title={c.service.name}>
            {c.service.name}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "notes",
      header: "Note",
      truncate: true,
      cell: (c) =>
        c.notes ? (
          <span
            className="text-sm text-text-tertiary block truncate"
            title={c.notes}
          >
            {c.notes}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: COL.action,
      cell: () => (
        <ActionMenu
          items={[
            {
              key: "view",
              label: "View details",
              icon: <Eye />,
              disabled: true,
              title: "Guest details view is coming soon.",
            },
          ]}
          triggerLabel="Guest actions"
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Tab segmented control + primary action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <LayoutGroup id="bookings-tabs">
        <div className="inline-flex items-center rounded-xl border border-border-subtle bg-subtle/60 p-1 gap-1">
          {(
            [
              { k: "bookings" as const, label: "User", count: bookingCountLabel },
              { k: "contacts" as const, label: "Guest", count: contactCountLabel },
            ] as const
          ).map((t) => {
            const active = activeTab === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => {
                  setActiveTab(t.k);
                  setCurrentPage(1);
                }}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-lg px-4 h-9 text-sm font-medium transition-colors",
                  active ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bookings-tab"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="absolute inset-0 rounded-lg bg-surface shadow-[0_2px_8px_rgba(15,15,14,0.06)] border border-border-subtle"
                  />
                )}
                <span className="relative z-10">{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={cn(
                      "relative z-10 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular",
                      active ? "bg-primary-50 text-primary-700" : "bg-surface/80 text-text-tertiary",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
        <Button
          size="sm"
          onClick={() => setCreateBookingOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create booking
        </Button>
      </div>

      {/* Filter bar */}
      <FilterBar
        search={
          <SearchInput
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            placeholder={
              activeTab === "bookings"
                ? "Search bookings by name or email"
                : "Search guest requests by name"
            }
          />
        }
        trailing={
          <>
            {activeTab === "bookings" && (
              <Dropdown>
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-surface border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-subtle/70 transition-colors"
                  >
                    <span className="text-text-tertiary">Status:</span>
                    <span className="font-medium">{selectedStatusLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Menu align="right" className="min-w-[180px]">
                  {STATUS_OPTIONS.map((opt) => (
                    <Dropdown.Item
                      key={opt.value || "all"}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setCurrentPage(1);
                      }}
                      selected={statusFilter === opt.value}
                    >
                      {opt.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            <label
              className={cn(
                "inline-flex items-center gap-2 h-10 rounded-lg bg-surface border border-border-subtle px-3 text-sm cursor-pointer transition-colors",
                selectedDate ? "text-text-primary" : "text-text-secondary hover:bg-subtle/70",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="font-medium">
                {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Filter by date"}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="sr-only"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDate("");
                    setCurrentPage(1);
                  }}
                  aria-label="Clear date filter"
                  className="ml-1 text-text-quaternary hover:text-text-primary text-xs"
                >
                  ×
                </button>
              )}
            </label>
          </>
        }
      />

      {/* Tables */}
      {activeTab === "bookings" ? (
        <DataTable
          columns={bookingColumns}
          data={filteredBookings}
          rowKey={(b) => b.id}
          isLoading={bookingsLoading}
          loadingRows={pageSize > 6 ? 6 : pageSize}
          emptyState={
            <DataTableEmptyState
              icon={<Inbox />}
              title="No bookings found"
              description={
                searchTerm || statusFilter || selectedDate
                  ? "Try adjusting your filters."
                  : "Bookings will appear here as they come in."
              }
            />
          }
        />
      ) : (
        <DataTable
          columns={contactColumns}
          data={filteredContacts}
          rowKey={(c) => c.id}
          isLoading={contactsLoading}
          loadingRows={pageSize > 6 ? 6 : pageSize}
          emptyState={
            <DataTableEmptyState
              icon={<Clock />}
              title="No guest requests"
              description="Guests who book without an account will appear here."
            />
          }
        />
      )}

      {/* Footer pagination */}
      {totalEntries > 0 && (
        <DataTableFooter
          total={totalEntries}
          start={start}
          end={end}
          page={safePage}
          pageCount={totalPages}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setCurrentPage(1);
          }}
        />
      )}

      <EditBookingModal
        businessId={businessId}
        booking={editBooking}
        onClose={() => setEditBooking(null)}
      />
      <CancelBookingDialog
        businessId={businessId}
        booking={cancelBooking}
        onClose={() => setCancelBooking(null)}
      />
      <CreateBookingModal
        businessId={businessId}
        open={createBookingOpen}
        onClose={() => setCreateBookingOpen(false)}
      />
    </div>
  );
};
