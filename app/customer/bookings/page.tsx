"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  LogOut,
  Receipt,
  Search,
  Star,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader } from "@/components";
import { BRAND, getImageUrl } from "@/lib/publicBrand";
import {
  cancelBooking,
  deleteReview,
  getMyBookings,
  submitReview,
  updateReview,
} from "@/services";
import { Booking, BookingStatus } from "@/types";
import { ReviewModal, ReviewSubmitPayload } from "./_components/ReviewModal";
import { CancelBookingModal } from "./_components/CancelBookingModal";

type Filter = "all" | "upcoming" | "completed";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function computeDuration(start?: string, end?: string) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function statusToFilter(status: BookingStatus): Filter | "cancelled" {
  if (status === "Pending" || status === "Confirmed") return "upcoming";
  if (status === "Completed") return "completed";
  return "cancelled";
}

function unwrapBookings(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as Booking[];
    if (r.data && typeof r.data === "object") {
      const inner = (r.data as Record<string, unknown>).data;
      if (Array.isArray(inner)) return inner as Booking[];
    }
  }
  return [];
}

function providerFullName(b: Booking) {
  const first = b.serviceProvider?.user?.firstName ?? "";
  const last = b.serviceProvider?.user?.lastName ?? "";
  return `${first} ${last}`.trim();
}

function priceNumber(raw: unknown) {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading: authLoading } = useRoleAuth();
  const { user, token } = getSession("Customer");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth/login/customer");
    }
  }, [authLoading, token, router]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyBookings();
      const list = unwrapBookings(res?.data);
      setBookings(list);
    } catch (err) {
      toast.error("Failed to load bookings. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

  const businessSlug =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_businessSiteSlug")
      : null;

  const handleBack = () => {
    if (businessSlug) router.push(`/business/slug/${businessSlug}`);
    else router.push("/");
  };

  const handleLogout = () => {
    logoutRole("Customer");
    if (businessSlug) router.push(`/business/slug/${businessSlug}`);
    else router.push("/auth/login/customer");
  };

  const openCancelModal = (booking: Booking) => {
    setCancelTarget(booking);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelingId) return;
    setCancelModalOpen(false);
    setCancelTarget(null);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    const trimmed = reason.trim() || "Cancelled by customer";

    try {
      setCancelingId(cancelTarget.id);
      await cancelBooking(
        cancelTarget.id,
        { cancellationReason: trimmed },
        cancelTarget.businessId,
      );
      toast.success("Booking cancelled successfully!");
      setCancelModalOpen(false);
      setCancelTarget(null);
      await fetchBookings();
    } catch (err) {
      toast.error("Could not cancel the booking. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setCancelingId(null);
    }
  };

  const openCreateReview = (booking: Booking) => {
    setActiveBooking(booking);
    setReviewModalOpen(true);
  };

  const openEditReview = (booking: Booking) => {
    setActiveBooking(booking);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    setReviewModalOpen(false);
    setActiveBooking(null);
  };

  const handleReviewSubmit = async (data: ReviewSubmitPayload) => {
    if (!activeBooking) return;
    const isEdit = !!activeBooking.review;
    try {
      setReviewSubmitting(true);
      if (isEdit) {
        await updateReview(activeBooking.id, data);
        toast.success("Review updated successfully!");
      } else {
        await submitReview(activeBooking.id, data);
        toast.success("Review submitted successfully!");
      }
      setReviewModalOpen(false);
      setActiveBooking(null);
      await fetchBookings();
    } catch (err) {
      toast.error(
        isEdit
          ? "Could not update review. Please try again."
          : "Could not submit review. Please try again.",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (booking: Booking) => {
    if (!booking.review) return;
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm("Delete this review? You can submit a new one afterwards.")
        : false;
    if (!confirmed) return;

    try {
      setDeletingReviewId(booking.id);
      await deleteReview(booking.id);
      toast.success("Review deleted.");
      await fetchBookings();
    } catch (err) {
      toast.error("Could not delete review. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => statusToFilter(b.status) === "upcoming").length;
    const completed = bookings.filter((b) => statusToFilter(b.status) === "completed").length;
    const totalSpent = bookings
      .filter((b) => statusToFilter(b.status) === "completed")
      .reduce((sum, b) => sum + priceNumber(b.service?.price), 0);
    return { upcoming, completed, totalSpent };
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const bucket = statusToFilter(b.status);
      const matchesFilter = filter === "all" || bucket === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const serviceName = (b.service?.name ?? "").toLowerCase();
      const providerName = providerFullName(b).toLowerCase();
      const businessName = (b.business?.name ?? "").toLowerCase();
      return (
        serviceName.includes(q) ||
        providerName.includes(q) ||
        businessName.includes(q)
      );
    });
  }, [bookings, filter, searchQuery]);

  if (authLoading) return <PageLoader />;
  if (!user || !token) return null;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BRAND.dark }}>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-16"
        style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest mr-2 transition-colors"
            style={{ color: "#888" }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span
            className="font-black text-lg uppercase tracking-[0.12em]"
            style={{ color: BRAND.dark }}
          >
            My Bookings
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm font-semibold" style={{ color: BRAND.dark }}>
            {user.firstName} {user.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-all"
            style={{ backgroundColor: BRAND.card, color: "white" }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero */}
        <section className="py-12 px-6 lg:px-16" style={{ backgroundColor: BRAND.darker }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: BRAND.accent }}
              >
                Your Appointments
              </p>
              <h1
                className="font-black uppercase text-white mb-3"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  letterSpacing: "0.04em",
                }}
              >
                MY BOOKINGS
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)" }} className="text-base">
                Manage and review your appointments.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                {
                  icon: CalendarClock,
                  label: "Upcoming",
                  value: String(stats.upcoming),
                },
                {
                  icon: CheckCircle2,
                  label: "Completed",
                  value: String(stats.completed),
                },
                {
                  icon: Receipt,
                  label: "Total Spent",
                  value: `$${stats.totalSpent.toFixed(2)}`,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-4 rounded p-5"
                  style={{ backgroundColor: BRAND.card }}
                >
                  <div
                    className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <s.icon className="w-5 h-5" style={{ color: BRAND.accent }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {s.label}
                    </p>
                    <p className="text-xl font-bold text-white mt-0.5">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section
          className="sticky top-16 z-30 border-b"
          style={{
            backgroundColor: BRAND.dark,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-16 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div
                className="inline-flex rounded-lg p-1 self-start"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                {[
                  { key: "all" as Filter, label: "All" },
                  { key: "upcoming" as Filter, label: "Booked" },
                  { key: "completed" as Filter, label: "Completed" },
                ].map(({ key, label }) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all"
                      style={{
                        backgroundColor: active ? BRAND.cta : "transparent",
                        color: active ? "white" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* List */}
        <section className="py-10 px-6 lg:px-16">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div
                className="rounded p-16 text-center"
                style={{ backgroundColor: BRAND.card }}
              >
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Loading your bookings...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded p-16 text-center"
                style={{ backgroundColor: BRAND.card }}
              >
                <div
                  className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <Calendar
                    className="h-8 w-8"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No bookings found
                </h3>
                <p
                  className="text-sm mb-8"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {searchQuery
                    ? "Try adjusting your search or filter."
                    : "Book your first appointment to get started."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 rounded text-white text-sm font-bold uppercase tracking-widest transition-all"
                    style={{ backgroundColor: BRAND.cta }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = BRAND.ctaHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = BRAND.cta)
                    }
                  >
                    Browse Services
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((booking, idx) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    index={idx}
                    canceling={cancelingId === booking.id}
                    deletingReview={deletingReviewId === booking.id}
                    onCancel={openCancelModal}
                    onCreateReview={openCreateReview}
                    onEditReview={openEditReview}
                    onDeleteReview={handleDeleteReview}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <ReviewModal
        isOpen={reviewModalOpen && !!activeBooking}
        mode={activeBooking?.review ? "edit" : "create"}
        serviceName={activeBooking?.service?.name ?? "Service"}
        providerName={activeBooking ? providerFullName(activeBooking) : undefined}
        initialRating={activeBooking?.review?.rating ?? 0}
        initialComment={activeBooking?.review?.comment ?? ""}
        submitting={reviewSubmitting}
        onClose={closeReviewModal}
        onSubmit={handleReviewSubmit}
      />

      <CancelBookingModal
        isOpen={cancelModalOpen && !!cancelTarget}
        serviceName={cancelTarget?.service?.name ?? "Service"}
        providerName={cancelTarget ? providerFullName(cancelTarget) : undefined}
        dateLabel={
          cancelTarget ? formatDate(cancelTarget.bookingTime?.start) : undefined
        }
        timeLabel={
          cancelTarget ? formatTime(cancelTarget.bookingTime?.start) : undefined
        }
        submitting={!!cancelingId && cancelingId === cancelTarget?.id}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

interface BookingRowProps {
  booking: Booking;
  index: number;
  canceling: boolean;
  deletingReview: boolean;
  onCancel: (b: Booking) => void;
  onCreateReview: (b: Booking) => void;
  onEditReview: (b: Booking) => void;
  onDeleteReview: (b: Booking) => void;
}

function BookingRow({
  booking,
  index,
  canceling,
  deletingReview,
  onCancel,
  onCreateReview,
  onEditReview,
  onDeleteReview,
}: BookingRowProps) {
  const bucket = statusToFilter(booking.status);
  const serviceName = booking.service?.name ?? "Service";
  const providerName = providerFullName(booking);
  const duration = computeDuration(booking.bookingTime?.start, booking.bookingTime?.end);
  const price = priceNumber(booking.service?.price);
  const businessName = booking.business?.name;

  // Thumbnails
  const thumbnailUrl =
    getImageUrl(booking.business?.image) ??
    getImageUrl(booking.business?.logo) ??
    null;
  const providerAvatarUrl = getImageUrl(booking.serviceProvider?.impUrl ?? null);

  const statusLabel =
    bucket === "upcoming"
      ? booking.status === "Pending"
        ? "Pending"
        : "Booked"
      : bucket === "completed"
        ? "Completed"
        : "Cancelled";

  const statusStyles: Record<string, { bg: string; color: string }> = {
    upcoming: { bg: "rgba(201, 150, 109, 0.18)", color: BRAND.accent },
    completed: { bg: "rgba(34, 197, 94, 0.15)", color: "#4ADE80" },
    cancelled: { bg: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5" },
  };
  const sStyle = statusStyles[bucket];

  const review = booking.review ?? null;
  const canReview = bucket === "completed" && !review;
  const canEditReview = bucket === "completed" && !!review;

  const isUpcoming = bucket === "upcoming";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="rounded-lg p-5 transition-all"
      style={{
        backgroundColor: BRAND.card,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Top-right status badge — consistent placement across all states */}
      <div className="mb-4 flex justify-end">
        <span
          className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: sStyle.bg, color: sStyle.color }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Thumbnail */}
        <div
          className="w-full md:w-20 h-40 md:h-20 rounded-lg overflow-hidden flex-shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          {thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnailUrl}
              alt={serviceName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar
                className="w-8 h-8"
                style={{ color: "rgba(255,255,255,0.25)" }}
              />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">
            {serviceName}
          </h3>

          {providerName && (
            <div className="flex items-center gap-2 mt-1.5">
              <div
                className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                {providerAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={providerAvatarUrl}
                    alt={providerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon
                      className="w-3 h-3"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    />
                  </div>
                )}
              </div>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                with <span className="font-semibold">{providerName}</span>
              </span>
            </div>
          )}
          {businessName && (
            <p
              className="text-[11px] mt-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {businessName}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: BRAND.accent }} />
              <span>{formatDate(booking.bookingTime?.start)}</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: BRAND.accent }} />
              <span>
                {formatTime(booking.bookingTime?.start)}
                {duration ? ` · ${duration}` : ""}
              </span>
            </div>
            {price > 0 && (
              <div className="text-sm font-bold text-white">
                ${price.toFixed(2)}
              </div>
            )}
          </div>

          {/* Existing review display */}
          {review && (
            <div
              className="mt-4 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      style={{
                        color: i <= review.rating ? "#F59E0B" : "rgba(255,255,255,0.2)",
                        fill: i <= review.rating ? "#F59E0B" : "transparent",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Your review
                </span>
              </div>
              {review.comment && (
                <p
                  className="mt-2 text-xs italic line-clamp-2"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  &ldquo;{review.comment}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right actions (completed states only — review / edit / delete) */}
        {!isUpcoming && (canReview || canEditReview) && (
          <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch md:w-36 md:flex-shrink-0">
            {canReview && (
              <button
                onClick={() => onCreateReview(booking)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all"
                style={{ backgroundColor: BRAND.cta, color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.ctaHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.cta)}
              >
                <Star className="w-3.5 h-3.5" />
                Leave Review
              </button>
            )}

            {canEditReview && (
              <>
                <button
                  onClick={() => onEditReview(booking)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all"
                  style={{
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "white",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND.cta;
                    e.currentTarget.style.borderColor = BRAND.cta;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                  }}
                >
                  <Star className="w-3.5 h-3.5" />
                  Edit Review
                </button>
                <button
                  onClick={() => onDeleteReview(booking)}
                  disabled={deletingReview}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "rgba(252, 165, 165, 0.4)",
                    color: "#FCA5A5",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!deletingReview)
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingReview ? "Deleting..." : "Delete"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom-right cancel button for upcoming/pending bookings */}
      {isUpcoming && (
        <div
          className="mt-5 pt-4 flex justify-end"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => onCancel(booking)}
            disabled={canceling}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              borderColor: "rgba(252, 165, 165, 0.5)",
              color: "#FCA5A5",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!canceling)
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="w-3.5 h-3.5" />
            {canceling ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
