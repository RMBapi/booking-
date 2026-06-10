import type { SocialAccount, SocialAccounts, SocialPlatform } from "@/types";

/**
 * Social-account helpers. The backend stores a JSONB array of
 * `{ platform, url }`; the CRM edits one URL field per supported platform and
 * rebuilds the array on save (filled fields only). See docs:
 * social-accounts-integration.md.
 */

/** Supported platforms today. Any other value is rejected by the API (400). */
export const SOCIAL_PLATFORMS: { platform: SocialPlatform; label: string }[] = [
  { platform: "facebook", label: "Facebook" },
  { platform: "instagram", label: "Instagram" },
];

export const SOCIAL_URL_MAX = 500;

/** Pull the stored URL for a platform, or "" if not set. */
export function getSocialUrl(
  accounts: SocialAccounts | null | undefined,
  platform: SocialPlatform,
): string {
  return accounts?.find((a) => a.platform === platform)?.url ?? "";
}

/**
 * Build the API array from per-platform URL inputs, keeping only filled fields
 * (trimmed). Preserves SOCIAL_PLATFORMS order.
 */
export function buildSocialAccounts(
  urls: Partial<Record<SocialPlatform, string>>,
): SocialAccounts {
  const result: SocialAccount[] = [];
  for (const { platform } of SOCIAL_PLATFORMS) {
    const url = urls[platform]?.trim();
    if (url) result.push({ platform, url });
  }
  return result;
}
