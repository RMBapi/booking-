import { AxiosResponse } from "axios";
import * as toast from "@/lib/toast";

type ApiSuccess = {
  message: string;
  statusCode: number;
};

export const useApiSuccess = () => {
  function handleSuccess(
    apiResponse: AxiosResponse<ApiSuccess> | string,
    options?: { duration?: number }
  ) {
    const toastOptions = { duration: options?.duration || 5000 };

    if (typeof apiResponse === "string") {
      return toast.success(apiResponse, toastOptions);
    }

    const message = apiResponse.data?.message || "Success";
    toast.success(message, toastOptions);
  }

  return { handleSuccess };
};
