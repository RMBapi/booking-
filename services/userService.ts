import { http } from "@/lib";
import { UserLookupResult } from "@/types";

/**
 * User lookup endpoints used by the CRM "Create booking" flow.
 *
 * Both routes require:
 * - Authorization: Bearer {token}
 * - x-business-id: {businessId}
 * - the caller's membership having the `view_bookings` permission.
 */

/**
 * GET /user/lookup?email=... — case-insensitive, trimmed server-side.
 * 404 means no match; the FE should branch into the guest path.
 */
export const lookupUserByEmail = async (
  email: string,
  businessId: string,
) => {
  return http.get<{ data: UserLookupResult }>(
    `/user/lookup?email=${encodeURIComponent(email)}`,
    { headers: { "x-business-id": businessId } },
  );
};

/**
 * GET /user/search?q=... — partial match on email/firstName/lastName,
 * up to 10 results. The BE returns [] for queries shorter than 2 chars.
 */
export const searchUsers = async (q: string, businessId: string) => {
  return http.get<{ data: UserLookupResult[] }>(
    `/user/search?q=${encodeURIComponent(q)}`,
    { headers: { "x-business-id": businessId } },
  );
};
