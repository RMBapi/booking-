import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { updateBooking } from "@/services";
import { ApiSuccessResponse, Booking, BookingStatus } from "@/types";
import { useApiResponse } from "@/hooks";

type MutationResponse = AxiosResponse<ApiSuccessResponse<Booking>>;

type MutationVariables = {
  id: string;
  status: BookingStatus;
  businessId: string;
};

export const useUpdateBookingStatus = () => {
  const { handleSuccess, handleError } = useApiResponse();
  const queryClient = useQueryClient();

  const { isPending: isUpdating, mutate: updateStatus } = useMutation<
    MutationResponse,
    Error,
    MutationVariables
  >({
    mutationFn: ({ id, status, businessId }) =>
      updateBooking(id, { status }, businessId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.businessId] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  return { updateStatus, isUpdating };
};
