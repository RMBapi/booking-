/**
 * Server-side timing logger.
 *
 * The public business page is server-rendered, so its data fetching happens
 * via `fetch()` in React Server Components — NOT through the axios `http`
 * client (which `httpLogger` instruments). This utility traces how long the
 * backend takes to respond and how long the server spends rendering, so you
 * can see "BE responded in X ms, server total Y ms" right in the terminal.
 *
 * Output goes to the server console (your `next dev` / `next start` terminal).
 *
 * Enable in production by setting ENABLE_SERVER_TIMING=true. In development it
 * is always on.
 */

const enabled =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_SERVER_TIMING === "true";

/** Color a duration green/yellow/red by how slow it is (terminal ANSI). */
function colorize(ms: number, text: string): string {
  // Skip ANSI colors when not attached to a TTY (e.g. piped logs).
  if (!process.stdout?.isTTY) return text;
  const RESET = "\x1b[0m";
  let color = "\x1b[32m"; // green  < 300ms
  if (ms >= 1000) color = "\x1b[31m"; // red   >= 1s
  else if (ms >= 300) color = "\x1b[33m"; // yellow >= 300ms
  return `${color}${text}${RESET}`;
}

function format(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;
}

interface TimingMeta {
  status?: number;
  ok?: boolean;
  note?: string;
}

/**
 * Measure an async operation (e.g. a backend fetch) and log its duration.
 * Returns whatever the wrapped function returns.
 *
 * @example
 *   const data = await measureServer("fetchBusiness", () => fetch(url), {
 *     metaFromResult: (res) => ({ status: res.status, ok: res.ok }),
 *   });
 */
export async function measureServer<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { metaFromResult?: (result: T) => TimingMeta },
): Promise<T> {
  if (!enabled) return fn();

  const start = performance.now();
  try {
    const result = await fn();
    const ms = performance.now() - start;
    const meta = options?.metaFromResult?.(result);
    logTiming(label, ms, meta);
    return result;
  } catch (error) {
    const ms = performance.now() - start;
    logTiming(label, ms, { ok: false, note: "threw" });
    throw error;
  }
}

/**
 * Manual timer for measuring a block of work (e.g. a whole page render) where
 * a wrapper function isn't convenient.
 *
 * @example
 *   const done = startTimer("PublicBusinessPage total");
 *   // ...do work...
 *   done({ note: slug });
 */
export function startTimer(label: string): (meta?: TimingMeta) => number {
  const start = performance.now();
  return (meta?: TimingMeta) => {
    const ms = performance.now() - start;
    if (enabled) logTiming(label, ms, meta);
    return ms;
  };
}

function logTiming(label: string, ms: number, meta?: TimingMeta) {
  const duration = colorize(ms, format(ms).padStart(7));
  const parts: string[] = [`[SSR TIMING] ${duration}  ${label}`];

  if (meta?.status !== undefined) parts.push(`(${meta.status})`);
  else if (meta?.ok === false) parts.push("(failed)");
  if (meta?.note) parts.push(`— ${meta.note}`);

  // eslint-disable-next-line no-console
  console.log(parts.join(" "));
}
