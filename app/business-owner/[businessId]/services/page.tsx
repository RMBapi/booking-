"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Plus,
  Search,
  ChevronDown,
  Pencil,
  Users,
  CalendarDays,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
} from "lucide-react";
import { cn, currencyFormat } from "@/utils";
import {
  AddServiceModal,
  ServiceSchedulingModal,
  useBusinessServices,
} from "@/features/business-owner";
import { useApiResponse } from "@/hooks";
import {
  createScheduler,
  getScheduler,
  updateScheduler,
  type CanScheduleTime,
  type Scheduler,
} from "@/services";
import type { Service } from "@/types";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Archived", value: "Archived" },
] as const;

function StatusBadge({ status }: { status: Service["status"] }) {
  const isActive = status === "Active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide uppercase",
        isActive
          ? "bg-[#e8f0e4] text-[#4a6741]"
          : "bg-stone-100 text-stone-500",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isActive ? "bg-[#6b8f63] animate-pulse" : "bg-stone-400",
        )}
      />
      {status}
    </span>
  );
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tracking-wide uppercase",
        visible ? "bg-sky-50 text-sky-600" : "bg-stone-100 text-stone-400",
      )}
    >
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = "default",
}: ActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
      className={cn(
        "p-2 rounded-xl transition-colors",
        variant === "danger"
          ? "text-stone-400 hover:text-red-500 hover:bg-red-50"
          : "text-stone-400 hover:text-stone-700 hover:bg-stone-100",
      )}
    >
      {icon}
    </button>
  );
}

export default function BusinessServicesPage() {
  const params = useParams<{ businessId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { handleSuccess, handleError } = useApiResponse();
  const businessId = params.businessId;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { services, isLoading, meta, deleteService } = useBusinessServices(
    businessId,
    {
      page,
      limit: ITEMS_PER_PAGE,
      search: search || undefined,
      status: statusFilter || undefined,
    },
  );

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? services.length;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setShowDropdown(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      deleteService(id);
    }
  };

  const handleSchedulingClick = (service: Service) => {
    setSelectedService(service);
    setIsSchedulingModalOpen(true);
  };

  const handleSchedulingClose = () => {
    setIsSchedulingModalOpen(false);
    setSelectedService(null);
  };

  const schedulerQuery = useQuery<Scheduler | null>({
    queryKey: ["serviceScheduler", businessId, selectedService?.id],
    enabled: isSchedulingModalOpen && !!selectedService?.id,
    queryFn: async () => {
      if (!selectedService?.id) return null;
      try {
        const response = await getScheduler(businessId, selectedService.id);
        return response.data?.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const buildSchedulerPayload = useMemo(() => {
    return (data: {
      timeFormat: "12" | "24";
      interval: number;
      capacity: number;
      schedules: Array<{
        day: string;
        isActive: boolean;
        startTime: string;
        endTime: string;
        blockedFrames: Array<{ startTime: string; endTime: string }>;
      }>;
    }): CanScheduleTime => {
      const blockedTimes: Record<
        string,
        Array<{ startTime: string; endTime: string }>
      > = {};

      const config: CanScheduleTime = {
        timeFormat: data.timeFormat,
        timeSlotConfig: {
          intervalMinutes: data.interval,
          allowUserSelection: true,
          bookingsPerSlot: Math.max(1, data.capacity || 1),
        },
      };

      data.schedules.forEach((schedule) => {
        const dayKey = schedule.day.toLowerCase();
        if (!schedule.isActive) {
          config[dayKey as keyof CanScheduleTime] = { isOff: true };
          return;
        }

        config[dayKey as keyof CanScheduleTime] = {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isOff: false,
        };

        if (schedule.blockedFrames.length > 0) {
          blockedTimes[dayKey] = schedule.blockedFrames.map((frame) => ({
            startTime: frame.startTime,
            endTime: frame.endTime,
          }));
        }
      });

      if (Object.keys(blockedTimes).length > 0) {
        config.blockedTimes = blockedTimes;
      }

      return config;
    };
  }, []);

  const saveSchedulerMutation = useMutation({
    mutationFn: async (payload: CanScheduleTime) => {
      if (!selectedService?.id) {
        throw new Error("Service selection is required to save scheduling");
      }
      if (schedulerQuery.data?.id) {
        return updateScheduler(businessId, selectedService.id, {
          canScheduleTime: payload,
        });
      }
      return createScheduler(businessId, {
        serviceId: selectedService.id,
        canScheduleTime: payload,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["serviceScheduler", businessId, selectedService?.id],
      });
      handleSuccess(response);
      handleSchedulingClose();
    },
    onError: handleError,
  });

  const handleSchedulingSubmit = (data: {
    timeFormat: "12" | "24";
    interval: number;
    capacity: number;
    schedules: Array<{
      day: string;
      isActive: boolean;
      startTime: string;
      endTime: string;
      blockedFrames: Array<{ startTime: string; endTime: string }>;
    }>;
  }) => {
    const payload = buildSchedulerPayload(data);
    saveSchedulerMutation.mutate(payload);
  };

  const selectedStatusLabel =
    STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ??
    "All Statuses";

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <div className="px-4 md:px-8 py-8 md:py-12 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-stone-900">
              Services
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your business services and offerings
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
            onClick={() => setIsAddServiceOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-[48px] border border-stone-200 shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-600 hover:bg-stone-100 transition-colors"
              >
                {selectedStatusLabel}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showDropdown && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-20 bg-white border border-stone-200 rounded-2xl shadow-lg py-1.5 min-w-[160px]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(opt.value)}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm transition-colors",
                            statusFilter === opt.value
                              ? "bg-stone-100 text-stone-900 font-medium"
                              : "text-stone-600 hover:bg-stone-50",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full"
                />
              </div>
            ) : services.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                  <PackageOpen className="w-7 h-7 text-stone-400" />
                </div>
                <h3 className="text-base font-semibold text-stone-700 mb-1">
                  No services found
                </h3>
                <p className="text-sm text-stone-500 max-w-xs">
                  {search || statusFilter
                    ? "Try adjusting your filters or search query."
                    : "Get started by adding your first service."}
                </p>
              </motion.div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    {[
                      "Service Name",
                      "Description",
                      "Price",
                      "Visibility",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 md:px-8 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {services.map((service, idx) => (
                      <motion.tr
                        key={service.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors group"
                      >
                        <td className="px-6 md:px-8 py-4">
                          <span className="text-sm font-semibold text-stone-800">
                            {service.name}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4">
                          <span className="text-sm text-stone-500 line-clamp-1 max-w-[200px]">
                            {service.description || "—"}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4">
                          <span className="text-sm font-medium text-stone-700">
                            {currencyFormat(service.price)}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4">
                          <VisibilityBadge visible={service.priceDisplayMode} />
                        </td>
                        <td className="px-6 md:px-8 py-4">
                          <StatusBadge status={service.status} />
                        </td>
                        <td className="px-6 md:px-8 py-4">
                          <div className="flex items-center gap-1">
                            <ActionButton
                              icon={<Pencil className="w-4 h-4" />}
                              label="Edit"
                              onClick={() => {}}
                            />
                            <ActionButton
                              icon={<Users className="w-4 h-4" />}
                              label="Providers"
                              onClick={() =>
                                router.push(
                                  `/business-owner/${businessId}/services/${service.id}/providers`,
                                )
                              }
                            />
                            <ActionButton
                              icon={<CalendarDays className="w-4 h-4" />}
                              label="Calendar"
                              onClick={() => handleSchedulingClick(service)}
                            />
                            <ActionButton
                              icon={<Trash2 className="w-4 h-4" />}
                              label="Delete"
                              onClick={() => handleDelete(service.id)}
                              variant="danger"
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 md:px-8 py-5 border-t border-stone-100 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                Showing{" "}
                <span className="font-medium text-stone-700">
                  {(page - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="font-medium text-stone-700">
                  {Math.min(page * ITEMS_PER_PAGE, total)}
                </span>{" "}
                of <span className="font-medium text-stone-700">{total}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`dots-${idx}`}
                        className="px-2 text-sm text-stone-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={cn(
                          "w-9 h-9 rounded-xl text-sm font-medium transition-colors",
                          page === item
                            ? "bg-stone-900 text-white"
                            : "text-stone-600 hover:bg-stone-100",
                        )}
                      >
                        {item}
                      </button>
                    ),
                  )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        businessId={businessId}
      />

      <ServiceSchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={handleSchedulingClose}
        onSubmit={handleSchedulingSubmit}
        initialConfig={schedulerQuery.data?.canScheduleTime ?? null}
        isLoading={schedulerQuery.isLoading}
        isSubmitting={saveSchedulerMutation.isPending}
        serviceName={selectedService?.name}
      />
    </div>
  );
}
