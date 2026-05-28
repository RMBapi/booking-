/**
 * Media URL helpers — images and MP4 videos share the same storage fields.
 */

const VIDEO_EXTENSIONS = [".mp4"] as const;

/** Returns true when the URL points to an MP4 video. */
export function isVideoUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const path = value.split("?")[0].split("#")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** Resolve a media URL from the API (images or videos). */
export function getMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return value;
}
