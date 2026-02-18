"use client";

import React, { useState, useEffect } from "react";
import { Service, ServiceProvider, User } from "@/types";
import {
  Button,
  Input,
  Modal,
  TextArea,
  useCloseModal,
} from "@/components";
import { useRoleAuth } from "@/contexts";
import { getAvailableSlots, createBooking, createContact, getServiceProviders } from "@/services";
import { AvailableSlot } from "@/services/schedulerService";
import * as toast from "@/lib/toast";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

interface BookingFormProps {
  service: Service;
  businessSlug: string;
  businessId: string;
  onClose: () => void;
  heroImageUrl?: string;
  businessName?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  service,
  businessSlug,
  businessId,
  onClose,
  heroImageUrl,
  businessName,
}) => {
  const { getSession, isLoading: authLoading } = useRoleAuth();
  const customerSession = getSession("Customer");
  const { user: customerUser, token: customerToken } = customerSession;
  const closeModal = useCloseModal();
  
  // Check if customer is logged in for this specific business site
  const isCustomerLoggedIn = React.useMemo(() => {
    if (authLoading || !customerUser || !customerToken) return false;
    
    // Check if customer is logged in for this specific business site
    if (typeof window !== "undefined") {
      const storedBusinessSiteSlug = localStorage.getItem("customer_businessSiteSlug");
      return storedBusinessSiteSlug === businessSlug;
    }
    return false;
  }, [authLoading, customerUser, customerToken, businessSlug]);
  
  // Guest user is anyone who is not logged in as customer
  const isGuestUser = !authLoading && !isCustomerLoggedIn;
  const [guestStep, setGuestStep] = useState<1 | 2>(1);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [serviceProviders, setServiceProviders] = useState<(ServiceProvider & { user?: User })[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Pre-fill customer information if logged in
  // Use primitive values to avoid infinite loops
  const customerUserId = customerUser?.id;
  const customerFirstName = customerUser?.firstName;
  const customerLastName = customerUser?.lastName;
  const customerEmail = customerUser?.email;
  const customerPhone = customerUser?.phone;
  
  useEffect(() => {
    if (isCustomerLoggedIn && customerUserId) {
      setFormData(prev => ({
        ...prev,
        firstName: customerFirstName || "",
        lastName: customerLastName || "",
        email: customerEmail || "",
        phone: customerPhone || "",
      }));
    }
  }, [isCustomerLoggedIn, customerUserId, customerFirstName, customerLastName, customerEmail, customerPhone]);

  // Fetch service providers for authenticated users (silently for auto-assignment)
  useEffect(() => {
    if (isCustomerLoggedIn && businessId && service.id) {
      fetchServiceProviders();
    }
  }, [isCustomerLoggedIn, businessId, service.id]);

  // Auto-select first available provider for customers (they don't need to choose)
  useEffect(() => {
    if (isCustomerLoggedIn && serviceProviders.length > 0 && !selectedProviderId) {
      setSelectedProviderId(serviceProviders[0].id);
    }
  }, [isCustomerLoggedIn, serviceProviders, selectedProviderId]);

  // Fetch available slots
  useEffect(() => {
    if (service.id && businessSlug) {
      fetchAvailableSlots();
    }
  }, [service.id, businessSlug, selectedDate, selectedProviderId]);

  // Reset guest step if auth state changes
  useEffect(() => {
    if (!isGuestUser) setGuestStep(1);
  }, [isGuestUser]);

  const fetchServiceProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await getServiceProviders(businessId, {
        serviceId: service.id,
      });

      const responseData = response.data;
      if (responseData?.success && responseData?.data) {
        const providers = responseData.data;
        setServiceProviders(providers);
        
        // Auto-select first provider if only one is available
        if (providers.length === 1) {
          setSelectedProviderId(providers[0].id);
        }
      } else {
        setServiceProviders([]);
      }
    } catch (error) {
      console.error("Failed to fetch service providers:", error);
      toast.error("Failed to load service providers");
      setServiceProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await getAvailableSlots(service.id, {
        date: selectedDate,
        businessSlug,
        serviceProviderId: selectedProviderId || undefined,
      });
      
      // Handle different response structures
      const responseData = response.data;
      if (responseData?.success && responseData?.data) {
        setAvailableSlots(responseData.data.availableSlots || []);
      } else if (responseData?.data?.availableSlots) {
        setAvailableSlots(responseData.data.availableSlots);
      } else if (responseData?.availableSlots) {
        setAvailableSlots(responseData.availableSlots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
      toast.error("Failed to load available time slots");
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string, format: string = "12"): string => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (format === "12") {
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } else {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  };

  const formatPrice = (price: number) => {
    if (Number.isNaN(price)) return "$0.00";
    return `$${price.toFixed(2)}`;
  };

  const getServiceDurationLabel = () => {
    const anyService = service as any;
    const durationMinutes =
      anyService?.durationMinutes ??
      anyService?.duration ??
      anyService?.durationInMinutes;

    if (typeof durationMinutes === "number" && Number.isFinite(durationMinutes) && durationMinutes > 0) {
      return `${Math.round(durationMinutes)} Minutes`;
    }

    if (selectedSlot) {
      const mins = Math.round(
        (new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / 60000
      );
      if (Number.isFinite(mins) && mins > 0) return `${mins} Minutes`;
    }

    return "—";
  };

  const getSelectedDateTimeLabel = () => {
    if (!selectedSlot) return "—";
    const date = selectedSlot.start.split("T")[0];
    return `${date} at ${formatTime(selectedSlot.start)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    if (isCustomerLoggedIn) {
      // For logged-in customers, check if provider is required by backend
      // If no providers are available, we'll attempt to create booking without provider
      // The backend should handle assigning a default provider
      if (!selectedProviderId && serviceProviders.length === 0) {
        console.warn("⚠️ No service providers available. Backend should assign default provider.");
      }
    } else {
      // Validate required fields for guest users
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    try {
      setSubmitting(true);

      if (isCustomerLoggedIn) {
        // Create booking for logged-in user
        // Validate that we have userId
        if (!customerUser?.id) {
          toast.error("User ID not found. Please log in again.");
          return;
        }

        const bookingPayload: any = {
          userId: customerUser.id, // Include userId in payload
          serviceId: service.id,
          bookingTime: {
            start: selectedSlot.start,
            end: selectedSlot.end,
          },
          status: "Pending",
          confirmationMethod: "Email",
          bookingSource: "Website",
          customerNotes: formData.notes,
        };

        // Only include serviceProviderId if one was selected
        if (selectedProviderId) {
          bookingPayload.serviceProviderId = selectedProviderId;
        }

        console.log("📤 Sending booking payload:", JSON.stringify(bookingPayload, null, 2));
        console.log("📍 Business slug:", businessSlug);
        console.log("👤 Customer User ID:", customerUser.id);

        const response = await createBooking(bookingPayload, businessSlug);

        const responseData = response.data;
        if (responseData?.success || response.status === 201) {
          toast.success("Booking created successfully!");
          onClose();
          closeModal();
          // Reset form
          setSelectedSlot(null);
          setFormData({ ...formData, notes: "" });
        }
      } else {
        // Create contact for non-logged-in user
        const response = await createContact(
          {
            serviceId: service.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            bookingTime: {
              start: selectedSlot.start,
              end: selectedSlot.end,
            },
            notes: formData.notes,
          },
          businessSlug
        );

        const responseData = response.data;
        if (responseData?.success || response.status === 201) {
          toast.success("Booking request submitted! We will contact you soon.");
          onClose();
          closeModal();
          // Reset form
          setSelectedSlot(null);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            notes: "",
          });
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to submit booking:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      
      let errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit booking. Please try again.";
      
      // Check for specific backend validation errors
      if (error.response?.status === 400) {
        const backendError = error.response?.data?.message || "";
        
        // Check if error is about missing service provider
        if (backendError.toLowerCase().includes("serviceprovider") || 
            backendError.toLowerCase().includes("provider")) {
          errorMessage = "This service requires a service provider to be assigned. Please contact the business to set up service providers.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-form">
      {/* Guest: premium 2-step layout */}
      {isGuestUser ? (
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl bg-white">
          <div className="grid md:grid-cols-2">
            {/* Left panel */}
            <div className="relative min-h-[320px] overflow-hidden md:min-h-[680px]">
              <img
                src={
                  heroImageUrl ||
                  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80"
                }
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

              <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <Modal.Close>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/70 transition hover:text-white"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {businessName || "Services"}
                      </button>
                    </Modal.Close>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200/80">
                      Step {guestStep} of 2
                    </p>
                    <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
                      Your next
                      <br />
                      <span className="font-light italic text-white/95">
                        {guestStep === 1 ? "ritual" : "rituals"}
                      </span>{" "}
                      begins.
                    </h2>
                  </div>
                </div>

                {/* Summary card */}
                <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-100">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/45">
                        Service Selection
                      </p>
                      <p className="mt-1 truncate text-xl font-bold text-white">{service.name}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                    {guestStep === 1 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Duration</span>
                        <span className="font-semibold text-white">{getServiceDurationLabel()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Date &amp; Time</span>
                        <span className="font-semibold text-white">{getSelectedDateTimeLabel()}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/45">Total Price</span>
                      <span className="font-semibold text-white">
                        {service.priceDisplayMode ? formatPrice(Number(service.price)) : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="hidden text-xs text-white/35 md:block">
                  “The details are not the details. They make the design.”
                  <br />— CHARLES EAMES
                </p>
              </div>
            </div>

            {/* Right panel */}
            <div className="bg-[#fbfbfb] p-8 md:p-12">
              {guestStep === 1 ? (
                <div className="mx-auto w-full max-w-xl">
                  <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                    Select Date &amp; Time
                  </h3>
                  <p className="mt-2 text-base font-medium text-zinc-500">
                    When would you like to visit us?
                  </p>

                  <div className="mt-10 space-y-10">
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                        Choose date
                      </p>
                      <Input
                        type="date"
                        required
                        value={selectedDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSlot(null);
                        }}
                        leftIcon={<Calendar className="h-4 w-4" />}
                        className="h-14 rounded-2xl border-zinc-200 bg-white px-5 pl-12 text-base"
                      />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                        Available slots
                      </p>

                      {loading ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-600">
                          Loading available slots...
                        </div>
                      ) : availableSlots.filter((s) => s.available).length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-600">
                          No available slots for this date. Please try another date.
                        </div>
                      ) : (
                        <div className="grid max-h-[220px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                          {availableSlots
                            .filter((slot) => slot.available)
                            .map((slot, index) => {
                              const isSelected = selectedSlot?.start === slot.start;
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={[
                                    "h-14 rounded-2xl border text-sm font-semibold transition",
                                    "shadow-[0_6px_18px_rgba(0,0,0,0.05)]",
                                    isSelected
                                      ? "border-zinc-900 bg-zinc-900 text-white"
                                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                                  ].join(" ")}
                                >
                                  {formatTime(slot.start)}
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedSlot || submitting || authLoading}
                      onClick={() => {
                        if (!selectedSlot) return;
                        setGuestStep(2);
                      }}
                      className={[
                        "mt-2 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl",
                        "text-sm font-bold transition",
                        !selectedSlot || submitting || authLoading
                          ? "cursor-not-allowed bg-zinc-200/70 text-zinc-600"
                          : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300",
                      ].join(" ")}
                    >
                      Continue to Personal Details
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-xl">
                  <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                    Personal Details
                  </h3>
                  <p className="mt-2 text-base font-medium text-zinc-500">
                    Complete your request by providing your contact info.
                  </p>

                  <div className="mt-10 space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                          First name
                        </p>
                        <Input
                          id="guest-first-name"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                          leftIcon={<UserIcon className="h-4 w-4" />}
                          className="h-14 rounded-2xl border-zinc-200 bg-white px-5 pl-12 text-base"
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                          Last name
                        </p>
                        <Input
                          id="guest-last-name"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                          className="h-14 rounded-2xl border-zinc-200 bg-white px-5 text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                        Email address
                      </p>
                      <Input
                        id="guest-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        leftIcon={<Mail className="h-4 w-4" />}
                        className="h-14 rounded-2xl border-zinc-200 bg-white px-5 pl-12 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                        Phone number
                      </p>
                      <Input
                        id="guest-phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 00000 00000"
                        leftIcon={<Phone className="h-4 w-4" />}
                        className="h-14 rounded-2xl border-zinc-200 bg-white px-5 pl-12 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                        Notes (optional)
                      </p>
                      <div className="relative">
                        <div className="pointer-events-none absolute left-4 top-4 text-zinc-400">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <TextArea
                          id="guest-notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Any special requests or details..."
                          className="min-h-[120px] rounded-2xl border-zinc-200 bg-white px-5 py-4 pl-12 text-base"
                        />
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setGuestStep(1)}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-100 px-8 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200"
                      >
                        Back
                      </button>

                      <Button
                        type="submit"
                        disabled={!selectedSlot || submitting || authLoading}
                        isLoading={submitting}
                        leftIcon={<CheckCircle2 className="h-5 w-5" />}
                        className="h-14 w-full rounded-2xl bg-zinc-900 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] hover:bg-zinc-800 sm:w-auto sm:min-w-[320px]"
                      >
                        Confirm Appointment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        /* Customer (logged-in): premium split layout matching the provided design */
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl bg-white">
          <div className="grid md:grid-cols-2">
            {/* Left panel */}
            <div className="relative min-h-[320px] overflow-hidden md:min-h-[680px]">
              <img
                src={
                  heroImageUrl ||
                  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80"
                }
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

              <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <Modal.Close>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/70 transition hover:text-white"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {businessName || "Services"}
                      </button>
                    </Modal.Close>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200/80">
                      Authenticated Booking
                    </p>
                    <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
                      Your next
                      <br />
                      <span className="font-light italic text-white/95">rituals</span> begin.
                    </h2>
                  </div>
                </div>

                {/* Summary card */}
                <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-100">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/45">
                        Service Selection
                      </p>
                      <p className="mt-1 truncate text-xl font-bold text-white">{service.name}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/45">Date &amp; Time</span>
                      <span className="font-semibold text-white">{getSelectedDateTimeLabel()}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/45">Total Price</span>
                      <span className="font-semibold text-white">
                        {service.priceDisplayMode ? formatPrice(Number(service.price)) : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="hidden text-xs text-white/35 md:block">
                  “The details are not the details. They make the design.”
                  <br />— CHARLES EAMES
                </p>
              </div>
            </div>

            {/* Right panel */}
            <div className="bg-[#fbfbfb] p-8 md:p-12">
              <div className="mx-auto w-full max-w-xl">
                {/* Logged-in user card */}
                {isCustomerLoggedIn && customerUser && (
                  <div className="mb-10 flex items-center justify-between gap-4 rounded-[2rem] border border-emerald-200/60 bg-emerald-50/70 px-6 py-5 shadow-[0_10px_30px_rgba(16,185,129,0.10)]">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-zinc-900">
                            Logged in as {customerUser.firstName} {customerUser.lastName}
                          </p>
                          <span className="rounded-full bg-emerald-600/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-700">
                            Verified
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-zinc-600">
                          {customerUser.email} • {customerUser.phone || "No phone"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <h3 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  Select Date &amp; Time
                </h3>
                <p className="mt-2 text-base font-medium text-zinc-500">
                  Choose a preferred slot for your visit.
                </p>

                <div className="mt-10 space-y-10">
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                      Choose date
                    </p>
                    <Input
                      type="date"
                      required
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      leftIcon={<Calendar className="h-4 w-4" />}
                      className="h-14 rounded-2xl border-zinc-200 bg-white px-5 pl-12 text-base"
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                      Available slots
                    </p>

                    {loading ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-600">
                        Loading available slots...
                      </div>
                    ) : availableSlots.filter((s) => s.available).length === 0 ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-600">
                        No available slots for this date. Please try another date.
                      </div>
                    ) : (
                      <div className="grid max-h-[220px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                        {availableSlots
                          .filter((slot) => slot.available)
                          .map((slot, index) => {
                            const isSelected = selectedSlot?.start === slot.start;
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={[
                                  "h-14 rounded-2xl border text-sm font-semibold transition",
                                  "shadow-[0_6px_18px_rgba(0,0,0,0.05)]",
                                  isSelected
                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                                ].join(" ")}
                              >
                                {formatTime(slot.start)}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">
                      Notes (optional)
                    </p>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-4 text-zinc-400">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <TextArea
                        id="customer-notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special requests or details..."
                        className="min-h-[120px] rounded-2xl border-zinc-200 bg-white px-5 py-4 pl-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      isLoading={submitting}
                      disabled={!selectedSlot || submitting || authLoading}
                      leftIcon={<CheckCircle2 className="h-5 w-5" />}
                      className={[
                        "h-14 w-full rounded-2xl border-0",
                        "bg-zinc-900 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] hover:bg-zinc-800",
                        "disabled:bg-zinc-200 disabled:text-zinc-600 disabled:opacity-100 disabled:hover:bg-zinc-200",
                      ].join(" ")}
                    >
                      Confirm Booking as {customerUser?.firstName || "Customer"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
