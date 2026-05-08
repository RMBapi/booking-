/**
 * Tiny cookie helpers — avoids pulling cookie-parser as a dependency.
 *
 * Only used for the refresh-token cookie. If the app starts using cookies
 * for more flows, swap to cookie-parser middleware.
 */

import type { Request, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'cb_rt';

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const parts = header.split(';');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export interface SetCookieOptions {
  maxAgeSeconds: number;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
}

export function setRefreshCookie(
  res: Response,
  value: string,
  opts: SetCookieOptions,
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = opts.sameSite ?? 'lax';

  // SameSite=None requires Secure; force Secure when sameSite is 'none'.
  const secure = isProd || sameSite === 'none';

  const attrs = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    `Path=${opts.path ?? '/'}`,
    'HttpOnly',
    `SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`,
  ];
  if (secure) attrs.push('Secure');

  // Append rather than set so we don't clobber any other Set-Cookie headers.
  appendSetCookie(res, attrs.join('; '));
}

export function clearRefreshCookie(res: Response): void {
  appendSetCookie(
    res,
    `${REFRESH_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
  );
}

function appendSetCookie(res: Response, header: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', header);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, header]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), header]);
  }
}
