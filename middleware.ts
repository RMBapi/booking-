import { NextRequest, NextResponse } from "next/server";

/**
 * UX-only guard. Real auth is the JWT on every API call. The has_session
 * cookie is non-httpOnly and carries no security value — it just lets us
 * skip the unauthenticated flash for protected pages.
 */

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/activate",
  "/accept-invitation",
  "/_next",
  "/favicon.ico",
  "/api",
];

const PROTECTED_PREFIXES = ["/app", "/super-admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const hasSession = req.cookies.get("has_session")?.value === "1";
    if (!hasSession) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
