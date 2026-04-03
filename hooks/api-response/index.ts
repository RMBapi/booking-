import { useApiSuccess } from "./useApiSuccess";
import { useApiError } from "./useApiError";

export const useApiResponse = () => {
  return {
    ...useApiSuccess(),
    ...useApiError(),
  };
};

export * from "./useApiError";
export * from "./useApiSuccess";
