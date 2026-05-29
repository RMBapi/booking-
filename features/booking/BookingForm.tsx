"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Service } from "@/types";
import { B } from "./constants";
import {
  getSydneyTime,
  getServicePriceLabel,
  getServiceDuration,
  serviceDescription,
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

export const BookingForm: React.FC<BookingFormProps> = ({
  service,
  onClose,
  heroImageUrl,
}) => {
  const providers = useMemo<Provider[]>(() => {
    if (!service.showProvider || !service.providers?.length) return [];
    return service.providers.map(mapServiceProviderToProvider);
  }, [service.showProvider, service.providers]);

  const hasProviders = providers.length > 0;

  const initialStep: Step = hasProviders ? "provider" : "time";

  const [step, setStep] = useState<Step>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Step[]>(
    hasProviders ? [] : ["provider"],
  );
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sydneyTime, setSydneyTime] = useState(getSydneyTime);

  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      imageUrl: service.image ?? undefined,
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
      completeStep("provider");
      setStep("time");
    },
    [completeStep],
  );

  const handleSelectDate = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  const handleSelectTime = useCallback((t: string) => {
    setSelectedTime(t);
  }, []);

  const handleConfirmTime = useCallback(() => {
    if (!selectedDate || !selectedTime) return;
    completeStep("time");
    setStep("client");
  }, [selectedDate, selectedTime, completeStep]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => onClose(), 2200);
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (step === "provider" || (step === "time" && !hasProviders)) {
      onClose();
    } else if (step === "time") {
      setStep("provider");
    } else if (step === "client") {
      setStep("time");
    }
  }, [step, hasProviders, onClose]);

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
        selectedDate && selectedTime
          ? `${selectedDate.toLocaleDateString("en-AU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })} ${selectedTime}`
          : undefined,
    });
    steps.push({ key: "client", label: "CLIENT" });
    return steps;
  }, [hasProviders, selectedProvider, selectedDate, selectedTime]);

  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (showSuccess) {
    return (
      <SuccessView
        service={serviceInfo}
        selectedProvider={selectedProvider}
        dateStr={dateStr}
        selectedTime={selectedTime}
      />
    );
  }

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
              selectedTime={selectedTime}
              onSelectDate={handleSelectDate}
              onSelectTime={handleSelectTime}
              onConfirm={handleConfirmTime}
            />
          )}
          {step === "client" && (
            <ClientStep
              key="client"
              service={serviceInfo}
              selectedProvider={selectedProvider}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              isLogin={isLogin}
              showPass={showPass}
              loginEmail={loginEmail}
              loginPassword={loginPassword}
              regName={regName}
              regEmail={regEmail}
              regPhone={regPhone}
              agreed={agreed}
              subscribe={subscribe}
              submitting={submitting}
              onToggleLogin={setIsLogin}
              onToggleShowPass={() => setShowPass((p) => !p)}
              onLoginEmailChange={setLoginEmail}
              onLoginPasswordChange={setLoginPassword}
              onRegNameChange={setRegName}
              onRegEmailChange={setRegEmail}
              onRegPhoneChange={setRegPhone}
              onToggleAgreed={() => setAgreed((a) => !a)}
              onToggleSubscribe={() => setSubscribe((s) => !s)}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
