"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Receipt,
  Search,
  Star,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader } from "@/components";
import { CustomerSiteNavigation } from "@/components/navigation";
import { ELEGANZA, getImageUrl } from "@/lib/publicBrand";
import {
  cancelBooking,
  deleteReview,
  getMyBookings,
  getPublicServicesByBusinessSlug,
  submitReview,
  updateReview,
} from "@/services";
import { Booking, BookingStatus } from "@/types";
import { ReviewModal, ReviewSubmitPayload } from "./_components/ReviewModal";
import { CancelBookingModal } from "./_components/CancelBookingModal";

type Filter = "all" | "upcoming" | "completed" | "cancelled";

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
  const { getSession, isLoading: authLoading } = useRoleAuth();
  const { user, token } = getSession("Customer");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
  const [serviceImagesById, setServiceImagesById] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth/login/customer");
    }
  }, [authLoading, token, router]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const slug =
        (typeof window !== "undefined"
          ? localStorage.getItem("customer_businessSiteSlug")
          : null) ||
        process.env.NEXT_PUBLIC_BUSINESS_SLUG ||
        undefined;
      const businessId = getSession("Customer").businessId ?? undefined;
      const res = await getMyBookings(slug ?? undefined, businessId);
      setBookings(unwrapBookings(res?.data));
    } catch (err) {
      // A failed load (server error, missing business context, or an
      // unreachable backend) must NOT log the customer out — their session is
      // still valid. Show a clear error and let them retry. Genuine token
      // failures (401) are handled centrally by the http client interceptor.
      setLoadError(true);
      toast.error(
        "Something went wrong loading your bookings. Please try again.",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getSession]);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

  const businessSlug =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_businessSiteSlug")
      : null;
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG || null;
  const resolvedSlug = businessSlug || envSlug;

  const fetchServiceImages = useCallback(async () => {
    if (!resolvedSlug) return;
    try {
      const res = await getPublicServicesByBusinessSlug(resolvedSlug);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      const imageMap: Record<string, string> = {};
      list.forEach((service: { id?: string; image?: string | null }) => {
        if (service?.id && service.image) {
          imageMap[service.id] = service.image;
        }
      });
      setServiceImagesById(imageMap);
    } catch {
      // Ignore image hydration failures; bookings still render without thumbnails.
    }
  }, [resolvedSlug]);

  useEffect(() => {
    if (resolvedSlug) fetchServiceImages();
  }, [resolvedSlug, fetchServiceImages]);

  const handleBrowseServices = () => {
    if (resolvedSlug)
      router.push(`/business/slug/${resolvedSlug}#services-section`);
    else router.push("/");
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
    const cancelBusinessSlug = cancelTarget.business?.slug || resolvedSlug;

    if (!cancelBusinessSlug) {
      toast.error("Business slug is required to cancel this booking.");
      return;
    }

    try {
      setCancelingId(cancelTarget.id);
      await cancelBooking(
        cancelTarget.id,
        { cancellationReason: trimmed },
        cancelBusinessSlug,
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
        ? window.confirm(
            "Delete this review? You can submit a new one afterwards.",
          )
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
    const upcoming = bookings.filter(
      (b) => statusToFilter(b.status) === "upcoming",
    ).length;
    const completed = bookings.filter(
      (b) => statusToFilter(b.status) === "completed",
    ).length;
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
    <div
      className="min-h-screen text-[#222222]"
      style={{ backgroundColor: ELEGANZA.background }}
    >
      {/* Shared site navigation — keeps Home / Contact / My Bookings reachable */}
      <CustomerSiteNavigation />

      <main className="pt-18 md:pt-20 lg:pt-22">
        {/* Hero */}
        <section
          className="py-12 px-6 lg:px-16"
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: ELEGANZA.inkMuted }}
              >
                Your Appointments
              </p>
              <h1
                className="font-black uppercase mb-3"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  letterSpacing: "0.04em",
                  color: ELEGANZA.ink,
                }}
              >
                MY BOOKINGS
              </h1>
              <p style={{ color: ELEGANZA.inkMuted }} className="text-base">
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
                  style={{
                    backgroundColor: ELEGANZA.surface,
                    border: `1px solid ${ELEGANZA.border}`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ELEGANZA.surfaceMuted }}
                  >
                    <s.icon
                      className="w-5 h-5"
                      style={{ color: ELEGANZA.ink }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: ELEGANZA.inkMuted }}
                    >
                      {s.label}
                    </p>
                    <p
                      className="text-xl font-bold mt-0.5"
                      style={{ color: ELEGANZA.ink }}
                    >
                      {s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section
          className="sticky top-18 md:top-20 lg:top-22 z-30 border-b"
          style={{
            backgroundColor: ELEGANZA.surface,
            borderColor: ELEGANZA.border,
          }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-16 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div
                className="inline-flex rounded-lg p-1 self-start"
                style={{ backgroundColor: ELEGANZA.surfaceMuted }}
              >
                {[
                  { key: "all" as Filter, label: "All" },
                  { key: "upcoming" as Filter, label: "Booked" },
                  { key: "completed" as Filter, label: "Completed" },
                  { key: "cancelled" as Filter, label: "Cancelled" },
                ].map(({ key, label }) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all"
                      style={{
                        backgroundColor: active ? ELEGANZA.ink : "transparent",
                        color: active ? "white" : ELEGANZA.inkMuted,
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
                  style={{ color: ELEGANZA.inkMuted }}
                />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: ELEGANZA.surface,
                    color: ELEGANZA.ink,
                    border: `1px solid ${ELEGANZA.border}`,
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
                style={{
                  backgroundColor: ELEGANZA.surface,
                  border: `1px solid ${ELEGANZA.border}`,
                }}
              >
                <p className="text-sm" style={{ color: ELEGANZA.inkMuted }}>
                  Loading your bookings...
                </p>
              </div>
            ) : loadError ? (
              <div
                className="rounded p-16 text-center"
                style={{
                  backgroundColor: ELEGANZA.surface,
                  border: `1px solid ${ELEGANZA.border}`,
                }}
              >
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: ELEGANZA.ink }}
                >
                  Something went wrong
                </h3>
                <p
                  className="text-sm mb-8"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  We couldn&apos;t load your bookings right now. Please check
                  your connection and try again.
                </p>
                <button
                  onClick={() => fetchBookings()}
                  className="px-6 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
                  style={{ backgroundColor: ELEGANZA.cta }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
                  }
                >
                  Try Again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded p-16 text-center"
                style={{
                  backgroundColor: ELEGANZA.surface,
                  border: `1px solid ${ELEGANZA.border}`,
                }}
              >
                <div
                  className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: ELEGANZA.surfaceMuted }}
                >
                  <Calendar
                    className="h-8 w-8"
                    style={{ color: ELEGANZA.inkMuted }}
                  />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: ELEGANZA.ink }}
                >
                  No bookings found
                </h3>
                <p
                  className="text-sm mb-8"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  {searchQuery
                    ? "Try adjusting your search or filter."
                    : "Book your first appointment to get started."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleBrowseServices}
                    className="px-6 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
                    style={{ backgroundColor: ELEGANZA.cta }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        ELEGANZA.ctaHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
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
                    serviceImagesById={serviceImagesById}
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
        providerName={
          activeBooking ? providerFullName(activeBooking) : undefined
        }
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
  serviceImagesById: Record<string, string>;
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
  serviceImagesById,
  onCancel,
  onCreateReview,
  onEditReview,
  onDeleteReview,
}: BookingRowProps) {
  const bucket = statusToFilter(booking.status);
  const serviceName = booking.service?.name ?? "Service";
  const providerName = providerFullName(booking);
  const duration = computeDuration(
    booking.bookingTime?.start,
    booking.bookingTime?.end,
  );
  const price = priceNumber(booking.service?.price);
  const businessName = booking.business?.name;

  // Thumbnails
  const bookingService = booking.service as { imageUrl?: string } | undefined;
  const thumbnailUrl =
    getImageUrl(booking.service?.image) ||
    getImageUrl(bookingService?.imageUrl) ||
    getImageUrl(serviceImagesById[booking.serviceId]) ||
    null;
  const providerAvatarUrl = getImageUrl(
    booking.serviceProvider?.impUrl ?? null,
  );

  const statusLabel =
    bucket === "upcoming"
      ? booking.status === "Pending"
        ? "Pending"
        : "Booked"
      : bucket === "completed"
        ? "Completed"
        : "Cancelled";

  const statusStyles: Record<string, { bg: string; color: string }> = {
    upcoming: { bg: "rgba(129, 123, 100, 0.15)", color: ELEGANZA.accent },
    completed: { bg: "rgba(34, 197, 94, 0.12)", color: "#2F855A" },
    cancelled: { bg: "rgba(239, 68, 68, 0.12)", color: "#B91C1C" },
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
      className="rounded-xl p-5 sm:p-6 transition-all hover:shadow-sm"
      style={{
        backgroundColor: ELEGANZA.surface,
        border: `1px solid ${ELEGANZA.border}`,
      }}
    >
      {/* ── Header: thumbnail · service info · status ── */}
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden flex-shrink-0"
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
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
                className="w-7 h-7"
                style={{ color: ELEGANZA.inkMuted }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className="text-base sm:text-lg font-bold leading-snug truncate"
                style={{ color: ELEGANZA.ink }}
              >
                {serviceName}
              </h3>
              {businessName && (
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  {businessName}
                </p>
              )}
            </div>
            <span
              className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
              style={{ backgroundColor: sStyle.bg, color: sStyle.color }}
            >
              {statusLabel}
            </span>
          </div>

          {providerName && (
            <div className="flex items-center gap-2 mt-2.5">
              <div
                className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: ELEGANZA.surfaceMuted }}
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
                      style={{ color: ELEGANZA.inkMuted }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs" style={{ color: ELEGANZA.inkMuted }}>
                with <span className="font-semibold">{providerName}</span>
              </span>
            </div>
          )}

          {/* Meta: date · time · price */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: ELEGANZA.inkMuted }}
            >
              <Calendar
                className="w-3.5 h-3.5"
                style={{ color: ELEGANZA.accent }}
              />
              <span>{formatDate(booking.bookingTime?.start)}</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: ELEGANZA.inkMuted }}
            >
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: ELEGANZA.accent }}
              />
              <span>
                {formatTime(booking.bookingTime?.start)}
                {duration ? ` · ${duration}` : ""}
              </span>
            </div>
            {price > 0 && (
              <div
                className="text-sm font-bold ml-auto"
                style={{ color: ELEGANZA.ink }}
              >
                ${price.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Review block: stars + actions on one row, comment below ── */}
      {!isUpcoming && review && (
        <div
          className="mt-5 pt-4"
          style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    style={{
                      color:
                        i <= review.rating ? ELEGANZA.accent : ELEGANZA.border,
                      fill:
                        i <= review.rating ? ELEGANZA.accent : "transparent",
                    }}
                  />
                ))}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: ELEGANZA.inkMuted }}
              >
                Your review
              </span>
            </div>

            {canEditReview && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditReview(booking)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] border transition-colors"
                  style={{
                    borderColor: ELEGANZA.border,
                    color: ELEGANZA.ink,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      ELEGANZA.surfaceMuted)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Star className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onDeleteReview(booking)}
                  disabled={deletingReview}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "rgba(185, 28, 28, 0.35)",
                    color: "#B91C1C",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!deletingReview)
                      e.currentTarget.style.backgroundColor =
                        "rgba(185, 28, 28, 0.08)";
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingReview ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
          {review.comment && (
            <p
              className="mt-2.5 text-sm italic line-clamp-3"
              style={{ color: ELEGANZA.ink }}
            >
              &ldquo;{review.comment}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* ── Footer action bar: leave-review / cancel ── */}
      {!isUpcoming && canReview && (
        <div
          className="mt-5 pt-4 flex items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
        >
          <span className="text-xs" style={{ color: ELEGANZA.inkMuted }}>
            How was your experience?
          </span>
          <button
            onClick={() => onCreateReview(booking)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-[0.15em] transition-colors"
            style={{ backgroundColor: ELEGANZA.cta, color: "white" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
            }
          >
            <Star className="w-3.5 h-3.5" />
            Leave Review
          </button>
        </div>
      )}

      {isUpcoming && (
        <div
          className="mt-5 pt-4 flex items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
        >
          <span className="text-xs" style={{ color: ELEGANZA.inkMuted }}>
            Need to make a change?
          </span>
          <button
            onClick={() => onCancel(booking)}
            disabled={canceling}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-[0.15em] border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              borderColor: "rgba(185, 28, 28, 0.35)",
              color: "#B91C1C",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!canceling)
                e.currentTarget.style.backgroundColor =
                  "rgba(185, 28, 28, 0.08)";
            }}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <X className="w-3.5 h-3.5" />
            {canceling ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
