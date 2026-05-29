const VIDEO_EXTENSIONS = [".mp4"];

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function isVideoFile(file: File): boolean {
  return file.type === "video/mp4";
}
