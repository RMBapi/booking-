"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Service } from "@/types";
import type {
  AvailableSlot,
  BookingTime,
  CreateBookingPayload,
  CreateContactPayload,
} from "@/types";
import { B } from "./constants";
import {
  getSydneyTime,
  getServicePriceLabel,
  getServiceDuration,
  serviceDescription,
  formatDateForApi,
  formatSlotTime,
} from "./utils";
import {
  StepBar,
  ProviderStep,
  TimeStep,
  ClientStep,
  SuccessView,
} from "./components";
import type {
  BookingFormProps,
  Provider,
  ServiceInfo,
  Step,
  StepMeta,
} from "./types";
import { mapServiceProviderToProvider } from "./types";
import {
  createBooking,
  createContact,
  getAvailableSlots,
  getServiceProviders,
  login,
} from "@/services";
import { useRoleAuth } from "@/contexts";
import { useCloseModal } from "@/components/ui/Modal";
import { useApiError, useApiSuccess } from "@/hooks";
import { extractApiErrorMessage } from "@/hooks/api-response";

export const BookingForm: React.FC<BookingFormProps> = ({
  service,
  businessSlug,
  businessId,
  businessName,
  onClose,
  heroImageUrl,
}) => {
  const { getSession, setSession } = useRoleAuth();
  const { handleError } = useApiError();
  const { handleSuccess } = useApiSuccess();
  const customerSession = getSession("Customer");
  const isCustomerLoggedIn = !!(customerSession.token && customerSession.user);
  const closeModal = useCloseModal();
  const showProviderStep = !!service.showProvider;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(showProviderStep);

  useEffect(() => {
    if (!showProviderStep) return;

    const fetchProviders = async () => {
      setProvidersLoading(true);
      try {
        const data = await getServiceProviders(businessSlug, service.id);
        const providerList = data?.data?.providers;
        if (data.success && Array.isArray(providerList)) {
          setProviders(providerList.map(mapServiceProviderToProvider));
        } else if (service.providers?.length) {
          setProviders(service.providers.map(mapServiceProviderToProvider));
        }
      } catch {
        if (service.providers?.length) {
          setProviders(service.providers.map(mapServiceProviderToProvider));
        }
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchProviders();
  }, [showProviderStep, businessSlug, service.id, service.providers]);

  const hasProviders = showProviderStep;

  const initialStep: Step = hasProviders ? "provider" : "time";

  const [step, setStep] = useState<Step>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Step[]>(
    hasProviders ? [] : ["provider"],
  );
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [sydneyTime, setSydneyTime] = useState(getSydneyTime);

  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regNotes, setRegNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setSydneyTime(getSydneyTime()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const serviceInfo = useMemo<ServiceInfo>(
    () => ({
      name: service.name || "Service",
      price: getServicePriceLabel(service),
      duration: getServiceDuration(service),
      description: serviceDescription(service),
      imageUrl: (service as Service & { imageUrl?: string }).imageUrl,
    }),
    [service],
  );

  const completeStep = useCallback(
    (s: Step) =>
      setCompletedSteps((prev) => (prev.includes(s) ? prev : [...prev, s])),
    [],
  );

  const handleSelectProvider = useCallback(
    (p: Provider) => {
      setSelectedProvider(p);
      setSelectedDate(null);
      setSelectedSlot(null);
      setAvailableSlots([]);
      completeStep("provider");
      setStep("time");
    },
    [completeStep],
  );

  const loadSlots = useCallback(
    async (date: Date, providerId?: string | null) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const response = await getAvailableSlots({
          serviceId: service.id,
          date: formatDateForApi(date),
          businessSlug,
          businessId,
          serviceProviderId: providerId || undefined,
        });

        const payload = response.data?.data || response.data;
        const slots = payload?.availableSlots || payload?.slots || [];
        const normalized = slots.filter(
          (s: AvailableSlot) => s.available !== false,
        );
        setAvailableSlots(normalized);
        setTimeFormat(payload?.timeFormat || "12");
      } catch (err) {
        setSlotsError(extractApiErrorMessage(err));
      } finally {
        setSlotsLoading(false);
      }
    },
    [service.id, businessSlug, businessId],
  );

  const handleSelectDate = useCallback(
    (d: Date) => {
      setSelectedDate(d);
      setSelectedSlot(null);
      setAvailableSlots([]);
      loadSlots(d, selectedProvider?.id || null);
    },
    [loadSlots, selectedProvider?.id],
  );

  const handleSelectSlot = useCallback((slot: AvailableSlot) => {
    setSelectedSlot(slot);
  }, []);

  const handleConfirmTime = useCallback(() => {
    if (!selectedDate || !selectedSlot) return;
    completeStep("time");
    setStep("client");
  }, [selectedDate, selectedSlot, completeStep]);

  const handleSubmit = useCallback(
    async (mode: "login" | "guest" | "logged-in") => {
      if (!selectedSlot || !selectedDate) return;
      setSubmitting(true);
      setSubmitError(null);

      try {
        const bookingTime: BookingTime = {
          start: selectedSlot.start,
          end: selectedSlot.end,
        };

        if (mode === "guest") {
          const nameParts = regName.trim().split(/\s+/).filter(Boolean);
          const firstName = nameParts[0] || "Guest";
          const lastName = nameParts.slice(1).join(" ") || "Customer";

          if (!regEmail.trim() || !regPhone.trim()) {
            setSubmitError("Please enter your email and phone number.");
            return;
          }

          const payload: CreateContactPayload = {
            serviceId: service.id,
            firstName,
            lastName,
            email: regEmail.trim(),
            phone: regPhone.trim(),
            bookingTime,
            notes: regNotes.trim() || undefined,
          };

          const response = await createContact(
            payload,
            businessSlug,
            businessId,
          );
          handleSuccess(response);
          setShowSuccess(true);
          return;
        }

        if (!isCustomerLoggedIn && mode === "login") {
          if (!loginEmail.trim() || !loginPassword.trim()) {
            setSubmitError("Please enter your email and password.");
            return;
          }

          const loginResponse = await login({
            email: loginEmail.trim(),
            password: loginPassword,
            role: "Customer",
            businessSiteSlug: businessSlug || undefined,
          });

          const { accessToken, user } = loginResponse.data || {};
          if (!accessToken || !user) {
            setSubmitError("Login failed. Please try again.");
            return;
          }

          const additionalData: Record<string, string> = {};
          if (businessSlug) additionalData.businessSiteSlug = businessSlug;
          setSession("Customer", accessToken, user, additionalData);
        }

        if (service.showProvider && !selectedProvider?.id) {
          setSubmitError("Please select a provider.");
          return;
        }

        const bookingPayload: CreateBookingPayload = {
          serviceId: service.id,
          serviceProviderId: selectedProvider?.id || undefined,
          bookingTime,
          status: "Pending",
          confirmationMethod: "Email",
          bookingSource: "Website",
          customerNotes: regNotes.trim() || undefined,
        };

        const response = await createBooking(
          bookingPayload,
          businessSlug,
          businessId,
        );
        handleSuccess(response);
        setShowSuccess(true);
      } catch (err) {
        setSubmitError(extractApiErrorMessage(err));
        handleError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedSlot,
      selectedDate,
      regName,
      regEmail,
      regPhone,
      regNotes,
      loginEmail,
      loginPassword,
      service.id,
      service.showProvider,
      selectedProvider?.id,
      businessSlug,
      businessId,
      isCustomerLoggedIn,
      onClose,
      handleError,
      handleSuccess,
      setSession,
    ],
  );

  const handleBack = useCallback(() => {
    if (step === "provider" || (step === "time" && !hasProviders)) {
      closeModal();
      onClose();
    } else if (step === "time") {
      setStep("provider");
    } else if (step === "client") {
      setStep("time");
    }
  }, [step, hasProviders, closeModal, onClose]);

  const handleStepClick = useCallback(
    (clickedStep: Step | "services") => {
      if (clickedStep === "services") {
        closeModal();
        onClose();
        return;
      }
      if (clickedStep === step) return;
      const stepOrder: Step[] = hasProviders
        ? ["provider", "time", "client"]
        : ["time", "client"];
      const currentIdx = stepOrder.indexOf(step);
      const targetIdx = stepOrder.indexOf(clickedStep);
      if (targetIdx < currentIdx || completedSteps.includes(clickedStep)) {
        setStep(clickedStep);
      }
    },
    [step, completedSteps, hasProviders, closeModal, onClose],
  );

  const selectedTimeLabel = selectedSlot
    ? formatSlotTime(selectedSlot.start, timeFormat)
    : null;

  const stepsMeta = useMemo<StepMeta[]>(() => {
    const steps: StepMeta[] = [];
    if (hasProviders) {
      steps.push({
        key: "provider",
        label: "PROVIDER",
        sub: selectedProvider?.name,
      });
    }
    steps.push({
      key: "time",
      label: "TIME",
      sub:
        selectedDate && selectedTimeLabel
          ? `${selectedDate.toLocaleDateString("en-AU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })} ${selectedTimeLabel}`
          : undefined,
    });
    steps.push({ key: "client", label: "CLIENT" });
    return steps;
  }, [hasProviders, selectedProvider, selectedDate, selectedTimeLabel]);

  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  useEffect(() => {
    if (!selectedDate) return;
    setAvailableSlots([]);
    setSelectedSlot(null);
    loadSlots(selectedDate, selectedProvider?.id || null);
  }, [selectedProvider?.id, selectedDate, loadSlots]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: B.dark }}
    >
      <div ref={topRef}>
        <StepBar
          steps={stepsMeta}
          activeStep={step}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      <div
        className="flex items-center justify-between px-6 lg:px-16 py-3 border-b"
        style={{ borderColor: B.border }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
          style={{ color: B.muted }}
          onMouseEnter={(e) => (e.currentTarget.style.color = B.white)}
          onMouseLeave={(e) => (e.currentTarget.style.color = B.muted)}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs" style={{ color: B.muted }}>
          Our time:{" "}
          <span style={{ color: B.white }}>{sydneyTime} Australia/Sydney</span>
        </span>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 lg:px-8 py-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "provider" && hasProviders && (
            <ProviderStep
              key="provider"
              service={serviceInfo}
              providers={providers}
              loading={providersLoading}
              onSelect={handleSelectProvider}
            />
          )}
          {step === "time" && (
            <TimeStep
              key="time"
              service={serviceInfo}
              heroImageUrl={heroImageUrl}
              selectedProvider={selectedProvider}
              selectedDate={selectedDate}
              selectedSlotStart={selectedSlot?.start || null}
              availableSlots={availableSlots}
              timeFormat={timeFormat}
              slotsLoading={slotsLoading}
              slotsError={slotsError}
              onSelectDate={handleSelectDate}
              onSelectSlot={handleSelectSlot}
              onConfirm={handleConfirmTime}
            />
          )}
          {step === "client" && (
            <ClientStep
              key="client"
              service={serviceInfo}
              selectedProvider={selectedProvider}
              selectedDate={selectedDate}
              selectedTime={selectedTimeLabel}
              isAuthenticated={isCustomerLoggedIn}
              businessName={businessName}
              isLogin={isLogin}
              showPass={showPass}
              loginEmail={loginEmail}
              loginPassword={loginPassword}
              regName={regName}
              regEmail={regEmail}
              regPhone={regPhone}
              regNotes={regNotes}
              agreed={agreed}
              subscribe={subscribe}
              submitting={submitting}
              submitError={submitError}
              onToggleLogin={setIsLogin}
              onToggleShowPass={() => setShowPass((p) => !p)}
              onLoginEmailChange={setLoginEmail}
              onLoginPasswordChange={setLoginPassword}
              onRegNameChange={setRegName}
              onRegEmailChange={setRegEmail}
              onRegPhoneChange={setRegPhone}
              onRegNotesChange={setRegNotes}
              onToggleAgreed={() => setAgreed((a) => !a)}
              onToggleSubscribe={() => setSubscribe((s) => !s)}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </div>

      {showSuccess && (
        <SuccessView
          service={serviceInfo}
          selectedProvider={selectedProvider}
          dateStr={dateStr}
          selectedTime={selectedTimeLabel}
          onDismiss={() => {
            setShowSuccess(false);
            closeModal();
          }}
        />
      )}
    </div>
  );
};
