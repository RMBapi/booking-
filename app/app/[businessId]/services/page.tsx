"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Plus,
  ChevronDown,
  Pencil,
  Users,
  CalendarDays,
  Trash2,
  PackageOpen,
} from "lucide-react";
import { currencyFormat } from "@/utils";
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
import {
  ActionMenu,
  COL,
  DataTable,
  type DataTableColumn,
  DataTableEmptyState,
  DataTableFooter,
  Dropdown,
  FilterBar,
  SearchInput,
  StatusPill,
} from "@/components/ui";

const ITEMS_PER_PAGE = 10;
type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";
const DAY_KEYS = new Set<DayKey>([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Archived", value: "Archived" },
] as const;

function statusToneFor(status: Service["status"]): "success" | "warning" | "muted" {
  if (status === "Active") return "success";
  if (status === "Inactive") return "warning";
  return "muted";
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
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

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

  const handleEditClick = (service: Service) => {
    setServiceToEdit(service);
    setIsEditServiceOpen(true);
  };

  const handleEditClose = () => {
    setIsEditServiceOpen(false);
    setServiceToEdit(null);
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
        const rawDayKey = schedule.day.toLowerCase();
        if (!DAY_KEYS.has(rawDayKey as DayKey)) {
          return;
        }

        const dayKey = rawDayKey as DayKey;
        if (!schedule.isActive) {
          config[dayKey] = { isOff: true };
          return;
        }

        config[dayKey] = {
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

  const start = total === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, total);

  const columns: DataTableColumn<Service>[] = [
    {
      key: "name",
      header: "Service",
      width: COL.person,
      truncate: true,
      cell: (s) => (
        <span className="text-sm font-semibold text-text-primary block truncate" title={s.name}>
          {s.name}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      truncate: true,
      cell: (s) =>
        s.description ? (
          <span
            className="text-sm text-text-tertiary block truncate"
            title={s.description}
          >
            {s.description}
          </span>
        ) : (
          <span className="text-text-quaternary">—</span>
        ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      width: COL.numeric,
      cell: (s) => (
        <span className="text-sm font-semibold text-text-primary tabular">
          {currencyFormat(s.price)}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      width: COL.short,
      cell: (s) => (
        <StatusPill tone={s.priceDisplayMode ? "info" : "muted"} withDot={false}>
          {s.priceDisplayMode ? "Visible" : "Hidden"}
        </StatusPill>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: COL.status,
      cell: (s) => <StatusPill tone={statusToneFor(s.status)}>{s.status}</StatusPill>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: COL.action,
      cell: (s) => (
        <ActionMenu
          triggerLabel={`Actions for ${s.name}`}
          items={[
            {
              key: "edit",
              label: "Edit service",
              icon: <Pencil />,
              onClick: () => handleEditClick(s),
            },
            {
              key: "providers",
              label: "Manage providers",
              icon: <Users />,
              onClick: () => router.push(`/business-owner/${businessId}/services/${s.id}/providers`),
            },
            {
              key: "schedule",
              label: "Edit schedule",
              icon: <CalendarDays />,
              onClick: () => handleSchedulingClick(s),
            },
            {
              key: "delete",
              label: "Delete service",
              icon: <Trash2 />,
              danger: true,
              onClick: () => handleDelete(s.id),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8"
      >
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Catalog</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
            Services
          </h1>
          <p className="text-sm text-text-tertiary mt-1.5">
            Manage your business services and offerings.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-primary-500 to-indigo-500 text-white rounded-lg text-sm font-semibold hover:from-primary-600 hover:to-indigo-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all"
          onClick={() => setIsAddServiceOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add New Service
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <FilterBar
          search={
            <SearchInput
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange("")}
              placeholder="Search services by name"
            />
          }
          trailing={
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
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    selected={statusFilter === opt.value}
                  >
                    {opt.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          }
        />

        <DataTable
          columns={columns}
          data={services}
          rowKey={(s) => s.id}
          isLoading={isLoading}
          loadingRows={6}
          emptyState={
            <DataTableEmptyState
              icon={<PackageOpen />}
              title="No services found"
              description={
                search || statusFilter
                  ? "Try adjusting your filters or search query."
                  : "Get started by adding your first service."
              }
              action={
                !search && !statusFilter ? (
                  <button
                    type="button"
                    onClick={() => setIsAddServiceOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 hover:from-primary-600 hover:to-indigo-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    Add service
                  </button>
                ) : undefined
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
            pageCount={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </motion.div>

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        businessId={businessId}
      />

      <AddServiceModal
        isOpen={isEditServiceOpen}
        onClose={handleEditClose}
        businessId={businessId}
        service={serviceToEdit}
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
