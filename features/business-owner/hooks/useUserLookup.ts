import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { lookupUserByEmail, searchUsers } from "@/services";
import type { UserLookupResult } from "@/types";

/**
 * Loose RFC 5322-ish check — enough to gate the lookup query on a fully-
 * formed address so we don't fire a request for every keystroke.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /user/lookup?email=... — returns the matched customer or null on
 * 404. The query is gated on a syntactically-valid email so the modal
 * can call this hook on every change without hammering the BE.
 */
export const useLookupUserByEmail = (businessId: string, email: string) => {
  const trimmed = email.trim().toLowerCase();
  const enabled = !!businessId && EMAIL_RE.test(trimmed);

  return useQuery<UserLookupResult | null>({
    queryKey: ["user-lookup", businessId, trimmed],
    queryFn: async () => {
      try {
        const res = await lookupUserByEmail(trimmed, businessId);
        return res.data?.data ?? null;
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  });
};

/**
 * GET /user/search?q=... for the email-step autocomplete dropdown.
 * Disabled below 2 chars (matches the BE's own short-circuit). The
 * caller is expected to debounce its `query` prop.
 */
export const useSearchUsers = (businessId: string, query: string) => {
  const q = query.trim();
  const enabled = !!businessId && q.length >= 2;

  return useQuery<UserLookupResult[]>({
    queryKey: ["user-search", businessId, q],
    queryFn: async () => {
      const res = await searchUsers(q, businessId);
      return res.data?.data ?? [];
    },
    enabled,
    staleTime: 15_000,
  });
};
