"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  Tag,
  Users,
} from "lucide-react";
import {
  ImageUploader,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  modalCancelButtonClass,
  modalFieldLabelClass,
  modalInputClass,
} from "@/components/ui";
import { Button } from "@/components/buttons";
import { useBusinessServices } from "@/features/business-owner";
import type { Service, ServiceStatus } from "@/types";

export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  service?: Service | null;
}

const defaultForm = {
  name: "",
  description: "",
  image: null as string | null,
  price: "",
  priceDisplayMode: true,
  isActive: true,
  allowCustomerChooseProvider: true,
};

type ServiceFormState = typeof defaultForm;

const buildFormFromService = (service: Service): ServiceFormState => ({
  name: service.name ?? "",
  description: service.description ?? "",
  image: service.image ?? null,
  price: Number.isFinite(service.price) ? service.price.toString() : "",
  priceDisplayMode: service.priceDisplayMode ?? true,
  isActive:
    service.status === "Active" && (service.isActive ?? true),
  allowCustomerChooseProvider: service.allowCustomerChooseProvider ?? true,
});

export function AddServiceModal({
  isOpen,
  onClose,
  businessId,
  service,
}: AddServiceModalProps) {
  const [form, setForm] = useState<ServiceFormState>(() => ({ ...defaultForm }));
  const { createService, updateService, isCreating, isUpdating } =
    useBusinessServices(businessId, {});
  const isEditing = Boolean(service?.id);
  const imageInputValue = useMemo(() => {
    if (!form.image) return "";
    return form.image.startsWith("blob:") ? "" : form.image;
  }, [form.image]);
  const imagePending = Boolean(form.image?.startsWith("blob:"));

  const resetForm = useCallback(() => {
    setForm({ ...defaultForm });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (service) {
      setForm(buildFormFromService(service));
    } else {
      setForm({ ...defaultForm });
    }
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

    if (form.image?.startsWith("blob:")) {
      return;
    }

    const imageValue = form.image?.trim() || null;

    const basePayload = {
      name: trimmedName,
      description: form.description.trim() || undefined,
      price: priceNum,
      status: (form.isActive ? "Active" : "Inactive") as ServiceStatus,
      priceDisplayMode: form.priceDisplayMode,
      isActive: form.isActive,
      allowCustomerChooseProvider: form.allowCustomerChooseProvider,
    };

    if (isEditing && service?.id) {
      updateService(
        {
          id: service.id,
          data: {
            ...basePayload,
            image: imageValue,
          },
        },
        {
          onSuccess: () => {
            onClose();
            resetForm();
          },
        },
      );
      return;
    }

    createService(
      {
        ...basePayload,
        ...(imageValue ? { image: imageValue } : {}),
      },
      {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      },
    );
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <ModalShell open={isOpen} onClose={handleClose} size="2xl" zIndex={60}>
      <ModalHeader
        eyebrow={isEditing ? "Edit" : "New"}
        title={isEditing ? "Edit service" : "Add new service"}
        description={
          isEditing
            ? "Update the details for this service"
            : "Create a new service for your clients"
        }
        onClose={handleClose}
      />

      <form
        id="add-service-form"
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <ModalBody className="space-y-5">
          <div>
            <label
              htmlFor="service-name"
              className={`${modalFieldLabelClass} flex items-center gap-2 normal-case tracking-normal`}
            >
              <Tag className="h-4 w-4 text-text-tertiary" />
              Service name <span className="text-rose-600">*</span>
            </label>
            <input
              id="service-name"
              required
              type="text"
              placeholder="e.g., Hair Cut & Styling"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className={modalInputClass}
            />
          </div>

          <div>
            <label
              htmlFor="service-description"
              className={`${modalFieldLabelClass} flex items-center gap-2 normal-case tracking-normal`}
            >
              <FileText className="h-4 w-4 text-text-tertiary" />
              Description
            </label>
            <textarea
              id="service-description"
              rows={3}
              placeholder="Describe your service..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={`${modalInputClass} resize-none`}
            />
          </div>

          <div className="space-y-3">
            <ImageUploader
              variant="cover"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
              label="Service image or video"
              hint="Optional. Upload a cover image, MP4 video, or paste a URL below."
            />

            <div>
              <label htmlFor="service-image-url" className={modalFieldLabelClass}>
                Media URL (optional)
              </label>
              <input
                id="service-image-url"
                type="url"
                placeholder="https://example.com/service.jpg or .mp4"
                value={imageInputValue}
                onChange={(e) => {
                  const nextValue = e.target.value.trim();
                  setForm((f) => ({
                    ...f,
                    image: nextValue ? nextValue : null,
                  }));
                }}
                className={modalInputClass}
              />
            </div>

            {imagePending && (
              <p className="text-xs text-text-tertiary">
                Finishing image upload…
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="service-price"
              className={`${modalFieldLabelClass} flex items-center gap-2 normal-case tracking-normal`}
            >
              <DollarSign className="h-4 w-4 text-text-tertiary" />
              Price <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-tertiary">
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
                className={`${modalInputClass} pl-7`}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    priceDisplayMode: !f.priceDisplayMode,
                  }))
                }
                className="flex items-center justify-between rounded-lg border border-border-default bg-surface p-4 text-left transition-colors hover:bg-subtle/50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Eye
                      className={`h-4 w-4 ${
                        form.priceDisplayMode
                          ? "text-text-primary"
                          : "text-text-tertiary"
                      }`}
                    />
                    Show price
                  </span>
                  <span className="text-xs text-text-tertiary">
                    Display publicly
                  </span>
                </div>
                <div
                  className={`relative h-6 w-10 rounded-full transition-all ${
                    form.priceDisplayMode ? "bg-text-primary" : "bg-border-default"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow-sm transition-all ${
                      form.priceDisplayMode ? "right-1" : "left-1"
                    }`}
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, isActive: !f.isActive }))
                }
                className="flex items-center justify-between rounded-lg border border-border-default bg-surface p-4 text-left transition-colors hover:bg-subtle/50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        form.isActive ? "text-emerald-600" : "text-text-tertiary"
                      }`}
                    />
                    Available for booking
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {form.isActive ? "Customers can book this service" : "Hidden from booking"}
                  </span>
                </div>
                <div
                  className={`relative h-6 w-10 rounded-full transition-all ${
                    form.isActive ? "bg-emerald-600" : "bg-border-default"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow-sm transition-all ${
                      form.isActive ? "right-1" : "left-1"
                    }`}
                  />
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  allowCustomerChooseProvider: !f.allowCustomerChooseProvider,
                }))
              }
              className="flex w-full items-center justify-between rounded-lg border border-border-default bg-surface p-4 text-left transition-colors hover:bg-subtle/50"
            >
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Users
                    className={`h-4 w-4 ${
                      form.allowCustomerChooseProvider
                        ? "text-primary-600"
                        : "text-text-tertiary"
                    }`}
                  />
                  Customer chooses provider
                </span>
                <span className="text-xs text-text-tertiary">
                  {form.allowCustomerChooseProvider ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div
                className={`relative h-6 w-10 rounded-full transition-all ${
                  form.allowCustomerChooseProvider
                    ? "bg-primary-600"
                    : "bg-border-default"
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow-sm transition-all ${
                    form.allowCustomerChooseProvider ? "right-1" : "left-1"
                  }`}
                />
              </div>
            </button>
          </div>
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
            size="sm"
            disabled={isSubmitting || imagePending}
            isLoading={isSubmitting || imagePending}
          >
            {imagePending
              ? "Uploading…"
              : isEditing
                ? "Save changes"
                : "Create service"}
          </Button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
