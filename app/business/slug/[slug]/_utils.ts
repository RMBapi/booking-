import { Service } from "@/types";

export const formatPrice = (price: number) => {
  if (Number.isNaN(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
};

export const getServiceDuration = (service: Service) => {
  const s = service as Service & {
    durationMinutes?: number;
    duration?: number;
    durationInMinutes?: number;
  };
  const dur = s.durationMinutes ?? s.duration ?? s.durationInMinutes;
  if (typeof dur === "number" && Number.isFinite(dur) && dur > 0) {
    return `${Math.round(dur)} min`;
  }
  return "Flexible";
};

export const titleCase = (v: string) =>
  v
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

export const serviceDescription = (service: Service) => {
  const raw = service.description?.trim() || "";
  if (!raw || /^\d+(\.\d+)?$/.test(raw)) {
    return "A premium service tailored to your needs with expert care and attention to detail.";
  }
  return raw;
};
