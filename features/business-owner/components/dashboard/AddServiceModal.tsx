"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  Tag,
  Users,
} from "lucide-react";
import { useBusinessServices } from "@/features/business-owner";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  Switch,
  modalCancelButtonClass,
  modalFieldLabelClass,
  modalInputClass,
} from "@/components/ui";
import { Button } from "@/components/buttons";
import { cn } from "@/utils";
import type { Service, ServiceStatus } from "@/types";

export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  /** When provided, the modal edits this service instead of creating a new one. */
  service?: Service | null;
}

const defaultForm = {
  name: "",
  description: "",
  price: "",
  priceDisplayMode: true,
  isActive: true,
  allowCustomerChooseProvider: true,
};

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-surface px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className={checked ? "text-primary-600" : "text-text-tertiary"}>
            {icon}
          </span>
          {title}
        </span>
        <span className="text-xs text-text-tertiary">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} label={title} />
    </div>
  );
}

export function AddServiceModal({
  isOpen,
  onClose,
  businessId,
  service,
}: AddServiceModalProps) {
  const isEditMode = Boolean(service);
  const [form, setForm] = useState(() => ({
    ...defaultForm,
  }));
  const { createService, isCreating, updateService, isUpdating } =
    useBusinessServices(businessId, {});
  const isSaving = isCreating || isUpdating;

  const resetForm = useCallback(() => {
    setForm({ ...defaultForm });
  }, []);

  // Hydrate the form when opening: from the service in edit mode, defaults otherwise.
  useEffect(() => {
    if (!isOpen) return;
    setForm(
      service
        ? {
            name: service.name,
            description: service.description ?? "",
            price: String(service.price),
            priceDisplayMode: service.priceDisplayMode,
            // The single "Active" toggle reflects the service's status (the
            // value the rest of the app reads); it drives both fields on save.
            isActive: service.status === "Active" && service.isActive !== false,
            allowCustomerChooseProvider:
              service.allowCustomerChooseProvider ?? true,
          }
        : { ...defaultForm },
    );
  }, [isOpen, service]);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    const priceNum = Number(form.price);
    if (!trimmedName || form.price === "" || Number.isNaN(priceNum)) {
      return;
    }

    const payload = {
      name: trimmedName,
      description: form.description.trim() || undefined,
      price: priceNum,
      // One toggle is the source of truth — keep status and isActive in sync.
      status: (form.isActive ? "Active" : "Inactive") as ServiceStatus,
      priceDisplayMode: form.priceDisplayMode,
      isActive: form.isActive,
      allowCustomerChooseProvider: form.allowCustomerChooseProvider,
    };

    const onSuccess = () => {
      onClose();
      resetForm();
    };

    if (service) {
      updateService({ id: service.id, data: payload }, { onSuccess });
    } else {
      createService(payload, { onSuccess });
    }
  };

  return (
    <ModalShell open={isOpen} onClose={handleClose} size="2xl">
      <ModalHeader
        title={isEditMode ? "Edit Service" : "Add New Service"}
        description={
          isEditMode
            ? "Update the details for this service"
            : "Create a new service for your clients"
        }
        onClose={handleClose}
      />

      <ModalBody>
        <form id="add-service-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="service-name" className={modalFieldLabelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Service Name *
              </span>
            </label>
            <input
              id="service-name"
              required
              type="text"
              placeholder="e.g., Hair Cut & Styling"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={modalInputClass}
            />
          </div>

          <div>
            <label htmlFor="service-description" className={modalFieldLabelClass}>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Description
              </span>
            </label>
            <textarea
              id="service-description"
              rows={3}
              placeholder="Describe your service..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={cn(modalInputClass, "resize-none")}
            />
          </div>

          <div>
            <label htmlFor="service-price" className={modalFieldLabelClass}>
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Price *
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                $
              </span>
              <input
                id="service-price"
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className={cn(modalInputClass, "pl-7")}
              />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <ToggleRow
              icon={<Eye className="h-4 w-4" />}
              title="Show Price"
              description="Display publicly"
              checked={form.priceDisplayMode}
              onCheckedChange={(next) =>
                setForm((f) => ({ ...f, priceDisplayMode: next }))
              }
            />
            <ToggleRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Active"
              description="Ready to book"
              checked={form.isActive}
              onCheckedChange={(next) =>
                setForm((f) => ({ ...f, isActive: next }))
              }
            />
            <ToggleRow
              icon={<Users className="h-4 w-4" />}
              title="Customer chooses provider"
              description={
                form.allowCustomerChooseProvider ? "Enabled" : "Disabled"
              }
              checked={form.allowCustomerChooseProvider}
              onCheckedChange={(next) =>
                setForm((f) => ({ ...f, allowCustomerChooseProvider: next }))
              }
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          className={modalCancelButtonClass}
        >
          Cancel
        </button>
        <Button
          type="submit"
          form="add-service-form"
          size="sm"
          isLoading={isSaving}
        >
          {isEditMode ? "Save Changes" : "Create Service"}
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
