/**
 * Public-endpoint helper used by the httpClient 401 interceptor.
 * These endpoints don't require an Authorization header and shouldn't
 * trigger refresh-and-retry on 401 (they fail with 401 by design when
 * credentials are wrong).
 */

const PUBLIC_ENDPOINT_FRAGMENTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/business/slug",
  "/invitations/",
  "/activation/",
] as const;

export function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINT_FRAGMENTS.some((frag) => url.includes(frag));
}
