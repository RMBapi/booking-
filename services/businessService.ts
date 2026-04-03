/**
 * Business Service — public endpoints only.
 */

export const getBusinessBySlug = async (slug: string) => {
  const response = await fetch(`/api/business/slug/${slug}`);
  return response.json();
};
