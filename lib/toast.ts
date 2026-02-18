import { toast as hotToast } from "react-hot-toast";

export const success = (message: string, options?: { duration?: number }) => {
  return hotToast.success(message, {
    duration: options?.duration || 5000,
    position: "top-right",
    style: {
      background: "#10B981",
      color: "#fff",
      borderRadius: "8px",
      padding: "12px 16px",
      maxWidth: "400px",
    },
  });
};

export const error = (message: string, options?: { duration?: number }) => {
  return hotToast.error(message, {
    duration: options?.duration || 5000,
    position: "top-right",
    style: {
      background: "#EF4444",
      color: "#fff",
      borderRadius: "8px",
      padding: "12px 16px",
      maxWidth: "400px",
    },
  });
};

export const loading = (message: string) => {
  return hotToast.loading(message);
};

export const dismiss = (toastId: string) => {
  return hotToast.dismiss(toastId);
};
