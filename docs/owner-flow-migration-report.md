# Owner-onboarding flow migration report

Run date: 2026-05-06

This pass split the previous one-shot Super_Admin → owner-with-business
flow into discrete stages. The new sequence is:

1. Super_Admin creates the user with a known password (inactive, no business).
2. Super_Admin flips the activation toggle.
3. Owner logs in with the admin-supplied password — `passwordChangeRequired: true`.
4. Owner calls `POST /auth/change-password` to set their own password.
5. Owner calls `POST /business/onboarding` to create their business.

---

## Files modified

| Path | Why |
| ---- | --- |
| `prisma/schema.prisma` | Added `User.passwordChangeRequired` |
| `src/module/admin/admin.controller.ts` | New body + new activation toggle endpoint |
| `src/module/admin/admin.service.ts` | Stripped business/userBusiness/invitation/email; added `setBusinessOwnerActivation`; included `passwordChangeRequired` in projections |
| `src/module/admin/admin.module.ts` | Removed unused `MailModule` import |
| `src/module/admin/dto/create-business-owner.dto.ts` | Replaced with `{ firstName, lastName, email, phone, password, confirmPassword }` |
| `src/module/auth/auth.controller.ts` | New `POST /auth/change-password` route |
| `src/module/auth/auth.service.ts` | `changePassword()`, login surfaces `passwordChangeRequired`, `getMe` includes the flag, login error message clarified, password compare runs *before* `isActive` check (timing-equalised) |
| `src/module/auth/auth.service.spec.ts` | Extended for `passwordChangeRequired` and inactive-login coverage |
| `src/module/auth/dto/auth-response.dto.ts` | Added `passwordChangeRequired` field |
| `src/module/auth/dto/me-response.dto.ts` | Added `passwordChangeRequired` field |
| `src/module/business/business.controller.ts` | New `POST /business/onboarding` route |
| `src/module/business/business.service.ts` | New `onboardOwnBusiness()` method |
| `docs/rbac.md` | One-paragraph note on `passwordChangeRequired` |
| `docs/frontend-integration.md` | New §1c (change password) + new §12 (full onboarding flow) |

## Files created

| Path | Why |
| ---- | --- |
| `prisma/migrations/20260506000000_add_password_change_required/migration.sql` | Adds the column with `default false` |
| `src/module/admin/dto/set-activation.dto.ts` | Body for the activation toggle endpoint |
| `src/module/auth/dto/change-password.dto.ts` | Body for `POST /auth/change-password` |
| `src/module/business/dto/create-own-business.dto.ts` | Body for `POST /business/onboarding` (stricter slug validation) |
| `src/module/admin/admin.service.spec.ts` | Unit tests for `createBusinessOwner` + `setBusinessOwnerActivation` |
| `src/module/auth/auth.change-password.spec.ts` | Unit tests for `changePassword` |
| `src/module/business/business-onboarding.spec.ts` | Unit tests for `onboardOwnBusiness` |

## Files deleted

None. The previous admin code was consolidated into the existing files,
and the admin module's `MailModule` import was dropped (no email is sent
in this flow).

---

## Migration

`20260506000000_add_password_change_required`:

```sql
ALTER TABLE "users"
  ADD COLUMN "password_change_required" BOOLEAN NOT NULL DEFAULT false;
```

Existing rows pick up the `false` default automatically — no extra
backfill needed. Safe to run on prod under traffic; the column is
non-nullable but has a constant default, so PG holds a brief ACCESS
EXCLUSIVE on the table while it rewrites the catalog (no row rewrite
required on PG ≥ 11).

---

## New / changed endpoints

### `POST /admin/business-owners` (rewritten)

Guards: `JwtAuthGuard` + `SuperAdminGuard`.

Request:
```json
{
  "firstName": "Jane",
  "lastName":  "Doe",
  "email":     "jane@acme.com",
  "phone":     "+61400000000",
  "password":         "min-8-chars",
  "confirmPassword":  "min-8-chars"
}
```
Response 201:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Business owner created. Share the password securely with the user.",
  "data": {
    "user": {
      "id", "firstName", "lastName", "email", "phone",
      "isActive": false,
      "systemRole": "Business_owner",
      "passwordChangeRequired": true,
      "createdAt", "updatedAt"
    }
  }
}
```
Errors: 400 (mismatched passwords), 409 (email already exists), 403 (not Super_Admin).

### `PATCH /admin/business-owners/:id/activation` (new)

Guards: `JwtAuthGuard` + `SuperAdminGuard`.
Request: `{ "isActive": boolean }`
Response 200:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business owner activated" /* or "deactivated" */,
  "data": { "user": { /* same projection as above */ } }
}
```
Errors: 404 (id is not an active `Business_owner`).

### `POST /auth/change-password` (new)

Guards: `JwtAuthGuard` (already global). Rate limit: `@Throttle 5/min`.
Request:
```json
{
  "currentPassword": "...",
  "newPassword":     "min-8-chars",
  "confirmPassword": "min-8-chars"
}
```
Response 200:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password updated successfully",
  "data": {
    "accessToken": "<fresh-jwt>",
    "user": {
      "id", "firstName", "lastName", "email",
      "systemRole",
      "passwordChangeRequired": false
    }
  }
}
```
Side effects: every other refresh-token family for this user is revoked;
a fresh `cb_rt` cookie is set so the calling tab continues without re-login.
Errors: 401 (wrong current password), 400 (mismatch / new equals current), 429 (rate limited).

### `POST /business/onboarding` (new)

Guards: `JwtAuthGuard` + explicit `systemRole === 'Business_owner'` check
inside the controller.
Request:
```json
{
  "name":  "Acme Salon",            // 2–100 chars
  "slug":  "acme-salon",            // /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 2–50 chars
  "email": "hello@acme.com",        // optional
  "phone": "+61...",                 // optional
  "address": "...",                  // optional
  "description": "...",              // optional
  "logo":  "https://...",            // optional
  "image": "https://..."             // optional
}
```
Response 201:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Business created successfully",
  "data": {
    "business": {
      "id", "name", "slug",
      "email", "phone", "address", "description",
      "logo", "image",
      "createdAt"
    }
  }
}
```
Errors: 403 (not Business_owner), 409 (caller already has a business OR
slug taken by an active business), 400 (validation).

### `POST /auth/login` (response shape extended)

Now includes `user.passwordChangeRequired: boolean`. Inactive users get
401 with `"Account is inactive. Contact your administrator."`

### `GET /auth/me` (response shape extended)

`user.passwordChangeRequired: boolean` added.

### `GET /admin/business-owners`, `GET /admin/business-owner/:id`

Each returned user object now includes `passwordChangeRequired`.

---

## Test count

- Before: 6 suites / 39 tests
- After:  9 suites / 56 tests

New / extended:
- `src/module/admin/admin.service.spec.ts` (5 tests, new file)
- `src/module/auth/auth.change-password.spec.ts` (5 tests, new file)
- `src/module/business/business-onboarding.spec.ts` (4 tests, new file)
- `src/module/auth/auth.service.spec.ts` (3 new tests for inactive login, login flag surfacing, /auth/me flag)

`npx tsc --noEmit` → 0 errors. `npm test` → 56/56 green.

---

## Decisions where the prompt was ambiguous

1. **`@Match()` decorator vs. manual confirmPassword check.** Picked manual
   service-layer checks. Reasons: (a) the codebase has no existing custom
   class-validator decorators — adding the first one would be a new pattern
   for the team; (b) we already needed service-layer validation in
   `changePassword()` for "new password ≠ current" (which class-validator
   can't compare cross-field against the DB), so confirmPassword being
   service-layer too keeps the validation pipeline consistent. Trade-off:
   the response is `400` from a NestJS `BadRequestException` instead of
   from `ValidationPipe`, so the body shape differs slightly from
   field-level validation errors. Acceptable for a security flow.

2. **Bcrypt rounds.** Stayed at `10` to match the rest of the codebase
   (registration, activation, etc.). The prior production-readiness
   report flagged 12 as the modern recommendation — out of scope here;
   bumping rounds is a separate one-shot rotation pass.

3. **Inactive login: when to check.** Spec says verify password first,
   then `isActive`. Implemented exactly that — the bcrypt compare runs
   before the active flag check, so an inactive account can't be
   distinguished from a wrong-password account by response timing.

4. **One business per onboarding endpoint.** Per the spec's default,
   `POST /business/onboarding` rejects with 409 if the caller already
   has a UserBusiness row. The check uses `userBusiness.findFirst({
   where: { userId, business: { deletedAt: null } } })` — a soft-deleted
   business doesn't count, so an owner whose business was deleted can
   onboard a fresh one. (Multi-business per owner is still possible
   through other paths — Super_Admin updates, team invitations to a
   second business — this endpoint just gates the *self-serve* path.)

5. **Slug validation strictness.** The spec gave the regex
   `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. The previous `BusinessService.create()`
   slugifies any input (lowercases, strips, hyphenates) and adds suffixes
   on collision. The new onboarding endpoint takes the slug **literally**
   — `Acme Salon!` would 400, not auto-slugify. This is the safer choice
   because it makes the URL the owner sees match what they typed, and
   it forces them to think about the public URL up front.

6. **Activation endpoint URL.** Used `PATCH /admin/business-owners/:id/activation`
   per the spec. `PATCH /admin/user/:id` (existing) can also flip
   `isActive`, but the dedicated endpoint exists for the dedicated
   activation-toggle UX as the spec requested.

7. **`passwordChangeRequired` always present in responses.** Picked
   "always include" over "include only when true" because it removes
   a frontend branch (`flag?? false` vs check-presence-then-value).

---

## Conflicts encountered

1. **`AdminService.createBusinessOwner` previously created Business +
   UserBusiness + BusinessInvitation in one transaction and called
   `MailService.sendInvitationEmail` for activation.** All four side
   effects were removed from this code path. The activation flow that
   consumed those invitation tokens (`/activation/:token`,
   `ActivationController`) is unchanged and still works for the
   team-invitation path documented in §7 of the FE doc.
2. **`MailService` import in `AdminModule` was dropped.** No other admin
   code path needed it; the import would now be dead.
3. **No existing tests had to be deleted.** The earlier admin spec
   didn't exist, and the auth specs were extended in place.

---

## Confirmed unchanged

- Team-invitation flow (`POST /business/:id/invitations`,
  `GET /invitations/:token`, `POST /invitations/:token/accept`,
  `POST /invitations/:token`-based register flow) is **untouched**.
  `InvitationService.create()`, `InvitationController`, and
  `ActivationController` still operate exactly as before; only the
  Super_Admin path stopped feeding into them.
- JWT payload remains `{ sub, email, systemRole }` — no new claim.
- The four-role taxonomy is unchanged.
- `/auth/me` schema is additive (new field, no removed fields).
- Existing `/auth/login` and `/auth/register` response shapes are
  additive (only `passwordChangeRequired` added; `accessToken`, `user.id`,
  etc. are all in the same place).
- Refresh-token rotation, reuse detection, and logout behaviour are
  unchanged. The new `changePassword()` method *adds* a refresh-family
  revocation step but does not modify the rotation primitives.

---

## Manual smoke test (expected results)

1. As Super_Admin: `POST /admin/business-owners` with valid body →
   `201`, `data.user.isActive: false, passwordChangeRequired: true`.
2. `PATCH /admin/business-owners/:id/activation { "isActive": true }` →
   `200`, `data.user.isActive: true`.
3. `POST /auth/login` as the new owner → `200`,
   `user.passwordChangeRequired: true`, `cb_rt` cookie set.
4. `POST /auth/change-password { current, new, confirm }` → `200`,
   fresh `accessToken`, rotated cookie, `user.passwordChangeRequired: false`.
5. `GET /auth/me` → `user.passwordChangeRequired: false`,
   `businesses: []`.
6. `POST /business/onboarding { name, slug, ... }` → `201`,
   `data.business.id` set.
7. `GET /auth/me` → `businesses: [{ id, name, slug, role:
   'Business_owner', permissions: [<all 14 features>] }]`.
8. `POST /business/onboarding` again → `409` "You already have a business
   …".
