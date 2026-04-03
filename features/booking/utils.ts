import { Service } from "@/types";

export function getSydneyTime(): string {
  return new Date().toLocaleTimeString("en-AU", {
    timeZone: "Australia/Sydney",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export const formatPrice = (price: unknown) => {
  const num = typeof price === "number" ? price : Number(price);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
};

export const getServiceDuration = (service: Service) => {
  const s = service as Service & {
    durationMinutes?: number;
    duration?: number | string;
    durationInMinutes?: number;
  };
  const dur = s.durationMinutes ?? s.duration ?? s.durationInMinutes;
  if (typeof dur === "number" && Number.isFinite(dur) && dur > 0) {
    return `${Math.round(dur)} min`;
  }
  if (typeof dur === "string" && dur.trim()) return dur;
  return "Flexible";
};

export const serviceDescription = (service: Service) => {
  const raw = service.description?.trim() || "";
  if (!raw || /^\d+(\.\d+)?$/.test(raw)) {
    return "A premium service tailored to your needs with expert care and attention to detail.";
  }
  return raw;
};

export const getServicePriceLabel = (service: Service) => {
  const s = service as Service & { priceDisplayMode?: boolean | string };
  if (s.priceDisplayMode === false) return "Custom";
  return formatPrice(service.price);
};

export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatSlotTime(
  isoTime: string,
  timeFormat: "12" | "24" = "12",
  timeZone?: string,
): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12",
  };
  if (timeZone) options.timeZone = timeZone;
  return new Date(isoTime).toLocaleTimeString("en-AU", options);
}
