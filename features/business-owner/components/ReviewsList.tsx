"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  MessageSquare,
  Star,
  StarHalf,
} from "lucide-react";
import {
  COL,
  DataTable,
  type DataTableColumn,
  DataTableEmptyState,
  DataTableFooter,
  Dropdown,
  FilterBar,
  SearchInput,
} from "@/components/ui";
import { Review } from "@/types";
import { cn } from "@/utils";
import {
  useGetReviews,
  useGetReviewSummary,
  useBusinessServices,
  useServiceProviders,
} from "../hooks";

interface ReviewsListProps {
  businessId: string;
}

type ClientSortKey = "service" | "provider" | null;
type ApiSortKey = "createdAt" | "rating";

const RATING_OPTIONS: Array<{ value: "" | 1 | 2 | 3 | 4 | 5; label: string }> = [
  { value: "", label: "All ratings" },
  { value: 5, label: "5 stars" },
  { value: 4, label: "4 stars" },
  { value: 3, label: "3 stars" },
  { value: 2, label: "2 stars" },
  { value: 1, label: "1 star" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function shortDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
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

function userFullName(review: Review): string {
  if (!review.user) return "Unknown customer";
  return `${review.user.firstName} ${review.user.lastName ?? ""}`.trim();
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const half = !filled && i + 0.5 <= rating;
        return filled ? (
          <Star
            key={i}
            className={cn(iconClass, "fill-amber-400 text-amber-400")}
          />
        ) : half ? (
          <StarHalf
            key={i}
            className={cn(iconClass, "fill-amber-400 text-amber-400")}
          />
        ) : (
          <Star key={i} className={cn(iconClass, "text-border-subtle")} />
        );
      })}
    </div>
  );
}

function RatingSummaryCard({
  average,
  total,
  distribution,
  isLoading,
}: {
  average: number;
  total: number;
  distribution: Record<string, number>;
  isLoading?: boolean;
}) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-6">
        <div className="h-8 w-32 shimmer rounded-md mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 shimmer rounded-md w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
        <div className="shrink-0">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Average rating
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-text-primary tabular tracking-tight">
              {total > 0 ? average.toFixed(1) : "—"}
            </span>
            {total > 0 && <StarRating rating={average} size="md" />}
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Based on {total} review{total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const count = distribution[String(stars)] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-text-tertiary tabular shrink-0">{stars}★</span>
                <div className="flex-1 h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-text-tertiary tabular shrink-0">
                  {count}
                </span>
                <span className="w-9 text-right text-text-quaternary tabular shrink-0 hidden sm:inline">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ businessId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"" | 1 | 2 | 3 | 4 | 5>("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [apiSortBy, setApiSortBy] = useState<ApiSortKey>("createdAt");
  const [apiSortOrder, setApiSortOrder] = useState<"asc" | "desc">("desc");
  const [clientSortKey, setClientSortKey] = useState<ClientSortKey>(null);
  const [clientSortOrder, setClientSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasClientFilters = !!(
    searchTerm.trim() ||
    serviceFilter ||
    providerFilter ||
    selectedDate
  );

  const reviewParams = useMemo(
    () => ({
      page: hasClientFilters ? 1 : currentPage,
      limit: hasClientFilters ? 100 : pageSize,
      sortBy: clientSortKey ? undefined : apiSortBy,
      sortOrder: clientSortKey ? undefined : apiSortOrder,
      rating: ratingFilter || undefined,
    }),
    [
      hasClientFilters,
      currentPage,
      pageSize,
      apiSortBy,
      apiSortOrder,
      ratingFilter,
      clientSortKey,
    ],
  );

  const { reviews, meta, isLoading } = useGetReviews(businessId, reviewParams);
  const { summary, isLoading: summaryLoading } = useGetReviewSummary(businessId);
  const { services } = useBusinessServices(businessId, { limit: 100 });
  const { providers } = useServiceProviders(businessId, { limit: 100 });

  const providerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of providers) {
      const name =
        `${p.firstName ?? p.user?.firstName ?? ""} ${p.lastName ?? p.user?.lastName ?? ""}`.trim();
      if (name) map.set(p.id, name);
    }
    return map;
  }, [providers]);

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

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = reviews.filter((review) => {
      if (term) {
        const name = userFullName(review).toLowerCase();
        if (!name.includes(term)) return false;
      }
      if (serviceFilter && review.booking?.serviceId !== serviceFilter) return false;
      if (providerFilter && review.booking?.serviceProviderId !== providerFilter) {
        return false;
      }
      if (selectedDate && !matchesSelectedDate(review.createdAt)) return false;
      return true;
    });

    if (clientSortKey === "service") {
      result = [...result].sort((a, b) => {
        const aName = a.booking?.service?.name ?? "";
        const bName = b.booking?.service?.name ?? "";
        const cmp = aName.localeCompare(bName);
        return clientSortOrder === "asc" ? cmp : -cmp;
      });
    } else if (clientSortKey === "provider") {
      result = [...result].sort((a, b) => {
        const aId = a.booking?.serviceProviderId ?? "";
        const bId = b.booking?.serviceProviderId ?? "";
        const aName = providerNameById.get(aId) ?? aId;
        const bName = providerNameById.get(bId) ?? bId;
        const cmp = aName.localeCompare(bName);
        return clientSortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [
    reviews,
    searchTerm,
    serviceFilter,
    providerFilter,
    selectedDate,
    matchesSelectedDate,
    clientSortKey,
    clientSortOrder,
    providerNameById,
  ]);

  const expandedReview = useMemo(
    () => filteredReviews.find((r) => r.id === expandedId),
    [filteredReviews, expandedId],
  );

  useEffect(() => {
    if (expandedId && !expandedReview) setExpandedId(null);
  }, [expandedId, expandedReview]);

  const paginatedReviews = useMemo(() => {
    if (!hasClientFilters) return filteredReviews;
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, hasClientFilters, currentPage, pageSize]);

  const totalEntries = hasClientFilters
    ? filteredReviews.length
    : meta?.total ?? filteredReviews.length;
  const totalPages = hasClientFilters
    ? Math.max(1, Math.ceil(filteredReviews.length / pageSize))
    : meta?.totalPages ?? Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const start = paginatedReviews.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = hasClientFilters
    ? Math.min(safePage * pageSize, filteredReviews.length)
    : Math.min(safePage * pageSize, totalEntries);

  const toggleApiSort = (key: ApiSortKey) => {
    setClientSortKey(null);
    if (apiSortBy === key) {
      setApiSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setApiSortBy(key);
      setApiSortOrder(key === "createdAt" ? "desc" : "desc");
    }
    setCurrentPage(1);
  };

  const toggleClientSort = (key: ClientSortKey) => {
    if (!key) return;
    setApiSortBy("createdAt");
    if (clientSortKey === key) {
      setClientSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setClientSortKey(key);
      setClientSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setRatingFilter("");
    setServiceFilter("");
    setProviderFilter("");
    setSelectedDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    searchTerm.trim() ||
    ratingFilter ||
    serviceFilter ||
    providerFilter ||
    selectedDate
  );

  const selectedRatingLabel =
    RATING_OPTIONS.find((o) => o.value === ratingFilter)?.label ?? "All ratings";
  const selectedServiceLabel =
    services.find((s) => s.id === serviceFilter)?.name ?? "All services";
  const selectedProviderLabel =
    providerNameById.get(providerFilter) ?? "All providers";

  const columns: DataTableColumn<Review>[] = [
    {
      key: "customer",
      header: "Customer",
      width: COL.person,
      truncate: true,
      cell: (r) => {
        const name = userFullName(r);
        const initials = name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[10px] font-semibold shrink-0">
              {initials || "?"}
            </span>
            <span className="text-sm font-semibold text-text-primary truncate" title={name}>
              {name}
            </span>
          </div>
        );
      },
    },
    {
      key: "rating",
      header: "Rating",
      width: COL.short,
      sortable: true,
      sortDirection: clientSortKey ? null : apiSortBy === "rating" ? apiSortOrder : null,
      onSort: () => toggleApiSort("rating"),
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <StarRating rating={r.rating} />
          <span className="text-xs font-semibold text-text-secondary tabular">{r.rating}</span>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      width: COL.short,
      truncate: true,
      sortable: true,
      sortDirection: clientSortKey === "service" ? clientSortOrder : null,
      onSort: () => toggleClientSort("service"),
      cell: (r) =>
        r.booking?.service?.name ? (
          <span
            className="text-sm text-text-secondary block truncate"
            title={r.booking.service.name}
          >
            {r.booking.service.name}
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
      sortable: true,
      sortDirection: clientSortKey === "provider" ? clientSortOrder : null,
      onSort: () => toggleClientSort("provider"),
      cell: (r) => {
        const providerId = r.booking?.serviceProviderId;
        const name = providerId ? providerNameById.get(providerId) : undefined;
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
      key: "date",
      header: "Date",
      width: COL.date,
      sortable: true,
      sortDirection: clientSortKey ? null : apiSortBy === "createdAt" ? apiSortOrder : null,
      onSort: () => toggleApiSort("createdAt"),
      cell: (r) => (
        <div title={fullDateTime(r.createdAt)}>
          <p className="text-sm font-semibold text-text-primary tabular">
            {shortDate(r.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "comment",
      header: "Comment",
      truncate: true,
      cell: (r) =>
        r.comment ? (
          <span className="text-sm text-text-tertiary block truncate" title={r.comment}>
            {r.comment}
          </span>
        ) : (
          <span className="text-xs text-text-quaternary italic">No comment</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <RatingSummaryCard
        average={summary?.average ?? 0}
        total={summary?.total ?? 0}
        distribution={summary?.distribution ?? { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }}
        isLoading={summaryLoading}
      />

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
            placeholder="Search by customer name"
          />
        }
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAllFilters}
        chips={
          hasActiveFilters ? (
            <>
              {ratingFilter && (
                <span className="text-xs text-text-tertiary">
                  {selectedRatingLabel}
                </span>
              )}
            </>
          ) : undefined
        }
        trailing={
          <>
            <Dropdown>
              <Dropdown.Trigger>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-surface border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-subtle/70 transition-colors"
                >
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-medium">{selectedRatingLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Menu align="right" className="min-w-[160px]">
                {RATING_OPTIONS.map((opt) => (
                  <Dropdown.Item
                    key={opt.value || "all"}
                    onClick={() => {
                      setRatingFilter(opt.value);
                      setCurrentPage(1);
                    }}
                    selected={ratingFilter === opt.value}
                  >
                    {opt.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Trigger>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-surface border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-subtle/70 transition-colors max-w-[180px]"
                >
                  <span className="text-text-tertiary shrink-0">Service:</span>
                  <span className="font-medium truncate">{selectedServiceLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Menu align="right" className="min-w-[200px] max-h-64 overflow-y-auto">
                <Dropdown.Item
                  onClick={() => {
                    setServiceFilter("");
                    setCurrentPage(1);
                  }}
                  selected={!serviceFilter}
                >
                  All services
                </Dropdown.Item>
                <Dropdown.Divider />
                {services.map((s) => (
                  <Dropdown.Item
                    key={s.id}
                    onClick={() => {
                      setServiceFilter(s.id);
                      setCurrentPage(1);
                    }}
                    selected={serviceFilter === s.id}
                  >
                    {s.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Trigger>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-surface border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-subtle/70 transition-colors max-w-[180px]"
                >
                  <span className="text-text-tertiary shrink-0">Provider:</span>
                  <span className="font-medium truncate">{selectedProviderLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Menu align="right" className="min-w-[200px] max-h-64 overflow-y-auto">
                <Dropdown.Item
                  onClick={() => {
                    setProviderFilter("");
                    setCurrentPage(1);
                  }}
                  selected={!providerFilter}
                >
                  All providers
                </Dropdown.Item>
                <Dropdown.Divider />
                {providers.map((p) => {
                  const name =
                    `${p.firstName ?? p.user?.firstName ?? ""} ${p.lastName ?? p.user?.lastName ?? ""}`.trim() ||
                    p.id;
                  return (
                    <Dropdown.Item
                      key={p.id}
                      onClick={() => {
                        setProviderFilter(p.id);
                        setCurrentPage(1);
                      }}
                      selected={providerFilter === p.id}
                    >
                      {name}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>

            <label
              className={cn(
                "inline-flex items-center gap-2 h-10 rounded-lg bg-surface border border-border-subtle px-3 text-sm cursor-pointer transition-colors",
                selectedDate ? "text-text-primary" : "text-text-secondary hover:bg-subtle/70",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="font-medium whitespace-nowrap">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Filter by date"}
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

      {hasClientFilters && reviews.length >= 100 && (
        <p className="text-xs text-text-tertiary px-1">
          Showing results from the most recent 100 reviews. Additional API filters may be needed for
          larger datasets.
        </p>
      )}

      <DataTable
        columns={columns}
        data={paginatedReviews}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        loadingRows={pageSize > 6 ? 6 : pageSize}
        onRowClick={(r) => setExpandedId((id) => (id === r.id ? null : r.id))}
        rowClassName={(r) => (expandedId === r.id ? "bg-subtle/40" : undefined)}
        emptyState={
          <DataTableEmptyState
            icon={<MessageSquare />}
            title="No reviews yet"
            description={
              hasActiveFilters
                ? "Try adjusting your filters."
                : "Reviews appear here after customers rate completed bookings."
            }
          />
        }
      />

      {expandedReview && (
        <ReviewDetailPanel
          review={expandedReview}
          providerName={
            providerNameById.get(expandedReview.booking?.serviceProviderId ?? "") ?? undefined
          }
          onClose={() => setExpandedId(null)}
        />
      )}

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
    </div>
  );
};

function ReviewDetailPanel({
  review,
  providerName,
  onClose,
}: {
  review: Review | undefined;
  providerName?: string;
  onClose: () => void;
}) {
  if (!review) return null;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Review details
          </p>
          <h3 className="text-lg font-semibold text-text-primary mt-1">{userFullName(review)}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
            <StarRating rating={review.rating} size="md" />
            <span className="text-text-quaternary">·</span>
            <span>{fullDateTime(review.createdAt)}</span>
            {review.booking?.service?.name && (
              <>
                <span className="text-text-quaternary">·</span>
                <span>{review.booking.service.name}</span>
              </>
            )}
            {providerName && (
              <>
                <span className="text-text-quaternary">·</span>
                <span>{providerName}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-text-tertiary hover:text-text-primary transition-colors shrink-0"
        >
          Close
        </button>
      </div>
      {review.comment ? (
        <p className="mt-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {review.comment}
        </p>
      ) : (
        <p className="mt-4 text-sm text-text-quaternary italic">No written comment provided.</p>
      )}
    </div>
  );
}
