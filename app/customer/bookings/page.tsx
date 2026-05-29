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
  User as UserIcon,
  X,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader, SmartImage } from "@/components";
import { CustomerSiteNavigation } from "@/components/navigation";
import { ELEGANZA, getImageUrl } from "@/lib/publicBrand";
import {
  cancelBooking,
  getMyBookings,
  getPublicServicesByBusinessSlug,
  submitReview,
  updateReview,
} from "@/services";
import { Booking, BookingStatus, Service } from "@/types";
import {
  formatPrice,
  resolveServicePriceVisibility,
} from "@/features/booking/utils";
import { readSiteCache } from "@/lib/publicCache";
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
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [serviceCatalogById, setServiceCatalogById] = useState<
    Record<string, Pick<Service, "priceDisplayMode" | "image">>
  >({});

  useEffect(() => {
    if (authLoading) return;
    if (token) return;

    const returnUrl = encodeURIComponent("/customer/bookings");
    router.replace(`/auth/login/customer?returnUrl=${returnUrl}`);
  }, [authLoading, token, router]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyBookings();
      const list = unwrapBookings(res?.data);
      setBookings(list);
    } catch (err) {
      toast.error("Failed to load bookings. Please try again.");
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
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG || null;
  const resolvedSlug = businessSlug || envSlug;

  const buildCatalog = useCallback((list: Service[]) => {
    const catalog: Record<string, Pick<Service, "priceDisplayMode" | "image">> =
      {};
    list.forEach((service) => {
      if (service?.id) {
        catalog[service.id] = {
          priceDisplayMode: service.priceDisplayMode,
          image: service.image,
        };
      }
    });
    return catalog;
  }, []);

  const fetchServiceCatalog = useCallback(async () => {
    if (!resolvedSlug) return;
    try {
      const res = await getPublicServicesByBusinessSlug(resolvedSlug);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      setServiceCatalogById(buildCatalog(list));
    } catch {
      // Ignore catalog hydration failures; bookings still render.
    }
  }, [resolvedSlug, buildCatalog]);

  useEffect(() => {
    if (!resolvedSlug) return;
    // Hydrate instantly from the shared cache (set by the public site / navbar)
    // so prices and thumbnails render without waiting on a fetch.
    const cached = readSiteCache(resolvedSlug);
    if (cached?.services?.length) {
      setServiceCatalogById(buildCatalog(cached.services));
    }
    fetchServiceCatalog();
  }, [resolvedSlug, fetchServiceCatalog, buildCatalog]);

  const handleBrowseServices = () => {
    if (resolvedSlug) router.push(`/business/slug/${resolvedSlug}#services-section`);
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
      console.error(err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => statusToFilter(b.status) === "upcoming").length;
    const completed = bookings.filter((b) => statusToFilter(b.status) === "completed").length;
    let totalSpent = 0;
    let hasVisiblePrices = false;

    bookings
      .filter((b) => statusToFilter(b.status) === "completed")
      .forEach((b) => {
        if (
          resolveServicePriceVisibility(b.serviceId, b.service, serviceCatalogById)
        ) {
          hasVisiblePrices = true;
          totalSpent += priceNumber(b.service?.price);
        }
      });

    return { upcoming, completed, totalSpent, hasVisiblePrices };
  }, [bookings, serviceCatalogById]);

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
  if (!token) return <PageLoader />;
  if (!user) return <PageLoader />;

  return (
    <div
      className="min-h-screen text-[#222222]"
      style={{ backgroundColor: ELEGANZA.background }}
    >
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
                ...(stats.hasVisiblePrices
                  ? [
                      {
                        icon: Receipt,
                        label: "Total Spent",
                        value: formatPrice(stats.totalSpent),
                      },
                    ]
                  : []),
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
                    <s.icon className="w-5 h-5" style={{ color: ELEGANZA.ink }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: ELEGANZA.inkMuted }}
                    >
                      {s.label}
                    </p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: ELEGANZA.ink }}>
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
          className="sticky top-16 z-30 border-b"
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
                <h3 className="text-xl font-bold mb-2" style={{ color: ELEGANZA.ink }}>
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
                      (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)
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
                    onCancel={openCancelModal}
                    onCreateReview={openCreateReview}
                    onEditReview={openEditReview}
                    serviceCatalogById={serviceCatalogById}
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
  serviceCatalogById: Record<string, Pick<Service, "priceDisplayMode" | "image">>;
  onCancel: (b: Booking) => void;
  onCreateReview: (b: Booking) => void;
  onEditReview: (b: Booking) => void;
}

function BookingRow({
  booking,
  index,
  canceling,
  serviceCatalogById,
  onCancel,
  onCreateReview,
  onEditReview,
}: BookingRowProps) {
  const bucket = statusToFilter(booking.status);
  const serviceName = booking.service?.name ?? "Service";
  const providerName = providerFullName(booking);
  const duration = computeDuration(booking.bookingTime?.start, booking.bookingTime?.end);
  const showPrice = resolveServicePriceVisibility(
    booking.serviceId,
    booking.service,
    serviceCatalogById,
  );
  const priceLabel = showPrice ? formatPrice(booking.service?.price) : null;
  const businessName = booking.business?.name;

  // Thumbnails
  const bookingService = booking.service as { imageUrl?: string } | undefined;
  const thumbnailUrl =
    getImageUrl(booking.service?.image) ||
    getImageUrl(bookingService?.imageUrl) ||
    getImageUrl(serviceCatalogById[booking.serviceId]?.image) ||
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
      className="rounded-lg p-5 transition-all"
      style={{
        backgroundColor: ELEGANZA.surface,
        border: `1px solid ${ELEGANZA.border}`,
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
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        >
          {thumbnailUrl ? (
            <SmartImage
              src={thumbnailUrl}
              alt={serviceName}
              className="w-full h-full"
              placeholderColor={ELEGANZA.surfaceMuted}
              videoPlayback="autoplay"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar
                className="w-8 h-8"
                style={{ color: ELEGANZA.inkMuted }}
              />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate" style={{ color: ELEGANZA.ink }}>
            {serviceName}
          </h3>

          {providerName && (
            <div className="flex items-center gap-2 mt-1.5">
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
              <span
                className="text-xs"
                style={{ color: ELEGANZA.inkMuted }}
              >
                with <span className="font-semibold">{providerName}</span>
              </span>
            </div>
          )}
          {businessName && (
            <p
              className="text-[11px] mt-1"
              style={{ color: ELEGANZA.inkMuted }}
            >
              {businessName}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: ELEGANZA.inkMuted }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: ELEGANZA.accent }} />
              <span>{formatDate(booking.bookingTime?.start)}</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: ELEGANZA.inkMuted }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: ELEGANZA.accent }} />
              <span>
                {formatTime(booking.bookingTime?.start)}
                {duration ? ` · ${duration}` : ""}
              </span>
            </div>
            {priceLabel && (
              <div className="text-sm font-bold" style={{ color: ELEGANZA.ink }}>
                {priceLabel}
              </div>
            )}
          </div>

          {/* Existing review display */}
          {review && (
            <div
              className="mt-4 pt-3"
              style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      style={{
                        color: i <= review.rating ? ELEGANZA.accent : ELEGANZA.border,
                        fill: i <= review.rating ? ELEGANZA.accent : "transparent",
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
              {review.comment && (
                <p
                  className="mt-2 text-xs italic line-clamp-2"
                  style={{ color: ELEGANZA.ink }}
                >
                  &ldquo;{review.comment}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom-right actions — cancel for upcoming, review for completed */}
      {isUpcoming && (
        <div
          className="mt-5 pt-4 flex justify-end"
          style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
        >
          <button
            onClick={() => onCancel(booking)}
            disabled={canceling}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded text-xs font-semibold uppercase tracking-[0.2em] border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              borderColor: "rgba(185, 28, 28, 0.4)",
              color: "#B91C1C",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!canceling)
                e.currentTarget.style.backgroundColor = "rgba(185, 28, 28, 0.08)";
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

      {!isUpcoming && canReview && (
        <div
          className="mt-5 pt-4 flex justify-end"
          style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
        >
          <button
            onClick={() => onCreateReview(booking)}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            style={{ backgroundColor: ELEGANZA.cta, color: "white" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
            }
          >
            <Star className="w-3.5 h-3.5" />
            Review
          </button>
        </div>
      )}

      {!isUpcoming && canEditReview && (
        <div
          className="mt-5 pt-4 flex justify-end"
          style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
        >
          <button
            onClick={() => onEditReview(booking)}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded text-xs font-semibold uppercase tracking-[0.2em] border transition-colors"
            style={{
              borderColor: ELEGANZA.border,
              color: ELEGANZA.ink,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ELEGANZA.ink;
              e.currentTarget.style.borderColor = ELEGANZA.ink;
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = ELEGANZA.border;
              e.currentTarget.style.color = ELEGANZA.ink;
            }}
          >
            <Star className="w-3.5 h-3.5" />
            Edit Review
          </button>
        </div>
      )}
    </motion.div>
  );
}
