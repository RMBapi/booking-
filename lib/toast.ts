import { toast as hotToast } from "react-hot-toast";
import { ELEGANZA } from "@/lib/publicBrand";

const baseStyle = {
  background: ELEGANZA.surface,
  color: ELEGANZA.ink,
  border: `1px solid ${ELEGANZA.border}`,
  borderRadius: "12px",
  padding: "12px 16px",
  maxWidth: "420px",
} as const;

export const success = (message: string, options?: { duration?: number }) => {
  return hotToast.success(message, {
    duration: options?.duration ?? 2500,
    position: "top-right",
    style: baseStyle,
    iconTheme: { primary: ELEGANZA.accent, secondary: "#ffffff" },
  });
};

export const error = (message: string, options?: { duration?: number }) => {
  return hotToast.error(message, {
    duration: options?.duration ?? 3000,
    position: "top-right",
    style: baseStyle,
    iconTheme: { primary: "#B91C1C", secondary: "#ffffff" },
  });
};

export const loading = (message: string) => {
  return hotToast.loading(message, {
    position: "top-right",
    style: baseStyle,
    iconTheme: { primary: ELEGANZA.accent, secondary: "#ffffff" },
  });
};

export const dismiss = (toastId: string) => {
  return hotToast.dismiss(toastId);
};
