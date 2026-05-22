import { Service, ServiceProviderSummary } from "@/types";

export interface ServiceInfo {
  name: string;
  price: string;
  duration: string;
  description?: string;
  imageUrl?: string;
}

export interface Provider {
  id: string;
  name: string;
  title: string;
  imageUrl?: string;
}

export type Step = "provider" | "time" | "client";

export interface StepMeta {
  key: Step;
  label: string;
  sub?: string;
}

export interface BookingFormProps {
  service: Service;
  services?: Service[];
  businessSlug: string;
  businessId: string;
  onClose: () => void;
  heroImageUrl?: string;
  businessName?: string;
  variant?: "light" | "dark";
}

export interface BookingState {
  step: Step;
  completedSteps: Step[];
  selectedProvider: Provider | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  isLogin: boolean;
  showPass: boolean;
  loginEmail: string;
  loginPassword: string;
  regName: string;
  regEmail: string;
  regPhone: string;
  agreed: boolean;
  subscribe: boolean;
  submitting: boolean;
  showSuccess: boolean;
}

export function mapServiceProviderToProvider(
  sp: ServiceProviderSummary,
): Provider {
  const name = [sp.firstName, sp.lastName].filter(Boolean).join(" ") || "Provider";
  return {
    id: sp.id,
    name,
    title: sp.description || "Service Provider",
    imageUrl: sp.impUrl,
  };
}
