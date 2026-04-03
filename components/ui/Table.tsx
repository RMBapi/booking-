import React from "react";
import { cn } from "@/utils";
import { SkeletonTable } from "./Skeleton";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  cell?: (row: T, index?: number) => React.ReactNode;
  className?: string;
  width?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  rowClassName?: (row: T, rowIndex: number) => string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
};

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  rowClassName,
  emptyMessage = "No data available",
  striped = false,
  hoverable = true,
}: TableProps<T>) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <SkeletonTable rows={5} columns={columns.length} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="text-center py-12 px-6">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  style={{ width: col.width }}
                  className={cn(
                    "px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "transition-colors duration-150",
                  hoverable && "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                  striped && rowIndex % 2 === 1 && "bg-gray-50/50 dark:bg-gray-800/50",
                  rowClassName?.(row, rowIndex)
                )}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {col.cell
                      ? col.cell(row, rowIndex)
                      : (row[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
