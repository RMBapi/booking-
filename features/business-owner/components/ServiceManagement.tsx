"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Modal } from "@/components";
import { useOpenModal } from "@/components/ui/Modal";
import { CanScheduleTime, Service, ServiceProvider } from "@/types";
import { useBusinessServices, ServiceFilters, useServiceProviders, useScheduler } from "../hooks";
import { SchedulerForm } from "./SchedulerForm";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  PencilLine,
  Plus,
  Save,
  Search,
  Trash2,
  Users2,
} from "lucide-react";

interface ServiceManagementProps {
  businessId: string | null;
}

const defaultFilters: ServiceFilters = {
  page: 1,
  limit: 10,
  search: "",
  status: undefined, // undefined = all statuses (parameter omitted)
  isActive: undefined,
};

export const ServiceManagement: React.FC<ServiceManagementProps> = ({
  businessId,
}) => {
  const [filters, setFilters] = useState<ServiceFilters>(defaultFilters);
  const formResetRef = useRef<(() => void) | null>(null);
  const prevIsCreatingRef = useRef(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedServiceForProviders, setSelectedServiceForProviders] = useState<Service | null>(null);
  const [selectedServiceForScheduler, setSelectedServiceForScheduler] = useState<Service | null>(null);

  const {
    services,
    meta,
    isLoading,
    createService,
    isCreating,
    updateService,
    isUpdating,
    deleteService,
    isDeleting,
  } = useBusinessServices(businessId, filters);

  // Reset form when creation succeeds (isCreating changes from true to false)
  useEffect(() => {
    if (prevIsCreatingRef.current && !isCreating) {
      // Creation completed successfully, reset form
      formResetRef.current?.();
    }
    prevIsCreatingRef.current = isCreating;
  }, [isCreating]);

  const handleToggleActive = (service: Service) => {
    updateService({
      id: service.id,
      data: { isActive: !service.isActive },
    });
  };

  const handleTogglePriceVisibility = (service: Service) => {
    updateService({
      id: service.id,
      data: { priceDisplayMode: !service.priceDisplayMode },
    });
  };

  const handleUpdateService = (data: {
    name: string;
    description?: string;
    price: number;
    status: "Active" | "Inactive" | "Archived";
    priceDisplayMode: boolean;
    isActive?: boolean;
  }) => {
    if (!editingService) return;
    
    updateService({
      id: editingService.id,
      data,
    });
    
    // Close modal after update
    setEditingService(null);
  };

  const handleDelete = (serviceId: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }
    deleteService(serviceId);
  };

  // Component that will be rendered inside Modal context
  const EditButtonWrapper: React.FC<{ service: Service; disabled?: boolean }> = ({ service, disabled }) => {
    const openEditModal = useOpenModal();
    
    return (
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-white hover:text-gray-700"
        onClick={() => {
          setEditingService(service);
          openEditModal("editService");
        }}
        disabled={disabled}
        title="Edit service"
      >
        <PencilLine className="h-4 w-4" />
      </button>
    );
  };

  // Component that will be rendered inside Modal context for managing providers
  const ManageProvidersButton: React.FC<{ service: Service }> = ({ service }) => {
    const openManageProvidersModal = useOpenModal();
    
    return (
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-white hover:text-gray-700"
        onClick={() => {
          setSelectedServiceForProviders(service);
          openManageProvidersModal("manageProviders");
        }}
        title="Manage providers"
      >
        <Users2 className="h-4 w-4" />
      </button>
    );
  };

  // Component that will be rendered inside Modal context for scheduler
  const SchedulerButton: React.FC<{ service: Service }> = ({ service }) => {
    const openSchedulerModal = useOpenModal();
    
    return (
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-white hover:text-gray-700"
        onClick={() => {
          setSelectedServiceForScheduler(service);
          openSchedulerModal("scheduler");
        }}
        title="Open scheduler"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    );
  };

  const currentPage = meta?.page ?? filters.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? services.length;
  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * (meta?.limit ?? filters.limit ?? 10) + 1;
  const toItem = Math.min(currentPage * (meta?.limit ?? filters.limit ?? 10), totalItems);

  const statusBadgeClass = (isActive: boolean) =>
    isActive
      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border border-gray-200 bg-gray-100 text-gray-500";

  const visibilityBadgeClass = (isVisible: boolean) =>
    isVisible
      ? "border border-gray-200 bg-gray-100 text-gray-700"
      : "border border-gray-200 bg-gray-50 text-gray-400";

  const changePage = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const getPaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <Modal>
        {/* Create Service Modal */}
        <Modal.Body name="createService" className="w-full max-w-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Service
          </h3>
          <CreateServiceForm
            isSubmitting={isCreating}
            onSubmit={(data) => {
              createService(data);
              // Query will automatically refresh via React Query invalidation
              // Form will reset automatically when creation succeeds
            }}
            onResetRef={(resetFn) => {
              formResetRef.current = resetFn;
            }}
          />
          <Modal.Close>
            <Button variant="secondary" className="mt-4 w-full">
              Close
            </Button>
          </Modal.Close>
        </Modal.Body>

        {/* Edit Service Modal */}
        <Modal.Body name="editService" className="w-full max-w-xl p-6">
          {editingService && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Service
              </h3>
              <EditServiceForm
                service={editingService}
                isSubmitting={isUpdating}
                onSubmit={handleUpdateService}
                onCancel={() => setEditingService(null)}
              />
              <Modal.Close>
                <Button variant="secondary" className="mt-4 w-full">
                  Cancel
                </Button>
              </Modal.Close>
            </>
          )}
        </Modal.Body>

        {/* Service Providers Management Modal */}
        <Modal.Body name="manageProviders" className="w-full max-w-2xl p-6">
          {selectedServiceForProviders && (
            <ServiceProvidersModal
              service={selectedServiceForProviders}
              businessId={businessId}
              onClose={() => setSelectedServiceForProviders(null)}
            />
          )}
        </Modal.Body>

        {/* Scheduler Configuration Modal */}
        <Modal.Body
          name="scheduler"
          hideDefaultClose
          className="w-full max-w-7xl p-0 bg-[#f8fafc] text-gray-900 dark:!bg-[#f8fafc] dark:!text-gray-900"
        >
          {selectedServiceForScheduler && (
            <SchedulerModal
              service={selectedServiceForScheduler}
              businessId={businessId}
              onClose={() => setSelectedServiceForScheduler(null)}
            />
          )}
        </Modal.Body>
        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-6 md:px-10">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Services</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your service catalog and visibility.</p>
            </div>
            <Modal.Open opens="createService">
              <Button className="rounded-xl bg-gray-900 px-5 py-2.5 text-white hover:bg-black" size="sm">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </Modal.Open>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 md:px-10">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300"
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                    page: 1,
                  }))
                }
                placeholder="Search services..."
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                className="h-14 min-w-44 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition focus:border-gray-300"
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value || undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
              <button
                type="button"
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition hover:text-gray-700"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    isActive:
                      prev.isActive === undefined
                        ? true
                        : prev.isActive
                          ? false
                          : undefined,
                    page: 1,
                  }))
                }
                title={
                  filters.isActive === undefined
                    ? "Filter: All"
                    : filters.isActive
                      ? "Filter: Active only"
                      : "Filter: Inactive only"
                }
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 md:px-10">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 md:px-10">
              No services found for this business.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 md:px-10">
                      Service Name
                    </th>
                    <th className="px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Description
                    </th>
                    <th className="px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Price
                    </th>
                    <th className="px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Visibility
                    </th>
                    <th className="px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 md:pr-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: Service) => (
                    <tr key={service.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-8 md:px-10">
                        <span className="text-[1.65rem] font-semibold leading-none text-gray-900">
                          {service.name}
                        </span>
                      </td>
                      <td className="px-6 py-8">
                        <p className="max-w-xs text-sm font-medium leading-7 text-gray-500">
                          {service.description || "No description provided."}
                        </p>
                      </td>
                      <td className="px-6 py-8 text-[1.65rem] font-semibold leading-none text-gray-900">
                        {Number(service.price) === 0 ? "Free" : `$${Number(service.price).toFixed(2)}`}
                      </td>
                      <td className="px-6 py-8">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${visibilityBadgeClass(
                            service.priceDisplayMode
                          )}`}
                          onClick={() => handleTogglePriceVisibility(service)}
                          disabled={isUpdating}
                        >
                          {service.priceDisplayMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {service.priceDisplayMode ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-6 py-8">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${statusBadgeClass(
                            service.isActive
                          )}`}
                          onClick={() => handleToggleActive(service)}
                          disabled={isUpdating}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {service.isActive ? "Active" : "Offline"}
                        </button>
                      </td>
                      <td className="px-6 py-8 md:pr-10">
                        <div className="flex items-center gap-2">
                          <EditButtonWrapper service={service} disabled={isUpdating} />
                          <ManageProvidersButton service={service} />
                          <SchedulerButton service={service} />
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-white hover:text-red-600"
                            onClick={() => handleDelete(service.id)}
                            disabled={isDeleting}
                            title="Delete service"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-6 py-8 md:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Showing {fromItem} to {toItem} of {totalItems} services
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-40"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPaginationItems().map((item, index) =>
                item === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    type="button"
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
                      item === currentPage
                        ? "border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                        : "border-gray-200 bg-white text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => changePage(item as number)}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-40"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
};

interface CreateServiceFormProps {
  isSubmitting: boolean;
  onSubmit: (data: {
    name: string;
    description?: string;
    price: number;
    status: "Active" | "Inactive" | "Archived";
    priceDisplayMode: boolean;
    isActive?: boolean;
  }) => void;
  onResetRef?: (resetFn: () => void) => void;
}

const CreateServiceForm: React.FC<CreateServiceFormProps> = ({
  isSubmitting,
  onSubmit,
  onResetRef,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Archived">(
    "Active"
  );
  const [priceDisplayMode, setPriceDisplayMode] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Reset form function
  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStatus("Active");
    setPriceDisplayMode(false);
    setIsActive(true);
  };

  // Expose reset function to parent via ref
  React.useEffect(() => {
    if (onResetRef) {
      onResetRef(resetForm);
    }
  }, [onResetRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice)) {
      return;
    }
    onSubmit({
      name,
      description: description || undefined,
      price: parsedPrice,
      status,
      priceDisplayMode,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Service Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="e.g., Haircut"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the service..."
        />
      </div>
      <Input
        label="Price"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        placeholder="50.00"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "Active" | "Inactive" | "Archived")
          }
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="mr-2"
            checked={priceDisplayMode}
            onChange={(e) => setPriceDisplayMode(e.target.checked)}
          />
          Show Price to Customers
        </label>
        <label className="inline-flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="mr-2"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Service is Active
        </label>
      </div>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Create Service
      </Button>
    </form>
  );
};

interface EditServiceFormProps {
  service: Service;
  isSubmitting: boolean;
  onSubmit: (data: {
    name: string;
    description?: string;
    price: number;
    status: "Active" | "Inactive" | "Archived";
    priceDisplayMode: boolean;
    isActive?: boolean;
  }) => void;
  onCancel: () => void;
}

const EditServiceForm: React.FC<EditServiceFormProps> = ({
  service,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description || "");
  const [price, setPrice] = useState(service.price.toString());
  const [status, setStatus] = useState<"Active" | "Inactive" | "Archived">(
    service.status
  );
  const [priceDisplayMode, setPriceDisplayMode] = useState(
    service.priceDisplayMode
  );
  const [isActive, setIsActive] = useState(service.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice)) {
      return;
    }
    onSubmit({
      name,
      description: description || undefined,
      price: parsedPrice,
      status,
      priceDisplayMode,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Service Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="e.g., Haircut"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the service..."
        />
      </div>
      <Input
        label="Price"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        placeholder="50.00"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "Active" | "Inactive" | "Archived")
          }
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="mr-2"
            checked={priceDisplayMode}
            onChange={(e) => setPriceDisplayMode(e.target.checked)}
          />
          Show Price to Customers
        </label>
        <label className="inline-flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="mr-2"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Service is Active
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Update Service
        </Button>
      </div>
    </form>
  );
};

// Service Providers Management Modal Component
interface ServiceProvidersModalProps {
  service: Service;
  businessId: string | null;
  onClose: () => void;
}

const ServiceProvidersModal: React.FC<ServiceProvidersModalProps> = ({
  service,
  businessId,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [description, setDescription] = useState("");
  const [impUrl, setImpUrl] = useState("");
  const [error, setError] = useState("");

  const { providers, isLoading, createServiceProvider, isCreating, deleteServiceProvider, isDeleting } = useServiceProviders(
    businessId,
    { 
      page: 1, 
      limit: 100,
      serviceId: service.id, // Filter by service directly
      search: searchTerm || undefined,
    }
  );

  // Filter providers by search term (if not already filtered by API)
  const filteredProviders = searchTerm
    ? providers.filter((p: ServiceProvider) =>
        p.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : providers;

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!userId.trim()) {
      setError("Please enter a user ID");
      return;
    }

    createServiceProvider(
      {
        serviceId: service.id,
        userId: userId.trim(),
        description: description.trim() || undefined,
        impUrl: impUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setUserId("");
          setDescription("");
          setImpUrl("");
          setShowAddForm(false);
          setError("");
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to add service provider"
          );
        },
      }
    );
  };

  const handleDeleteProvider = (providerId: string) => {
    if (!window.confirm("Are you sure you want to remove this service provider?")) {
      return;
    }
    deleteServiceProvider(providerId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Service Providers for: {service.name}
        </h3>
        <Modal.Close>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Close>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          label="Search Providers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by user ID or description..."
        />
      </div>

      {/* Add Provider Section */}
      {!showAddForm ? (
        <Button onClick={() => setShowAddForm(true)} className="mb-4">
          Add Service Provider
        </Button>
      ) : (
        <form onSubmit={handleAddProvider} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Add New Service Provider</h4>
          <div className="space-y-3">
            <div>
              <Input
                label="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                placeholder="Enter user ID (from service provider account)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the user ID of the service provider account. You can create a new account from the Service Providers section in the dashboard.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provider description..."
              />
            </div>
            <Input
              label="Image URL (Optional)"
              value={impUrl}
              onChange={(e) => setImpUrl(e.target.value)}
              placeholder="https://..."
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" isLoading={isCreating}>
                Add Provider
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowAddForm(false);
                  setError("");
                  setUserId("");
                  setDescription("");
                  setImpUrl("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Provider List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading providers...</div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm
            ? "No service providers found matching your search."
            : "No service providers assigned to this service yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">User ID</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Created At</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProviders.map((provider: ServiceProvider) => (
                <tr key={provider.id}>
                  <td className="px-4 py-2 font-mono text-xs">{provider.userId}</td>
                  <td className="px-4 py-2">
                    {provider.description || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(provider.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                      onClick={() => handleDeleteProvider(provider.id)}
                      disabled={isDeleting}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Scheduler Configuration Modal Component
interface SchedulerModalProps {
  service: Service;
  businessId: string | null;
  onClose: () => void;
}

const SchedulerModal: React.FC<SchedulerModalProps> = ({
  service,
  businessId,
  onClose,
}) => {
  const {
    scheduler,
    schedulerExists,
    isLoading,
    create,
    isCreating,
    update,
    isUpdating,
    deleteScheduler: deleteSchedulerFn,
    isDeleting,
  } = useScheduler({
    businessId,
    serviceId: service.id,
    enabled: !!businessId && !!service.id,
  });

  const handleSubmit = (data: { serviceId: string; canScheduleTime: CanScheduleTime }) => {
    if (schedulerExists) {
      update(
        { canScheduleTime: data.canScheduleTime },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      create(data, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete the scheduler configuration for this service?")) {
      return;
    }
    deleteSchedulerFn(undefined, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#f8fafc] text-gray-900 dark:!bg-[#f8fafc] dark:!text-gray-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
        <div className="sticky top-0 z-10 -mx-2 mb-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/95 px-3 py-3 backdrop-blur">
          <Modal.Close>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Services
            </button>
          </Modal.Close>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!schedulerExists || isDeleting || isLoading}
              title={schedulerExists ? "Delete scheduler" : "No scheduler to delete"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-300 bg-white text-gray-600 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <Button
              type="submit"
              form="scheduler-config-form"
              isLoading={isCreating || isUpdating}
              className="rounded-2xl bg-primary-600 px-6 text-white hover:bg-primary-700"
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-200/60">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Scheduler Config</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Service:</span>
              <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-700">
                {service.name}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="rounded-[2rem] border border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500 shadow-sm">
              Loading scheduler...
            </div>
          ) : (
            <SchedulerForm
              formId="scheduler-config-form"
              serviceId={service.id}
              existingScheduler={scheduler ? { canScheduleTime: scheduler.canScheduleTime } : undefined}
              isSubmitting={isCreating || isUpdating}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
};
