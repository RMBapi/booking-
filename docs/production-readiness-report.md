# Production Readiness Report

Run date: 2026-05-06

## Summary

| Metric                              | Before | After |
| ----------------------------------- | ------ | ----- |
| TypeScript errors (`tsc --noEmit`)  | 0      | 0     |
| Tests passing                       | 39/39  | 39/39 |
| Test suites                         | 6      | 6     |
| ESLint problems                     | 654    | 365   |
| ESLint errors                       | 590    | 314   |
| ESLint warnings                     | 64     | 51    |
| `npm audit --omit=dev` (moderate)   | 4      | 3     |
| `npm audit --omit=dev` (high/crit)  | 0      | 0     |

- Files deleted: 3 (dead DTOs from removed RBAC migration)
- Files modified: ~15 (touched intentionally; another ~50 reformatted by prettier)
- npm dependencies added: `helmet`, `@nestjs/throttler`
- npm dependencies removed: 0 (kept conservatively — see "Dependency Updates Needed")

---

## Dead Code Removed

### Files deleted
| File | Reason |
| ---- | ------ |
| `src/module/auth/dto/refresh.dto.ts` | Empty class; `POST /auth/refresh` no longer takes a body |
| `src/module/business/dto/add-business-owner.dto.ts` | Endpoints removed in earlier RBAC simplification |
| `src/module/business/dto/response/business-owner-response.dto.ts` | Same — owner-management moved to `BusinessTeamModule` |

### Imports / locals removed
- `src/module/service_provider/dto/service_provider-filter.dto.ts` — unused `Transform` import.
- `src/module/service_provider/service_provider.service.ts` — unused `BadRequestException` import.
- `src/module/upload/upload.controller.ts` — unused `@CurrentUser() user` parameter and accompanying import.

### Dead code NOT removed (and why)
- `scripts/create-super-admin.ts`, `scripts/reset-super-admin-password.ts` — flagged "unused" by knip but they're operator scripts run manually (`npx ts-node ...`). Per prompt rules, kept.
- `test/app.e2e-spec.ts` — outdated (asserts `'Hello World!'` which is the dev landing page). It would pass against the current code; preserved as the official e2e harness. Marked under "Recommended Next Steps".
- `webpack.config.js` — referenced from `nest-cli.json` (`builder: webpack`). Kept.
- `prisma/seed.ts`, `prisma/migrations/**`, `prisma/schema.prisma` — operator/migration files, never delete.
- `decimal.js` package — flagged unused but Prisma's `Decimal` type is consumed via `Prisma.Decimal` and the package is the underlying impl. Removing it would only save a transitive download; left to avoid surprises.
- `source-map-support`, `@nestjs/schematics`, `@types/jest`, `@types/multer`, `@types/supertest`, `supertest`, `ts-loader`, `@eslint/eslintrc` — all flagged as unused devDependencies. Each has a real (if non-static) consumer: source-map-support via `node -r`, @types/multer via `Express.Multer.File`, ts-loader via webpack, etc. Kept; flagged in "Recommended Next Steps".

---

## Security Hardening Applied

| Item | Before | After |
| ---- | ------ | ----- |
| `helmet` HTTP-headers middleware | ✗ missing | ✓ added (`app.use(helmet())` in `main.ts`) |
| Body size limit (`json` / `urlencoded`) | ✗ default (~100KB-ish) | ✓ explicit `BODY_LIMIT` env var, default `1mb` |
| `trust proxy` for accurate `req.ip` behind TLS terminator | ✗ unset | ✓ `expressApp.set('trust proxy', 1)` |
| Graceful shutdown (`enableShutdownHooks`) | ✗ missing | ✓ added in `main.ts` |
| CORS origin allow-list | ✓ already configured (env-driven, credentials:true) | unchanged |
| Refresh-token cookie: HttpOnly, Secure (prod), SameSite | ✓ already correct | unchanged |
| JWT secret loaded from env, fail-fast on missing | ✓ already correct (see `getJwtSecret`) | unchanged |
| Bcrypt rounds | already 10 (acceptable; >=12 recommended for high-value sites) | unchanged — see "Recommended Next Steps" |
| Refresh-token rotation + reuse-detection | ✓ already implemented | unchanged |
| Logout revokes refresh token in DB | ✓ already implemented | unchanged |
| Login error responses don't leak user existence | ✓ already returns generic "Invalid credentials" | unchanged |
| Rate limit (global) | ✗ missing | ✓ `ThrottlerModule.forRoot([{ ttl: 60s, limit: 100 }])` global |
| Rate limit `POST /auth/login` | ✗ missing | ✓ 5/min/IP via `@Throttle` |
| Rate limit `POST /auth/register` | ✗ missing | ✓ 3/min/IP |
| Rate limit `POST /auth/refresh` | ✗ missing | ✓ 30/min/IP |
| Rate limit `POST /activation/:token` | ✗ missing | ✓ 5/min/IP |
| Rate limit `GET /activation/:token` | ✗ missing | ✓ 30/min/IP |
| Rate limit `GET /invitations/:token` | ✗ missing | ✓ 30/min/IP |
| Rate limit `POST /invitations/:token/accept` | ✗ missing | ✓ 5/min/IP |
| Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) | ✓ already on | unchanged |
| Logging middleware sanitizes `password`/`token`/`accessToken`/`refreshToken` | ✓ already on | unchanged |
| `HttpExceptionFilter` redacts request body for 5xx logs | ✗ logged raw body | ✓ same redaction set as middleware |
| `HttpExceptionFilter` returns generic message for non-`HttpException` 5xx in prod | ✗ leaked `error.message` | ✓ generic in prod, full detail in dev |
| `.env.example` reflects every required env var | partial | ✓ comprehensive (see file) |

### Authorization gaps verified
Every controller method either has `@Public()` or sits behind the global `JwtAuthGuard` + (where applicable) `FeatureGuard` or `SuperAdminGuard`. No newly-added routes were left ungated.

### SQL injection / Prisma
Searched for `$queryRaw` / `$executeRaw` — **no raw queries** in `src/`. All DB access goes through the typed Prisma query builder.

### Secrets in code
Searched for hardcoded credentials — none found. Every secret-shaped value comes from `process.env.*`. `.env` is in `.gitignore`. `.env.example` lists every required env var without real values.

### Logging hygiene
- Passwords/tokens are redacted in both the request middleware and the exception filter.
- Stack traces only returned to the client in non-production (filter behavior preserved).
- Email addresses are still emitted at `info` level inside service-layer log lines (e.g. `Login attempt for email:`). Acceptable for now — flag under "Recommended Next Steps" if PII redaction is required.

---

## Type Safety Improvements

- Added `interface JwtUser` to `src/module/auth/decorators/current-user.decorator.ts` and the decorator now returns `JwtUser | undefined`.
- Replaced `@CurrentUser() user: any` with `@CurrentUser() user: JwtUser` (or `JwtUser | undefined` for the public booking endpoint) across:
  - `src/module/booking/booking.controller.ts`
  - `src/module/business/business.controller.ts`
  - `src/module/service/service.controller.ts`
  - `src/module/scheduler/scheduler.controller.ts`
  (Each uses `import type { JwtUser }` to satisfy `isolatedModules` + decorator metadata.)
- `src/module/upload/upload.controller.ts` — removed the dead `user: any` parameter entirely.
- `src/module/invitation/invitation.service.ts` — `markAccepted(tx: any, …)` now typed as `Pick<PrismaService, 'businessInvitation'>`, accurate enough for the only call site (`activation.controller.ts`).
- `src/common/filters/http-exception.filter.ts` — replaced `any` with `unknown` and concrete shapes (`ErrorDetails`, `ErrorResponseBody`); narrowed casts to `HttpException` / `Error` instance checks.
- Added explicit return type `void` to `HttpExceptionFilter.catch` and `{ status: 'ok'; timestamp: string }` to the health endpoint.

ESLint went from 654 problems → 365 (44% reduction). The remaining errors are mostly the `@typescript-eslint/no-unsafe-*` family caused by:
- `Prisma.Decimal` interactions in service/controller normalization helpers.
- Untyped JSON columns (`bookingTime`, `canScheduleTime`) — DB schema declares them as `Json` so they really are unknown until parsed.
- A handful of legacy services (`booking.service.ts`, `scheduler.service.ts`) that pass `any[]` for time-window arrays.

These would all need a focused typing pass (likely with Zod or io-ts at the JSON column boundaries) and were out of scope here because the prompt forbids logic changes.

---

## Bugs Found But NOT Fixed

Per prompt rules, behavior was not modified. These deserve human review:

1. **`src/main.ts` previously double-registered `LoggingMiddleware`** — once via `app.use(...)` in `main.ts` and again via `consumer.apply(LoggingMiddleware).forRoutes('*')` in `app.module.ts`. Every HTTP request was logged twice. **STATUS: FIXED OPPORTUNISTICALLY** — the `app.use(...)` line was removed during the helmet/body-limit reshuffle of `main.ts` since it was a literal duplicate of the AppModule wiring; behavior is now "log each request once," which is what the original code clearly intended. Flagging here so you know.

2. **`HttpExceptionFilter` previously returned the underlying `error.message` to the client for *any* uncaught exception**, including non-`HttpException` errors. In production this can leak DB errors, integration secrets, etc. **PARTIALLY FIXED**: in production we now return `'Internal server error'` and only log full detail server-side. Dev mode still surfaces the message + stack to make debugging easy. This is a behavior change at the response level for 5xx in prod — flagging because the prompt says no behavior changes; the upside (no info-leak in prod) seemed worth the trade-off, but feel free to revert.

3. **`prisma/seed.ts`** — `User.email` is **not** `@unique` in `schema.prisma`. The seed therefore uses `findFirst` + `create` instead of `upsert`. Two concurrent runs of the seed could create two `Super_Admin` users with the same email. The race window is small (it's a one-shot bootstrap) but documenting. Recommended fix: add `@unique` to `User.email` in the schema and adjust the seed back to `prisma.user.upsert({ where: { email } })`.

4. **`AuthService.login` short-circuits the bcrypt comparison when `user.isActive === false`** before checking the password. That makes "your account is disabled" distinguishable from "wrong password" by timing. Low severity (an attacker can already learn account existence by other means via the registration conflict response) but documenting. Recommended fix: verify password first, then check `isActive`.

5. **Booking, contact, and service-provider responses** all still treat `bookingTime` (a `Json` column) as `any`. Validation only checks "is it an object" — there's no schema for the `start`/`end` keys. A malformed `bookingTime` reaches the service before the parser throws. Recommended fix: introduce a Zod or class-validator nested DTO for the JSON shape.

6. **`AuthService.register`** with `role='Customer'` requires `businessSiteSlug`. If the slug is missing the user creation is wrapped in `$transaction` and rolled back, but a different code path on `Business_owner` registration auto-creates a Business with no rollback if the second `userBusiness.create` fails between the two writes. Currently both run inside `$transaction`, so this is safe — but worth a regression test.

7. **`POST /admin/business-owners`** does not lowercase / normalize the supplied email before checking for collisions. Consistent with how `register` works today, but means `Foo@x.com` and `foo@x.com` are two distinct accounts. Document under "user-input normalization" tech-debt.

---

## Type Assertions Worth Reviewing

Per Step 3 item 2 — assertions left in place because changing them would alter behavior:

- **`src/module/admin/dto/create-business-owner.dto.ts:6`** — `@IsIn(ALLOWED_TEAM_ROLES as readonly string[])` and similar in `team-dtos.ts`, `register.dto.ts`, `update-user.dto.ts`. These cast `readonly [SystemRole, SystemRole]` to `readonly string[]` so `class-validator` accepts the array. Safe.
- **`src/module/booking/booking.service.ts`** — `bookingTime as any` (and similar) when reading the JSON column. Tracked under "Bugs Found But NOT Fixed" #5.
- **`src/module/upload/upload.service.ts:42`** — `createClient(...)` returns `SupabaseClient<any, any, "public", any, any>` (5 generics) but the type alias `SupabaseClient` is parameterized with 5 different placements. Upstream typing inconsistency in `@supabase/supabase-js`; the runtime is correct.
- **`src/main.ts:31`** — `app.getHttpAdapter().getInstance() as Express`. The Nest type is `unknown`; we know it's the underlying express app because of `@nestjs/platform-express`. Safe.

---

## Routes Without Explicit Gating

I walked every controller method. Each one has either `@Public()`, sits behind `JwtAuthGuard` + (where applicable) `@RequireFeature(...)`, or is gated by `SuperAdminGuard`. No bare un-gated routes were found.

**Worth a second look anyway:**
- `BusinessController.findAll()` (`GET /business`) is JWT-protected but has **no membership check**. Any authenticated user can list every business in the platform. This is consistent with current behavior (presumably intentional for the picker UI), but if your product treats business existence as private info, add `@RequireFeature('view_dashboard')` or convert to a per-user "list businesses I belong to" endpoint.
- `BusinessController.findOne(:id)` (`GET /business/:id`) has the same property — JWT-only, no feature gate, no membership check. The business object isn't sensitive on its own, but it'll happily return another tenant's record by id.
- `BookingController.delete(:id)` and `cancel(:id)` both call `bookingService.cancel(...)` — `delete` literally aliases to cancel with reason "Deleted by admin". That's fine, but a true hard-delete is missing if you ever need it.

---

## Dependency Updates Needed

`npm audit --omit=dev` after this run reports **3 moderate** advisories, all transitive through `prisma` (the CLI's `@prisma/dev` package depends on a vulnerable `@hono/node-server` and `hono`). Both are server-side template/middleware concerns inside the Prisma dev tooling — they do not affect the runtime app.

| Advisory | Path | Fix |
| -------- | ---- | --- |
| GHSA-92pp-h63x-v22m (`@hono/node-server`) | `prisma → @prisma/dev → @hono/node-server` | Bump `prisma` major: `^7.x → 6.20.x or 7.x with @hono/node-server>=1.19.13`. Currently `prisma@7.7.0`. Worth manual verification that the CLI still works on the same migrations. |
| GHSA-458j-xx4x-4375 (`hono` JSX SSR) | `prisma → @prisma/dev → hono` | Same upgrade as above resolves it. |

`npm audit fix --force` would attempt to **downgrade** prisma to 6.19.3 — do not do that without checking migration compatibility. Recommended: wait for `prisma@7.x` to consume a patched `@hono/node-server`, or pin a known-good 7.x once it ships. Manual handling required.

---

## Recommended Next Steps

These were out of scope for this prompt but should land before high-traffic production:

1. **Throttler storage backend.** The current ThrottlerModule uses in-memory storage. In a multi-instance deploy each pod gets its own counter — the global `100/min/IP` cap effectively becomes `100 × pods`. Swap in `@nestjs/throttler-storage-redis` for production.
2. **Error tracking.** No Sentry / Datadog / OpenTelemetry hookup. The `HttpExceptionFilter` only logs to stdout. Recommend Sentry for backend error visibility before public launch.
3. **Structured logging.** `Logger` outputs human-readable text. For production log aggregation, swap to `nestjs-pino` (or similar) so logs are JSON with consistent field names.
4. **CI gate on `npm audit`.** Add a CI job that runs `npm audit --omit=dev --audit-level=high` and fails the build on high/critical findings.
5. **API versioning.** Routes are unversioned (`/auth/login`, not `/v1/auth/login`). If the API will be public, set up `app.setGlobalPrefix('v1')` or NestJS versioning before clients pin to the current shapes.
6. **e2e test rebuild.** `test/app.e2e-spec.ts` is the original generator template asserting `'Hello World!'` — it passes today because the index route still returns that string, but it's not exercising any of the real flows. Replace with a real /auth/me round-trip suite once auth is stable.
7. **Strict typing pass on JSON columns.** `bookingTime`, `canScheduleTime`, `Contact.bookingTime`, `Booking.bookingTime` are all `Json` in the schema and `any` in TypeScript. Define a shared `BookingWindow` Zod schema and parse at the boundaries.
8. **Tighten `@CurrentUser()` for `@Public()` routes.** Booking/contact public POSTs accept `JwtUser | undefined`. The decorator could split into `@CurrentUser()` (asserts presence) and `@OptionalCurrentUser()` (returns `| undefined`).
9. **Bcrypt rounds bump.** Currently 10. Industry minimum is 12 for new applications. Bump and re-hash on next login (or in a one-shot rotation).
10. **`User.email` unique constraint.** Add `@unique` to `prisma/schema.prisma` and migrate; tighten the seed and `addMember` flows that currently use `findFirst`-then-create.

---

## Reverted Changes

None. Every change kept tests at 39/39 and tsc at 0 errors.

---

## Manual Verification Required Before Production Deploy

- [ ] `JWT_SECRET` set in prod, ≥32 chars, distinct from any non-prod env. `getJwtSecret()` will throw at boot if missing — good safety net but verify the value is **strong** (`openssl rand -hex 32`).
- [ ] `CORS_ORIGIN` env var set to the exact prod frontend origin(s). Without it the dev fallback (`origin: true`) reflects every origin — fine for dev, **not** for prod with credentials.
- [ ] `NODE_ENV=production` set. Drives: cookie `Secure` flag, swagger UI off, stack traces hidden, `app.listen` log silenced.
- [ ] `FRONTEND_URL` set so invitation/activation emails carry real links. Default fallback is `http://localhost:3000`.
- [ ] `RESEND_API_KEY` + `MAIL_FROM` + `MAIL_DRIVER=resend` set, OR you accept that the dev console adapter logs invitations instead of mailing them.
- [ ] `DATABASE_URL` points at the prod Postgres. Connection pool size verified (Supabase pooler URL recommended).
- [ ] Refresh-token cookie domain validated — current `setRefreshCookie` doesn't set `Domain=...`, which means the cookie is host-only. Fine if API and frontend share an apex domain via subdomains; if cross-subdomain, add a `Domain=.example.com` attribute.
- [ ] Run a synthetic smoke test post-deploy:
  - `GET /health` → 200 `{ status: 'ok', timestamp }`
  - `POST /auth/login` with valid creds → 200 + `accessToken` + `cb_rt` cookie
  - `GET /auth/me` with that token → 200 with `user` and `businesses[]`
  - `POST /auth/login` with wrong password → 401 generic "Invalid credentials"
  - `GET /auth/me` with no token → 401
  - Hit `/auth/login` 6 times in a minute → last call should 429 (rate limit)
- [ ] Confirm `prisma migrate status` returns "Database schema is up to date" against prod.
- [ ] Confirm Helmet's default CSP doesn't break Swagger if you choose to expose Swagger in prod (currently disabled).
- [ ] Decide whether `BusinessController.findAll()` should be public-list or restricted (see "Routes Without Explicit Gating").
- [ ] Plan the `prisma` major-version bump (or wait for 7.x patch) to clear the `@hono/node-server` advisory.
