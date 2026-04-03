import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getAllBookings } from "@/services";
import { ApiSuccessResponse, Booking, BookingListQuery } from "@/types";

export const useGetBookings = (
  businessId: string,
  params?: BookingListQuery
) => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<Booking[]>>>({
    queryKey: ["bookings", businessId, params],
    queryFn: () => getAllBookings(params, businessId),
    enabled: !!businessId,
  });

  const bookings = response?.data?.data || [];
  const meta = response?.data?.meta;

  return { isLoading, bookings, meta, error, refetch };
};
