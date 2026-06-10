"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
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
import { useApiError } from "@/hooks";
import { extractApiErrorMessage } from "@/hooks/api-response";

export const BookingForm: React.FC<BookingFormProps> = ({
  service: initialService,
  services,
  businessSlug,
  businessId,
  businessName,
  onClose,
}) => {
  const { getSession, setSession } = useRoleAuth();
  const { handleError } = useApiError();
  const customerSession = getSession("Customer");
  const isCustomerLoggedIn = !!(customerSession.token && customerSession.user);
  const closeModal = useCloseModal();

  const serviceList = useMemo(
    () => (services?.length ? services : [initialService]),
    [services, initialService],
  );
  const [activeServiceId, setActiveServiceId] = useState(initialService.id);

  useEffect(() => {
    setActiveServiceId((prev) =>
      prev === initialService.id ? prev : initialService.id,
    );
  }, [initialService.id]);

  const activeService = useMemo(
    () => serviceList.find((s) => s.id === activeServiceId) || serviceList[0],
    [serviceList, activeServiceId],
  );
  const activeServiceIndex = useMemo(() => {
    const idx = serviceList.findIndex((s) => s.id === activeServiceId);
    return idx >= 0 ? idx : 0;
  }, [serviceList, activeServiceId]);
  const canSwitchService = serviceList.length > 1;

  const showProviderStep = !!activeService.showProvider;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(showProviderStep);

  useEffect(() => {
    if (!showProviderStep) return;

    const fetchProviders = async () => {
      setProvidersLoading(true);
      try {
        const data = await getServiceProviders(businessSlug, activeService.id);
        const providerList = data?.data?.providers;
        if (data.success && Array.isArray(providerList)) {
          setProviders(providerList.map(mapServiceProviderToProvider));
        } else if (activeService.providers?.length) {
          setProviders(
            activeService.providers.map(mapServiceProviderToProvider),
          );
        }
      } catch {
        if (activeService.providers?.length) {
          setProviders(
            activeService.providers.map(mapServiceProviderToProvider),
          );
        }
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchProviders();
  }, [
    showProviderStep,
    businessSlug,
    activeService.id,
    activeService.providers,
  ]);

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
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // Listen for auth:forbidden event (403 from API)
  useEffect(() => {
    const handleForbidden = (event: Event) => {
      const customEvent = event as CustomEvent<{
        url?: string;
        message?: string;
      }>;
      const message =
        customEvent.detail?.message ||
        "You must be a registered customer of this business to book";
      setForbiddenError(message);
      setSubmitError(null);
      setSubmitting(false);
    };

    window.addEventListener("auth:forbidden", handleForbidden);
    return () => window.removeEventListener("auth:forbidden", handleForbidden);
  }, []);

  const handleServiceSwitch = useCallback(
    (direction: "prev" | "next") => {
      if (!canSwitchService) return;
      const delta = direction === "next" ? 1 : -1;
      const nextIndex =
        (activeServiceIndex + delta + serviceList.length) % serviceList.length;
      const nextService = serviceList[nextIndex];
      if (!nextService) return;

      setActiveServiceId(nextService.id);
      setSelectedProvider(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setAvailableSlots([]);
      setSlotsError(null);
      setTimeFormat("12");
      setCompletedSteps(nextService.showProvider ? [] : ["provider"]);
      setStep(nextService.showProvider ? "provider" : "time");
      setProviders([]);
      setProvidersLoading(!!nextService.showProvider);
    },
    [activeServiceIndex, canSwitchService, serviceList],
  );

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
      name: activeService.name || "Service",
      price: getServicePriceLabel(activeService),
      duration: getServiceDuration(activeService),
      description: serviceDescription(activeService),
      imageUrl: activeService.image?.trim() || undefined,
    }),
    [activeService],
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
          serviceId: activeService.id,
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
    [activeService.id, businessSlug, businessId],
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

  const handleSubmit = useCallback(
    async (
      mode: "login" | "guest" | "logged-in",
      slotOverride?: AvailableSlot,
    ) => {
      const activeSlot = slotOverride ?? selectedSlot;
      if (!activeSlot || !selectedDate) return;
      setSubmitting(true);
      setSubmitError(null);

      try {
        const bookingTime: BookingTime = {
          start: activeSlot.start,
          end: activeSlot.end,
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
            serviceId: activeService.id,
            firstName,
            lastName,
            email: regEmail.trim(),
            phone: regPhone.trim(),
            bookingTime,
            notes: regNotes.trim() || undefined,
          };

          await createContact(payload, businessSlug, businessId);
          setShowSuccess(true);
          return;
        }

        let activeUserId = customerSession.user?.id;

        if (!isCustomerLoggedIn && mode === "login") {
          if (!loginEmail.trim() || !loginPassword.trim()) {
            setSubmitError("Please enter your email and password.");
            return;
          }

          const loginResponse = await login({
            email: loginEmail.trim(),
            password: loginPassword,
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
          activeUserId = user.id;
        }

        if (activeService.showProvider && !selectedProvider?.id) {
          setSubmitError("Please select a provider.");
          return;
        }

        if (!activeUserId) {
          setSubmitError("You must be signed in to book.");
          return;
        }

        const bookingPayload: CreateBookingPayload = {
          userId: activeUserId,
          serviceId: activeService.id,
          serviceProviderId: selectedProvider?.id || undefined,
          bookingTime,
          status: "Pending",
          confirmationMethod: "Email",
          bookingSource: "Website",
          customerNotes: regNotes.trim() || undefined,
        };

        await createBooking(bookingPayload, businessSlug, businessId);
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
      activeService.id,
      activeService.showProvider,
      selectedProvider?.id,
      businessSlug,
      businessId,
      isCustomerLoggedIn,
      customerSession.user?.id,
      handleError,
      setSession,
    ],
  );

  const handleSelectSlot = useCallback(
    (slot: AvailableSlot) => {
      if (submitting) return;
      setSelectedSlot(slot);
    },
    [submitting],
  );

  const handleConfirmTime = useCallback(() => {
    if (!selectedDate || !selectedSlot || submitting) return;
    completeStep("time");
    if (isCustomerLoggedIn) {
      handleSubmit("logged-in", selectedSlot);
      return;
    }
    setStep("client");
  }, [
    selectedDate,
    selectedSlot,
    submitting,
    completeStep,
    isCustomerLoggedIn,
    handleSubmit,
  ]);

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

  const handleClose = useCallback(() => {
    closeModal();
    onClose();
  }, [closeModal, onClose]);

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
      className="flex flex-col"
      style={{ backgroundColor: B.paper, color: B.ink }}
    >
      {/* Forbidden error message */}
      {forbiddenError && (
        <div
          className="p-4 m-4 rounded-lg border text-sm font-medium flex items-start gap-3 justify-between"
          style={{
            borderColor: "rgba(185,28,28,0.25)",
            backgroundColor: "rgba(185,28,28,0.08)",
            color: "#b91c1c",
          }}
        >
          <div>
            <p className="font-bold mb-1">Access Required</p>
            <p>{forbiddenError}</p>
            <p className="text-xs mt-2 opacity-75">
              Please log in or register to continue
            </p>
          </div>
          <button
            onClick={() => {
              setForbiddenError(null);
              setIsLogin(true);
              setStep("client");
            }}
            className="flex-shrink-0 text-sm font-bold hover:underline"
          >
            Sign In
          </button>
        </div>
      )}

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
          onMouseEnter={(e) => (e.currentTarget.style.color = B.ink)}
          onMouseLeave={(e) => (e.currentTarget.style.color = B.muted)}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: B.muted }}>
            Our time:{" "}
            <span style={{ color: B.ink }}>{sydneyTime} Australia/Sydney</span>
          </span>
          <button
            onClick={handleClose}
            className="p-2 rounded border transition-colors"
            style={{ borderColor: B.border, color: B.muted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = B.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = B.muted)}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
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
              key={`time-${activeService.id}`}
              service={serviceInfo}
              selectedProvider={selectedProvider}
              selectedDate={selectedDate}
              selectedSlotStart={selectedSlot?.start || null}
              availableSlots={availableSlots}
              timeFormat={timeFormat}
              slotsLoading={slotsLoading}
              slotsError={slotsError}
              submitting={submitting}
              confirmLabel={
                isCustomerLoggedIn ? "Confirm Booking" : "Confirm Time"
              }
              onSelectDate={handleSelectDate}
              onSelectSlot={handleSelectSlot}
              onConfirm={handleConfirmTime}
              canSwitchService={canSwitchService}
              serviceIndex={activeServiceIndex}
              serviceCount={serviceList.length}
              onPrevService={() => handleServiceSwitch("prev")}
              onNextService={() => handleServiceSwitch("next")}
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
