"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components";
import { useGetBookings, useGetContacts, useUpdateBookingStatus } from "../hooks";
import { Booking, BookingStatus, Contact } from "@/types";
import * as toast from "@/lib/toast";
import { CalendarDays, ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";

interface BookingsAndContactsProps {
  businessId: string;
}

export const BookingsAndContacts: React.FC<BookingsAndContactsProps> = ({
  businessId,
}) => {
  const [activeTab, setActiveTab] = useState<"bookings" | "contacts">("bookings");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const bookingParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm.trim() || undefined,
      status: statusFilter || undefined,
    }),
    [currentPage, ITEMS_PER_PAGE, searchTerm, statusFilter]
  );

  const contactParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm.trim() || undefined,
    }),
    [currentPage, ITEMS_PER_PAGE, searchTerm]
  );

  const {
    bookings,
    meta: bookingsMeta,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetBookings(businessId, bookingParams);
  const {
    contacts,
    meta: contactsMeta,
    isLoading: contactsLoading,
  } = useGetContacts(businessId, contactParams);
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

  const formatDate = (isoString: string): string =>
    new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  const formatDateShortYear = (isoString: string): string =>
    new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "2-digit",
    });

  const formatYear = (isoString: string): string =>
    new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
    });

  const formatTime = (isoString: string): string =>
    new Date(isoString).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const matchesSelectedDate = useCallback((isoDateString: string): boolean => {
    if (!selectedDate) return true;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(isoDateString);
    return (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day
    );
  }, [selectedDate]);

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "border border-gray-200 bg-gray-100 text-gray-700";
    }
  };

  const currentItems = activeTab === "bookings" ? filteredBookings : filteredContacts;
  const totalEntries =
    activeTab === "bookings"
      ? bookingsMeta?.total ?? bookings.length
      : contactsMeta?.total ?? contacts.length;
  const totalPages =
    activeTab === "bookings"
      ? bookingsMeta?.totalPages ?? Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE))
      : contactsMeta?.totalPages ?? Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedBookings = filteredBookings;
  const pagedContacts = filteredContacts;

  const bookingCountLabel = bookingsMeta?.total ?? bookings.length;
  const contactCountLabel = contactsMeta?.total ?? contacts.length;

  return (
    <div className="space-y-8">
      <div className="flex w-full max-w-md items-center rounded-3xl border border-stone-200 bg-stone-50 p-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("bookings");
            setCurrentPage(1);
          }}
          className={`flex-1 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === "bookings"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-400"
          }`}
        >
          User ({bookingCountLabel})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("contacts");
            setCurrentPage(1);
          }}
          className={`flex-1 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === "contacts"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-400"
          }`}
        >
          Guest user ({contactCountLabel})
        </button>
      </div>

      <section className="overflow-hidden rounded-[2.1rem] border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 panel-gutter py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-300" />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              type="text"
              placeholder={
                activeTab === "bookings"
                  ? "Search user bookings..."
                  : "Search guest requests..."
              }
              className="h-14 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-base font-medium text-stone-700 outline-none transition placeholder:text-stone-300 focus:border-stone-300"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "bookings" && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-14 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 outline-none focus:border-stone-300"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            )}

            <label className="inline-flex h-14 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-600">
              <CalendarDays className="h-4 w-4" />
              <span>{selectedDate ? "Date selected" : "Filter by Date"}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-32 bg-transparent text-sm text-stone-500 outline-none"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-stone-100 bg-stone-50/60">
            <tr>
              <th className="panel-gutter py-6 text-left text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                Date & Time
              </th>
              <th className="px-6 py-6 text-left text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                {activeTab === "bookings" ? "User" : "Guest"}
              </th>
              <th className="px-6 py-6 text-left text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                Service
              </th>
              <th className="px-6 py-6 text-left text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                {activeTab === "bookings" ? "Status" : "Email"}
              </th>
              <th className="px-6 py-6 text-left text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                Notes
              </th>
              <th className="px-6 py-6 panel-edge-right text-left text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {activeTab === "bookings" &&
              !bookingsLoading &&
              pagedBookings.map((booking: Booking) => (
                <tr key={booking.id} className="border-b border-stone-100 last:border-b-0">
                  <td className="panel-gutter py-8">
                    {booking.bookingTime?.start ? (
                      <div>
                        <p className="text-2xl font-semibold text-stone-800">
                          {formatDateShortYear(booking.bookingTime.start)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-stone-400">
                          {formatTime(booking.bookingTime.start)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-stone-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-8">
                    <p className="text-lg font-semibold text-stone-800">
                      {(booking.user || booking.customer)
                        ? `${(booking.user || booking.customer)!.firstName} ${(booking.user || booking.customer)!.lastName}`
                        : "N/A"}
                    </p>
                  </td>
                  <td className="px-6 py-8 text-lg font-medium text-stone-700">
                    {booking.service?.name || "N/A"}
                  </td>
                  <td className="px-6 py-8">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-8 text-base italic text-stone-500">
                    {booking.customerNotes || "-"}
                  </td>
                  <td className="px-6 py-8 panel-edge-right">
                    <div className="flex items-center gap-3">
                      {booking.status === "Pending" ? (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={isUpdating}
                          className="rounded-2xl bg-stone-900 px-5 py-2.5 text-white hover:bg-black"
                        >
                          Confirm
                        </Button>
                      ) : (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50 text-stone-400">
                          <MoreVertical className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

            {activeTab === "contacts" &&
              !contactsLoading &&
              pagedContacts.map((contact: Contact) => (
                <tr key={contact.id} className="border-b border-stone-100 last:border-b-0">
                  <td className="panel-gutter py-8">
                    {contact.bookingTime?.start ? (
                      <div>
                        <p className="text-2xl font-semibold text-stone-800">
                          {formatDate(contact.bookingTime.start)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-stone-400">
                          {formatYear(contact.bookingTime.start)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-stone-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-8">
                    <p className="text-lg font-semibold text-stone-800">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-stone-500">{contact.phone}</p>
                  </td>
                  <td className="px-6 py-8 text-lg font-medium text-stone-700">
                    {contact.service?.name || "N/A"}
                  </td>
                  <td className="px-6 py-8 text-base text-stone-600">{contact.email}</td>
                  <td className="px-6 py-8 text-base italic text-stone-500">
                    {contact.notes || "-"}
                  </td>
                  <td className="px-6 py-8 panel-edge-right">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50 text-stone-400">
                      <MoreVertical className="h-4 w-4" />
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {activeTab === "bookings" && bookingsLoading && (
        <div className="panel-gutter py-16 text-center text-sm font-medium text-stone-500">
          Loading bookings...
        </div>
      )}

      {activeTab === "contacts" && contactsLoading && (
        <div className="panel-gutter py-16 text-center text-sm font-medium text-stone-500">
          Loading contact requests...
        </div>
      )}

      {!bookingsLoading && activeTab === "bookings" && filteredBookings.length === 0 && (
        <div className="panel-gutter py-16 text-center text-sm font-medium text-stone-500">
          No bookings found.
        </div>
      )}

      {!contactsLoading && activeTab === "contacts" && filteredContacts.length === 0 && (
        <div className="panel-gutter py-16 text-center text-sm font-medium text-stone-500">
          No contact requests found.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 panel-gutter py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
          Showing {currentItems.length} of {totalEntries} entries
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-stone-900 px-3 text-lg font-semibold text-white shadow-lg shadow-stone-900/20">
            {safePage}
          </span>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      </section>
    </div>
  );
};
