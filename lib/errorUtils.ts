/** Turn unknown thrown/rejected values into a readable message. */
export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || "Unknown error";
  }

  if (typeof error === "string") return error;

  if (error instanceof Event) {
    return "A resource failed to load. Please refresh the page.";
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) {
      return record.message;
    }
    if (typeof record.reason === "string" && record.reason) {
      return record.reason;
    }
  }

  return "An unexpected error occurred.";
}

/** Detect stale webpack / Next.js chunk errors common during dev hot reload. */
export function isStaleChunkError(error: unknown): boolean {
  const message = normalizeErrorMessage(error).toLowerCase();
  const stack =
    error instanceof Error && error.stack ? error.stack.toLowerCase() : "";

  const combined = `${message} ${stack}`;

  return (
    combined.includes("loading chunk") ||
    combined.includes("chunkloaderror") ||
    combined.includes("cannot find module") ||
    combined.includes("motion-dom") ||
    combined.includes("failed to fetch dynamically imported module") ||
    combined.includes("vendor-chunks") ||
    combined.includes("webpack-runtime") ||
    combined.includes("__webpack_modules__") ||
    (combined.includes("is not a function") &&
      (combined.includes("webpack") || combined.includes("module")))
  );
}
