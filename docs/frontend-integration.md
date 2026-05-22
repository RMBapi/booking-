# Frontend Integration

Companion to [rbac.md](rbac.md). This is the contract the API exposes to a
client app — what to call, what to send, what to render off the response.

---

## 1. Auth & Session

### Tokens

| Token         | Where                                      | Lifetime |
| ------------- | ------------------------------------------ | -------- |
| Access token  | `Authorization: Bearer <jwt>` header       | 15m      |
| Refresh token | `cb_rt` httpOnly cookie (set automatically) | 7d       |

The frontend never reads or stores the refresh token — the server sets/clears
the cookie on `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`,
and `/activation/:token`. Send `credentials: 'include'` on every fetch so the
cookie travels with the request.

### Login

```http
POST /auth/login
Content-Type: application/json

{ "email": "...", "password": "...", "businessSiteSlug": "acme" }
```

**Do not send `role` on login.** The role field exists only on `POST /auth/register`.
Login bodies are whitelisted to `email`, `password`, and optional `businessSiteSlug`;
extra properties (including `role`) return `400` with `"property role should not exist"`.

`businessSiteSlug` is required only when the user is a `Customer`. Response:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id", "firstName", "lastName", "email", "systemRole",
    "passwordChangeRequired": false
  }
}
```

If `passwordChangeRequired` is `true`, the frontend MUST redirect the user
to the change-password flow (see §1c) before allowing any other action. The
backend does not block other endpoints on this flag — it's a UX gate.

If `isActive` is `false` (e.g. the Super_Admin created the user but hasn't
flipped the activation toggle yet), login returns `401` with the message
`"Account is inactive. Contact your administrator."`

### Register

```http
POST /auth/register
{
  "firstName", "lastName", "email", "phone", "password",
  "role": "Customer" | "Business_owner" | "Service_Provider",
  "businessName": "Acme Salon",        // optional; only used when role=Business_owner
  "businessSiteSlug": "acme",           // required when role=Customer
  "invitationToken": "..."              // optional; auto-accepts a pending invitation
}
```

Notes:
- `Super_Admin` is rejected — those accounts come from `/admin/business-owners`-style flows or the seed script.
- `Business_owner` registration auto-creates a `Business` and a `UserBusiness` owner row.
- `Customer` registration attaches the user to an existing business via `businessSiteSlug`.
- `Service_Provider` self-register is allowed but is `isActive=false` until they accept an invitation or complete activation.

### Refresh

```http
POST /auth/refresh    // empty body
```

Reads `cb_rt` cookie, returns `{ accessToken }`, rotates the cookie. On 401,
treat the session as ended and route to login.

### Logout

```http
POST /auth/logout    // empty body, idempotent, returns 204
```

### 1c. Change password

```http
POST /auth/change-password
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "currentPassword": "...",
  "newPassword": "...",
  "confirmPassword": "..."
}
```

Response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password updated successfully",
  "data": {
    "accessToken": "<fresh-jwt>",
    "user": {
      "id", "firstName", "lastName", "email", "systemRole",
      "passwordChangeRequired": false
    }
  }
}
```

Side effects:

- The new hash is persisted and `passwordChangeRequired` is cleared.
- **Every other refresh-token family for this user is revoked.** Other
  devices will get `401` on their next refresh and need to log in again.
- A fresh `cb_rt` cookie is set, and the calling tab continues without
  re-login. Update your in-memory access token from the response.

Errors:
- `400` — `newPassword !== confirmPassword`, or `newPassword` equals the
  current password.
- `401` — `currentPassword` is wrong.
- `429` — rate limited (5/min/IP).

### `/auth/me` — single source of truth for the UI

```http
GET /auth/me
Authorization: Bearer <jwt>
```

Response:

```json
{
  "user": {
    "id", "firstName", "lastName", "email", "phone",
    "systemRole": "Business_owner" | "Service_Provider" | "Customer" | "Super_Admin",
    "passwordChangeRequired": false,
    "createdAt"
  },
  "businesses": [
    {
      "id", "name", "slug", "logo",
      "role": "Business_owner" | "Service_Provider",
      "permissions": ["view_bookings", "view_calendar", ...]
    }
  ]
}
```

If `user.passwordChangeRequired === true`, redirect to the change-password
flow. If the user is a `Business_owner` and `businesses` is empty, redirect
to the create-your-business flow (see §12) — they need to onboard a
business before they can use the app.

Call this once on app load and on tab focus. Cache it client-side; re-fetch
after any team-management action that could change the current user's
permissions.

For `Business_owner`s, `permissions[]` is always the full feature list — no
need to check role separately in UI gating logic.

---

## 2. Picking the active business

Most resources (bookings, services, contacts, providers, calendar) are scoped
to a business. The frontend picks one and pins it for the session by sending
`X-Business-Id: <businessId>` on every gated request.

```ts
fetch('/booking', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'X-Business-Id': activeBusinessId,
  },
  credentials: 'include',
});
```

If the user only has one business in `/auth/me`'s `businesses[]`, default to it.
If they have multiple, render a switcher (typical pattern: a header dropdown).
The chosen `businessId` should also drive the URL where it makes sense
(`/app/:businessId/bookings`) so deep links work.

`/business/:id` and routes under it (`/business/:id/team`,
`/business/:id/invitations`) read the id from the URL — no header needed.

---

## 3. Gating the UI off `permissions[]`

The same array drives:
- whether to render a nav link
- whether to enable a button
- whether to navigate to a route

```ts
const features = useActiveBusinessPermissions(); // string[] from /auth/me

if (features.includes('view_bookings'))   show <BookingsLink />;
if (features.includes('manage_bookings')) enable <CancelBookingButton />;
```

Every code in `permissions[]` is a string literal from
[src/common/constants/permissions.ts](src/common/constants/permissions.ts).
Mirror that file on the frontend (or generate it). Authoritative list:

| Code                | What it gates                                |
| ------------------- | -------------------------------------------- |
| `view_dashboard`    | Dashboard page                               |
| `view_analytics`    | Analytics page                               |
| `view_bookings`     | Booking list (read)                          |
| `manage_bookings`   | Create / edit / cancel / delete bookings     |
| `view_services`     | Services list (read)                         |
| `manage_services`   | Create / edit / delete services              |
| `view_contacts`     | Contacts list (read)                         |
| `manage_contacts`   | Create / edit / delete contacts              |
| `view_providers`    | Service providers list (read)                |
| `manage_providers`  | Create / edit / delete service providers     |
| `view_calendar`     | Calendar view                                |
| `view_settings`     | Business settings page                       |
| `manage_team`       | Team management UI (add/edit/remove members) |
| `manage_business`   | Edit business profile                        |

The server enforces the same checks via `@RequireFeature(...)` on every
controller — UI gating is for UX only. A user who hand-crafts a request
without permission still gets a 403.

---

## 4. App surfaces by `systemRole`

`systemRole` decides which app shell to mount.

| systemRole         | Surface                                     |
| ------------------ | ------------------------------------------- |
| `Super_Admin`      | `/super-admin/*` — platform admin tools     |
| `Business_owner`   | `/app/*` — business owner workspace         |
| `Service_Provider` | `/app/*` — same workspace, gated by perms   |
| `Customer`         | `/customer/*` — booking surface             |

`Super_Admin` bypasses every `@RequireFeature` check at the API; the UI should
mirror that (admin shell exposes admin endpoints; it shouldn't pretend the
business team has restricted them).

---

## 5. Public endpoints (no JWT required)

These work without `Authorization` and without `X-Business-Id`:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET  /business/slug/:slug`
- `GET  /business/slug/:slug/services`
- `GET  /business/slug/:slug/services/:serviceId/providers`
- `POST /booking`   (anonymous customer booking)
- `POST /contact`   (anonymous customer contact form)
- `GET  /invitations/:token`
- `GET  /activation/:token`
- `POST /activation/:token`

Everything else requires a valid access token; gated routes additionally
require membership in the business (and the relevant feature, except for
`Business_owner`s and `Super_Admin`s).

---

## 6. Team management flow

Available to anyone with `manage_team` (i.e. owners, plus any
`Service_Provider` explicitly granted it).

### Render the picker

```http
GET /business/:id/team/available-features
→ [{ code: "view_bookings", label: "View Bookings",
     description: "Can see the bookings list" }, ...]
```

Use this list to render a checkbox group. Don't hardcode descriptions on the
frontend — keep this endpoint as the source of truth so adding a feature
server-side automatically appears in the UI.

### List members

```http
GET /business/:id/team
→ [{
    userId, firstName, lastName, email, phone,
    role: "Business_owner" | "Service_Provider",
    permissions: string[],     // ALL_FEATURES for owners
    isActive, joinedAt
   }]
```

### Add a member

```http
POST /business/:id/team
{
  email, firstName, lastName, phone,
  role: "Business_owner" | "Service_Provider",
  permissions: ["view_bookings", "view_calendar"]   // ignored if role=Business_owner
}
```

If `email` matches an existing user, the user is attached to the business
without re-creating the account; otherwise a new `isActive=false` user is
created and an activation email is sent. `permissions[]` is the full set,
not a delta.

### Update role / permissions

```http
PATCH /business/:id/team/:userId
{
  role?: "...",
  permissions?: ["..."]   // replaces the full set; pass [] to clear all
}
```

Constraints the API enforces (display these to the user pre-emptively):
- Cannot demote the last `Business_owner`.
- Cannot demote yourself if you'd become the last owner.

### Remove a member

```http
DELETE /business/:id/team/:userId
```

Constraints:
- Cannot remove yourself (ask another owner to do it).
- Cannot remove the last `Business_owner`.

---

## 7. Activation flow (new user accepts an invitation)

When a `Business_owner` adds a brand-new user to their team (or a
`Super_Admin` creates a `Business_owner` via `POST /admin/business-owners`),
the API mints a token and emails an activation link:

```
${FRONTEND_URL}/activate/${token}
```

The frontend should host that route and call:

```http
GET /activation/:token
→ { valid: true, email, firstName, businessName }
   // or { valid: false, expired?: boolean, consumed?: boolean }
```

Render the appropriate state (form / "expired" / "already used"), then on submit:

```http
POST /activation/:token
{ "password": "..." }
→ { accessToken }
```

The server activates the account, creates the `UserBusiness` row, marks the
invitation accepted, and sets `cb_rt`. The frontend stores the access token
and routes the user into the app shell — they're now logged in.

---

## 8. Existing-user invitations

Different flow from activation: the user already has an account.

```
${FRONTEND_URL}/accept-invitation?token=${token}
```

```http
GET /invitations/:token
→ { businessName, email, role, isExpired, isRevoked, isAccepted }
```

If the user is not logged in, redirect to `/login?next=...` (or
`/register?invitation=${token}` for brand-new accounts — the register flow
auto-accepts when `invitationToken` is in the body).

If the user IS logged in:

```http
POST /invitations/:token/accept
Authorization: Bearer <jwt>
```

The API verifies that the JWT user's email matches the invitation email,
then creates the `UserBusiness` row.

---

## 9. Error shapes

The API returns standard NestJS error envelopes:

```json
{ "statusCode": 403, "message": "Missing required feature(s): manage_bookings", "error": "Forbidden" }
```

Common codes the frontend should handle:

| Status | Meaning                                                                            |
| ------ | ---------------------------------------------------------------------------------- |
| 401    | No / invalid / expired access token. Try `/auth/refresh`; on 401 again, sign out.   |
| 403    | Missing feature, missing membership, or wrong systemRole. Don't auto-retry.         |
| 400    | Validation failure or `X-Business-Id` missing on a gated route.                     |
| 409    | Conflict (duplicate email, duplicate slug, already a member, pending invitation).    |
| 404    | Resource scoped to a business not found, or token unknown.                          |

---

## 10. Recommended client patterns

- One `useMe()` hook that fetches `/auth/me` once and exposes
  `{ user, businesses, activeBusiness, permissions, hasFeature }`.
- One fetch wrapper that injects `Authorization`, `X-Business-Id` (from the
  active business in context), and `credentials: 'include'`.
- A `<RequireFeature code="manage_bookings">` component that renders children
  only when the active business's `permissions[]` includes the code.
- On 401 from any non-`/auth/*` request: try `/auth/refresh` once; if that
  also 401s, clear local auth state and route to login.

---

## 11. Adding a new feature (full-stack checklist)

When the backend team adds a new feature code:

1. They append to `FEATURES` and `FEATURE_DESCRIPTIONS` in
   [src/common/constants/permissions.ts](src/common/constants/permissions.ts)
   and decorate controller methods with `@RequireFeature('your_code')`.
2. The new code automatically appears in `GET /business/:id/team/available-features`.
3. Frontend mirrors the new string in its constants (or codegens it).
4. Frontend gates UI on `permissions.includes('your_code')`.
5. Existing users won't have it until an owner toggles it on for them in the
   team UI; `Business_owner`s get it for free.

---

## 12. New owner onboarding flow (Super_Admin → Owner)

The Super_Admin provisions the owner account separately from the
business. The owner sets up their business themselves once they're
logged in.

### Step 1 — Super_Admin creates the user

```http
POST /admin/business-owners
Authorization: Bearer <super-admin-jwt>

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@acme.com",
  "phone": "+61400000000",
  "password": "min-8-chars",
  "confirmPassword": "min-8-chars"
}
```

Creates an **inactive** `Business_owner` user with the supplied password.
**No business, no UserBusiness, no email is sent.** The Super_Admin
shares the password with the owner out-of-band (e.g. SMS, secure chat).

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
      "createdAt"
    }
  }
}
```

Errors: `400` (passwords don't match), `409` (email taken), `403` (not Super_Admin).

### Step 2 — Super_Admin activates the user

```http
PATCH /admin/business-owners/:id/activation
Authorization: Bearer <super-admin-jwt>

{ "isActive": true }
```

Toggles `isActive`. Until this flips to `true`, login returns 401 with
"Account is inactive. Contact your administrator."

Same DTO works to deactivate later (`{ "isActive": false }`). Errors:
`404` if the id isn't an active `Business_owner`.

### Step 3 — Owner logs in

```http
POST /auth/login
{ "email": "jane@acme.com", "password": "min-8-chars" }
```

Response carries `user.passwordChangeRequired: true`. The frontend MUST
redirect to a "set your own password" page. Don't render the rest of the
app yet.

### Step 4 — Owner changes password

```http
POST /auth/change-password
Authorization: Bearer <jwt-from-step-3>

{
  "currentPassword": "min-8-chars",         // the admin-supplied one
  "newPassword": "owner-chosen-pw",
  "confirmPassword": "owner-chosen-pw"
}
```

Response carries a fresh `accessToken`, a rotated `cb_rt` cookie, and
`user.passwordChangeRequired: false`. All other refresh-token families
for this user are revoked — if Jane was somehow logged in elsewhere,
those sessions are killed.

### Step 5 — Owner creates their business

```http
POST /business/onboarding
Authorization: Bearer <owner-jwt>

{
  "name": "Acme Salon",
  "slug": "acme-salon",
  "email": "hello@acme.com",      // optional
  "phone": "+61...",              // optional
  "address": "...",               // optional
  "description": "...",           // optional
  "logo": "https://...",          // optional
  "image": "https://..."          // optional
}
```

`slug` validation: lowercase alphanumeric with single hyphens, 2–50 chars,
matching `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. Reject otherwise (400).

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

Errors:
- `403` — caller isn't a `Business_owner` (other roles can't onboard).
- `409` — caller already owns a business (one business per owner via
  this endpoint), or the slug is taken by an active business.
- `400` — slug fails the regex, or other validation issues.

After this completes, refetch `/auth/me` — `businesses[]` now contains
the new business. Set it as the active business in the FE state and
redirect to `/app/{businessId}`.

### Where this fits in the FE state machine

```
login response
  ├─ user.passwordChangeRequired === true      → /change-password
  └─ false → fetch /auth/me
              ├─ user.systemRole === 'Business_owner' && businesses.length === 0
              │       → /onboarding/create-business
              ├─ user.systemRole === 'Super_Admin'    → /super-admin
              └─ otherwise                              → /app/{businessId}
```

Each `/auth/me` re-fetch should re-apply this routing logic, so a stale
tab eventually catches up to a state change made elsewhere.
