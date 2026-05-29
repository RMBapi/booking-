"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils";

/**
 * Canonical column-width tokens. Use these instead of arbitrary px values so
 * tables stay visually consistent across the app.
 *
 * Numeric values (e.g. 140) are fixed widths in px. String values are valid
 * CSS for the <col> width attribute — we use min-content padding so flexible
 * columns share remaining horizontal space.
 */
export const COL = {
  /** Checkbox / select column. */
  checkbox: 44,
  /** Avatar + name (primary identity). Min 220px. */
  person: 220,
  /** Email — truncates with ellipsis, full email in title attribute. Min 200px. */
  email: 200,
  /** Short text (role, type, status text). Min 120px. */
  short: 120,
  /** Date / time. Tabular-nums. */
  date: 140,
  /** Numeric / money. Right-aligned, tabular-nums. Min 100px. */
  numeric: 100,
  /** Status pill column. */
  status: 120,
  /** Single overflow-menu (no inline buttons). Right-aligned, last column. */
  action: 56,
} as const;

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  /**
   * Column width. A number is treated as a fixed px width (preferred for
   * status / date / action columns). A string is passed through (e.g. "auto"
   * for the column that should soak up remaining space — use exactly one).
   * Use the COL tokens for consistency.
   */
  width?: string | number;
  className?: string;
  headerClassName?: string;
  /** Truncate cell content with ellipsis. Default: false. */
  truncate?: boolean;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
};

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => React.Key;
  isLoading?: boolean;
  loadingRows?: number;
  onRowClick?: (row: T, index: number) => void;
  isSelected?: (row: T, index: number) => boolean;
  emptyState?: React.ReactNode;
  className?: string;
  rowClassName?: (row: T, index: number) => string | undefined;
  stickyHeader?: boolean;
  /** Wraps the table in a hairline-bordered card. Default: true. */
  card?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  loadingRows = 5,
  onRowClick,
  isSelected,
  emptyState,
  className,
  rowClassName,
  stickyHeader,
  card = true,
}: DataTableProps<T>) {
  const wrapperClass = card
    ? "rounded-2xl border border-border-subtle bg-surface overflow-hidden"
    : "";

  const tableEl = (
    <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
      <colgroup>
        {columns.map((col) => {
          const width =
            typeof col.width === "number" ? `${col.width}px` : col.width;
          return <col key={col.key} style={{ width }} />;
        })}
      </colgroup>
      <thead>
        <tr className="border-b border-border-subtle">
          {columns.map((col, i) => (
            <th
              key={col.key}
              scope="col"
              className={cn(
                "py-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary",
                "select-none",
                col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                i === 0 ? "pl-6" : "pl-4",
                i === columns.length - 1 ? "pr-6" : "pr-4",
                stickyHeader && "sticky top-0 bg-surface/95 backdrop-blur z-10",
                col.headerClassName,
              )}
            >
              {col.sortable ? (
                <button
                  type="button"
                  onClick={col.onSort}
                  className="group inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  {col.header}
                  <SortIndicator direction={col.sortDirection} />
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isLoading
          ? Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-border-subtle last:border-b-0">
                {columns.map((col, j) => (
                  <td
                    key={col.key}
                    className={cn(
                      "py-4",
                      j === 0 ? "pl-6" : "pl-4",
                      j === columns.length - 1 ? "pr-6" : "pr-4",
                    )}
                  >
                    <span className="block h-3 rounded-md shimmer w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          : data.length === 0
          ? null
          : data.map((row, idx) => {
              const selected = isSelected?.(row, idx);
              const handleRow = onRowClick ? () => onRowClick(row, idx) : undefined;
              return (
                <tr
                  key={rowKey(row, idx)}
                  onClick={handleRow}
                  className={cn(
                    "group relative border-b border-border-subtle last:border-b-0 transition-colors",
                    "hover:bg-subtle/60",
                    selected && "bg-primary-50/50",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row, idx),
                  )}
                >
                  {columns.map((col, j) => (
                    <td
                      key={col.key}
                      className={cn(
                        "py-3.5 align-middle min-h-[52px]",
                        col.truncate && "truncate",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        j === 0 ? "pl-6" : "pl-4",
                        j === columns.length - 1 ? "pr-6" : "pr-4",
                        col.className,
                      )}
                    >
                      {/* Hover bar — sits in first cell for full-row affordance */}
                      {j === 0 && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-[2px] transition-opacity",
                            selected
                              ? "bg-gradient-to-b from-primary-500 to-indigo-500 opacity-100"
                              : "bg-primary-500 opacity-0 group-hover:opacity-100",
                          )}
                        />
                      )}
                      {col.cell(row, idx)}
                    </td>
                  ))}
                </tr>
              );
            })}
      </tbody>
    </table>
  );

  if (data.length === 0 && !isLoading && emptyState) {
    return (
      <div className={cn(wrapperClass, className)}>
        <div className="px-6 py-14">{emptyState}</div>
      </div>
    );
  }

  // The horizontal scroll wrapper sits OUTSIDE the bordered card so the
  // border-radius on the card stays clean even on narrow viewports.
  return (
    <div className={cn(wrapperClass, className)}>
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px]">{tableEl}</div>
      </div>
    </div>
  );
}

function SortIndicator({ direction }: { direction?: "asc" | "desc" | null }) {
  if (direction === "asc") {
    return <ChevronUp className="h-3 w-3 text-primary-600" />;
  }
  if (direction === "desc") {
    return <ChevronDown className="h-3 w-3 text-primary-600" />;
  }
  return (
    <ChevronDown className="h-3 w-3 text-text-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
  );
}

/* ───────────── Helpers used by callers ───────────── */

export function DataTableEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      {icon && (
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-border-subtle flex items-center justify-center mb-4 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-text-tertiary mt-1.5 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* Two-line cell pattern: avatar + name + secondary line. */
export function PersonCell({
  avatar,
  name,
  secondary,
}: {
  avatar?: React.ReactNode;
  name: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {avatar && <span className="shrink-0">{avatar}</span>}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
        {secondary && <p className="text-xs text-text-tertiary truncate">{secondary}</p>}
      </div>
    </div>
  );
}

/* Pagination footer — sits OUTSIDE the table card on transparent background. */
export interface DataTableFooterProps {
  total: number;
  start: number;
  end: number;
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (n: number) => void;
}

export function DataTableFooter({
  total,
  start,
  end,
  page,
  pageCount,
  onPrev,
  onNext,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
}: DataTableFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 pt-3 text-sm text-text-tertiary">
      <p className="tabular">
        Showing <span className="font-semibold text-text-secondary">{start}</span>–
        <span className="font-semibold text-text-secondary">{end}</span> of{" "}
        <span className="font-semibold text-text-secondary">{total}</span>
      </p>
      <div className="flex items-center gap-3">
        {pageSize !== undefined && onPageSizeChange && (
          <label className="inline-flex items-center gap-2 text-xs">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="h-8 rounded-md bg-surface border border-border-subtle text-xs px-2 text-text-secondary focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 tabular"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="tabular text-xs">
          Page <span className="text-text-secondary font-semibold">{page}</span> / {pageCount}
        </span>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={page <= 1}
            className="h-8 px-3 rounded-md text-xs font-medium text-text-secondary bg-surface border border-border-subtle hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= pageCount}
            className="h-8 px-3 rounded-md text-xs font-medium text-text-secondary bg-surface border border-border-subtle hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
