# Authentication & Session Management Audit

## ✅ Auth & Session

### businessId Storage
- **After customer login**: ✅ **PARTIAL** — The code stores `businessSiteSlug` in `additionalData`, but does **NOT** store `businessId` from the JWT. The JWT is stored as-is without decoding.
  - Location: [features/authentication/hooks/useLogin.ts](features/authentication/hooks/useLogin.ts#L36-L42)
  - Only `businessSiteSlug` is stored: `if (variables.businessSiteSlug) { additionalData.businessSiteSlug = variables.businessSiteSlug; }`

- **After customer register**: ✅ **SAME BEHAVIOR** — Only `businessSiteSlug` is stored, not `businessId`
  - Location: [features/authentication/hooks/useRegister.ts](features/authentication/hooks/useRegister.ts#L63-L66)

### JWT & businessId Handling
- **JWT decoding for businessId**: ❌ **NO** — There is **no JWT decoding** anywhere in the codebase. The token is stored as-is.
  - The token would need to be decoded to extract embedded `businessId` (if present)
  - Currently only stored in localStorage as raw string

- **JWT refresh flow**: ⚠️ **MISSING** — There is **NO refresh token mechanism** implemented
  - No POST `/auth/refresh` endpoint call found
  - No token rotation on expiry
  - When token expires, a 401 is caught and the user is logged out entirely

### Logout Behavior
- **Clear auth state and business context**: ✅ **YES** — Both are cleared together
  - Location: [lib/roleBasedAuth.ts](lib/roleBasedAuth.ts#L46-L51)
  - `clearRoleSession()` removes: `customer_token`, `customer_user`, `customer_businessSiteSlug`
  - Called as: `clearRoleSession("Customer")` or `clearAllRoleSessions()`

### Multi-Business Session Isolation
- **Two tabs with different businesses**: ✅ **YES** — Each session is **properly isolated** per business
  - Sessions are stored in `localStorage` as `customer_token`, `customer_user`, `customer_businessSiteSlug`
  - localStorage is **per origin**, not per tab, so **this is ACTUALLY NOT isolated per tab** — it's **global for the domain**
  - **⚠️ RISK**: If a user opens Business A and Business B in two tabs on the same domain (e.g., `salon-a.example.com` vs `salon-b.example.com`), they **WOULD be different origins** (good). But if both are subdomains or paths on the same domain, the **second login will OVERWRITE the first**.
  - If both businesses are on the **same domain/origin**, sessions are **NOT isolated** between tabs — the latest login wins.

---

## ✅ GET /auth/me Endpoint

### App Load
- ❌ **NO** — `/auth/me` is **NOT called on app load**
  - There is no automatic profile hydration on app startup
  - Manual `getProfile()` call exists in [features/authentication/hooks/useGetProfile.ts](features/authentication/hooks/useGetProfile.ts) but it's **not automatically enabled** (`enabled: false`)
  - Profile is only fetched when explicitly called via `refetch()`

### Customer Businesses Handling
- ⚠️ **NOT EXPLICITLY HANDLED** — The codebase is **customer-only** (single-role)
- No logic to handle `businesses[]` array or filter by `role === "Customer"`
- The `User` type does not include a `businesses` field
  - Location: [types/index.ts](types/index.ts#L5-L17)

### Staff vs Customer Business Differentiation
- ❌ **NOT APPLICABLE** — This is a **public customer-facing website only**
- No distinction between `Business_owner`, `Service_Provider`, and customer businesses
- No multi-role support in the UI

---

## ❌ Error Handling for Customer Auth Errors

### Specific Error Messages
The code **does NOT explicitly handle** these specific customer auth errors:

- ❌ **"Invalid credentials"** — Generic handling only
  - Location: [features/authentication/hooks/useLogin.ts](features/authentication/hooks/useLogin.ts#L49-L53)
  - Only checks if message contains: `"unauthorized"`, `"invalid credential"`, or `"invalid password"`
  - Shows generic: `"Invalid email or password. Please try again."`

- ❌ **"Already registered with this business"** — NOT handled
  - If this error is returned, it shows the raw backend message

- ❌ **"Your account has been deactivated by this business"** — NOT handled
  - Shows the raw error message from the backend

- ❌ **"Your account is pending activation by this business"** — NOT handled
  - Shows the raw error message from the backend

### GET /user/my-bookings 400 with Missing Business Context
- ❌ **NO** — Not explicitly handled
  - Location: [app/customer/bookings/page.tsx](app/customer/bookings/page.tsx#L1)
  - Calls `getMyBookings()` without error boundary for this specific case
  - Generic error handling via `useApiError()` hook

---

## 🌐 Web (Customer-Facing Website)

### Registration

#### businessSiteSlug Matching
- ✅ **YES** — businessSiteSlug is always sent in register payload
  - Location: [app/auth/register/page.tsx](app/auth/register/page.tsx#L84-L87)
  - Resolved from: query param → `searchParams.get("businessSiteSlug")` → environment variable `NEXT_PUBLIC_BUSINESS_SLUG`

#### Email Already Used on Different Business
- ❌ **NO** — Not explicitly shown
  - The error message is passed through as-is from the backend
  - If the backend returns a message like "Email already registered on another business", it's shown as-is
  - No specific UX flow to detect this scenario and prompt login vs. new password entry

#### "Already registered with this business" Handling
- ❌ **NO** — Not detected and redirected to login
  - If this error is returned, it's shown as a generic error message
  - User is not automatically redirected to login

#### Active Tenant After Successful Register
- ✅ **YES** — businessSiteSlug is stored as the active tenant
  - Location: [features/authentication/hooks/useRegister.ts](features/authentication/hooks/useRegister.ts#L63-L66)
  - Stored in `additionalData.businessSiteSlug`
  - But **NO businessId is extracted/stored** from the response

### Login

#### businessSiteSlug Always Sent
- ✅ **YES** — Send as part of LoginPayload
  - Location: [app/auth/login/customer/page.tsx](app/auth/login/customer/page.tsx#L70-L75)
  - Resolved the same way as register

#### businessSiteSlug Derived from URL/Domain
- ⚠️ **PARTIALLY** — Resolved from:
  1. Query parameter: `searchParams.get("businessSiteSlug")` or `searchParams.get("slug")`
  2. Environment variable: `NEXT_PUBLIC_BUSINESS_SLUG`
  3. **NOT from the current domain/URL path directly**
  - The site needs to be deployed so that each business domain/path sets the env var appropriately
  - If not set, the form shows an error: `"Business site slug is missing."`

#### Entire App Scoped to One Business
- ✅ **YES** — After login, the customer is scoped to that business
  - The `businessSiteSlug` is stored in session
  - However, there's **no explicit validation** that subsequent API calls use the same business
  - Everything depends on the `businessSiteSlug` being passed in query params or headers

#### Can Log Into Business X If Only Member of Business Y
- ❌ **UNAVAILABLE DATA** — Cannot verify from frontend code
  - The backend would validate this
  - Frontend just sends the credentials + `businessSiteSlug` and trusts the backend response
  - If backend returns 401, the user is shown "Invalid email or password"

### Bookings

#### Send businessSlug or X-Business-Id for POST /booking
- ✅ **YES** — Both are sent
  - Location: [services/bookingService.ts](services/bookingService.ts#L14-L21)
  - Query param: `businessSlug`
  - Header: `x-business-id` (if provided)
  - Called as: `createBooking(payload, businessSlug, businessId)`

#### Handle 403 — "Not a registered customer of this business"
- ❌ **NO** — Not explicitly handled
  - A 403 dispatches a custom event: `window.dispatchEvent(new CustomEvent("auth:forbidden", { detail }))`
  - But this is not consumed/handled in the booking component
  - User sees generic error toast

#### Guest Checkout Details
- ✅ **YES** — Guest details are sent, not userId
  - Location: [features/booking/BookingForm.tsx](features/booking/BookingForm.tsx#L283-L298)
  - Guest mode creates a `CreateContactPayload` without `userId`

#### Attachment After Guest Checkout
- ⚠️ **NOT HANDLED IN FRONTEND** — Frontend assumes this works
  - Backend is expected to attach the booking to an existing user by email

#### My Bookings Only for Current Business
- ✅ **DESIGN INTENT** — But not enforced in frontend
  - Location: [app/customer/bookings/page.tsx](app/customer/bookings/page.tsx#L1)
  - Calls `getMyBookings()` without passing `businessSlug` or any filter
  - Relies on backend to return only the current business's bookings based on JWT context
  - **RISK**: If the JWT doesn't include `businessId`, the backend cannot filter by business properly

#### Cancel Booking with Current Business Slug
- ✅ **YES** — businessSlug is sent
  - Location: [services/bookingService.ts](services/bookingService.ts#L31-L36)
  - Called as: `cancelBooking(id, payload, businessSlug)`
  - Passes `?businessSlug=...` in query

### Multi-Business Customer Journey (Rafid scenario)

#### Register/Login Separately on Each Site
- ⚠️ **DEPENDS ON DOMAIN SETUP** — Currently **NOT supported**
  - If all businesses are on the same domain (e.g., `cuebites.com/salon-a` and `cuebites.com/salon-b`), then:
    - ✅ **YES** — Can register/login on each, but **localStorage is shared** → second login overwrites first
    - ❌ **The active session is not per-business; it's global to the domain**
  - If businesses are on separate domains/subdomains (e.g., `salon-a.cuebites.com`, `salon-b.cuebites.com`):
    - ✅ **YES** — Sessions are isolated because each domain has its own localStorage

#### See Only That Site's Data When Logged In
- ✅ **DESIGN INTENT** — But relies on backend enforcement
  - Frontend stores only one `businessSiteSlug`
  - All API calls send this slug
  - Backend must filter by this context

#### Force New Login When Switching Business Sites
- ❌ **NO** — Not forced
  - If both businesses are on the same domain:
    - Switching from Business A's page to Business B's page does **not trigger a new login**
    - Instead, the second `businessSiteSlug` is written to localStorage, **overwriting** the first
    - The old session token remains, but now points to a different business's context
  - If businesses are on different domains:
    - ✅ **YES**, naturally forced because each domain has separate localStorage

#### Mixed Business Data (Cached businessId from Another Site)
- ⚠️ **RISK** — Could happen if both businesses are on same domain
  - If a user logs into Business A, then logs into Business B without full logout:
    - Token from Business A is replaced with Business B's token ✅
    - But if there's any cached `businessId` from Business A in React state/memory, it could be used ❌
    - No explicit "ensure all context matches current businessSiteSlug" check

---

## 🔐 Token & API Calls

### Active Business Implied By
- ✅ **businessSlug query param** — Where required
  - Explicitly passed to most API functions
- ⚠️ **JWT businessId** — **NOT extracted or used by frontend**
  - The JWT may contain businessId (on backend), but frontend never decodes it
- **X-Business-Id header** — Optional, used for some endpoints
  - Passed when `businessId` prop is available
  - But `businessId` is not typically stored in session

### Avoid X-Business-Id from Staff Session on Public Website
- ✅ **YES** — This is a **public website only**, no staff/CRM sessions possible
- The codebase is explicitly customer-only: `UserRole = "Customer"`

---

## Summary Table

| Item | Status | Notes |
|------|--------|-------|
| Store businessId from login response | ❌ NO | Only businessSiteSlug stored |
| Store businessId from register response | ❌ NO | Only businessSiteSlug stored |
| JWT decoding for businessId | ❌ NO | No JWT decoding anywhere |
| Token refresh endpoint | ❌ NO | No refresh mechanism |
| Clear both auth + business on logout | ✅ YES | clearRoleSession clears both |
| Session isolation (same domain, 2 tabs) | ❌ NO | localStorage is global → second login overwrites |
| Session isolation (different domains) | ✅ Implicit | Different domains = different localStorage |
| Call GET /auth/me on app load | ❌ NO | Manual call only, not auto-enabled |
| Handle "Invalid credentials" specifically | ⚠️ Partial | Generic handling, not specific message |
| Handle "Already registered with this business" | ❌ NO | No specific flow |
| Handle "Account deactivated" | ❌ NO | Shows raw error |
| Handle "Account pending activation" | ❌ NO | Shows raw error |
| Handle 400 "missing business context" | ❌ NO | No specific handling |
| Send businessSiteSlug on register | ✅ YES | Sent from query/env |
| Derive businessSiteSlug from domain | ⚠️ Partial | From env var, not domain detection |
| Show error if email used on different business | ❌ NO | Raw backend error shown |
| Redirect to login if "already registered" | ❌ NO | Shows error instead |
| Store businessId as active tenant | ❌ NO | Only businessSiteSlug stored |
| Send businessSiteSlug on login | ✅ YES | Always sent |
| Scope app to one business after login | ✅ YES | Stored in session |
| Prevent login to Business X if only member of Y | ⚠️ Backend | Frontend trusts backend |
| Send businessSlug/X-Business-Id on POST /booking | ✅ YES | Both sent |
| Handle 403 "not registered customer" | ⚠️ Partial | Fires event, not consumed |
| Guest checkout without userId | ✅ YES | CreateContactPayload used |
| My Bookings calls GET /user/my-bookings | ✅ YES | No filter param sent |
| My Bookings shows only current business | ⚠️ Backend | Frontend sends slug, backend filters |
| Send business slug on cancel booking | ✅ YES | businessSlug in query |
| Register/login separately on each site | ⚠️ Domain dependent | Works if different domains |
| See only site's data per login | ✅ Design intent | Relies on backend filtering |
| Force re-auth when switching sites | ❌ NO | Same domain = localStorage reuse |
| Avoid mixing business data from cache | ⚠️ Risk | Could happen same-domain scenario |
| Active business implied by JWT businessId | ❌ NO | Not extracted by frontend |
| Active business implied by query param | ✅ YES | businessSlug sent where needed |

---

## 🔴 Critical Issues

1. **No JWT Decoding** 
   - businessId (if embedded in JWT) is never extracted
   - No way to verify which business the token is scoped to on the frontend

2. **No businessId Storage**
   - Only businessSiteSlug is stored, not the actual businessId
   - Makes it impossible to use X-Business-Id headers consistently

3. **Same-Domain Multi-Business Bug**
   - If two businesses are on the same domain (e.g., paths or query params), a second login overwrites the first
   - Sessions are not truly isolated

4. **No Specific Error Messages**
   - Auth errors like "Already registered", "Deactivated", "Pending activation" are not detected
   - UX is poor because users see raw backend messages

5. **No Token Refresh**
   - Token expiry is not handled; entire session is cleared on 401
   - No way to stay logged in during long operations

6. **GET /auth/me Not Called on Load**
   - User profile is not hydrated on app startup
   - Could cause timing issues if profile data is needed early

---

## 🟡 Recommendations

### High Priority
1. Extract `businessId` from login/register responses and store alongside `businessSiteSlug`
2. Add JWT decoding (use `jwtDecode` library) to extract embedded `businessId` for verification
3. Implement token refresh endpoint (+refresh token storage)
4. Add specific error message detection for: "Already registered", "Deactivated", "Pending activation"

### Medium Priority
5. Call GET /auth/me on app load (wrapped in useEffect in RoleAuthProvider)
6. Add custom localStorage key prefix per business to support same-domain multi-business
7. Validate that `businessSiteSlug` in session matches the current page's expected business
8. Handle 403 "not a registered customer" in BookingForm component

### Low Priority
9. Add `businesses[]` array to User type for future multi-role support
10. Document domain/subdomain requirements for multi-business deployments
11. Add console warnings if businessSiteSlug mismatches between stored session and current page

---

## Test Cases to Add

```typescript
// Test: businessId is stored after login
// Test: businessId is stored after register
// Test: JWT is decoded to extract businessId
// Test: Token refresh clears old businessId and loads new one
// Test: Logout clears businessId and businessSiteSlug
// Test: Two simultaneous bookings on different businesses use correct business context
// Test: 400 "missing business context" is handled gracefully
// Test: "Already registered with this business" redirects to login
// Test: Same-domain multiple businesses don't overwrite each other
// Test: Multi-tab login to different businesses works correctly
```
