import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getAllContacts } from "@/services";
import { ApiSuccessResponse, Contact, ContactListQuery } from "@/types";

export const useGetContacts = (
  businessId: string,
  params?: ContactListQuery
) => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<Contact[]>>>({
    queryKey: ["contacts", businessId, params],
    queryFn: () => getAllContacts(params, businessId),
    enabled: !!businessId,
  });

  const contacts = response?.data?.data || [];
  const meta = response?.data?.meta;

  return { isLoading, contacts, meta, error, refetch };
};
