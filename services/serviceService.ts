/**
 * Service Service — public endpoints only.
 */

export const getPublicServicesByBusinessSlug = async (
  slug: string,
  params?: { page?: number; limit?: number }
) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.limit) queryParams.set("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/business/slug/${slug}/services${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch services: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      /* use default message */
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getServiceProviders = async (
  businessSlug: string,
  serviceId: string,
) => {
  const url = `/api/business/slug/${businessSlug}/services/${serviceId}/providers`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch providers: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      /* use default message */
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
