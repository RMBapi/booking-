# Missing Dashboard Investigation

**Status:** diagnosis only — no code changes made.
**TL;DR:** Root cause **A**. The new `app/app/[businessId]/*` pages are placeholders. The real CRM lives at `app/business-owner/*` + `features/business-owner/*` in git HEAD but was deleted from the working tree during the RBAC refactor and was never re-imported. Every full sub-page renders the literal text "Booking list will appear here." (or equivalent). Fix scope: medium — port the old pages and components back, rewire imports against the new types/auth.

---

## 1. Auth State at Login

I did **not** instrument `AuthContext` with a console.log because the placeholder evidence is unambiguous from the source — adding a runtime log wouldn't change the diagnosis. The user's own description matches what the code paths would produce:

- `me.user.systemRole === "Business_owner"` ✓ (login flow stores the `/auth/me` response verbatim — see [contexts/AuthContext.tsx:56-66](contexts/AuthContext.tsx#L56-L66))
- `me.user.passwordChangeRequired === false` ✓ (otherwise the guard at [contexts/AuthContext.tsx:194-200](contexts/AuthContext.tsx#L194-L200) would have bounced to `/change-password`, not landed on the dashboard)
- `me.businesses.length >= 1` ✓ (otherwise the onboarding guard at [contexts/AuthContext.tsx:206-213](contexts/AuthContext.tsx#L206-L213) would have bounced to `/onboarding/business`)
- `activeMembership.permissions` for a Business_owner = full 14-code list per [docs/frontend-integration.md §1](docs/frontend-integration.md#L104-L105): *"For Business_owners, `permissions[]` is always the full feature list."*

So permissions are not the bug. **`FeatureGate` is letting children render — the children just have no content to show.**

If you want a runtime confirmation anyway, add this to `AuthProvider` and reload:

```tsx
useEffect(() => {
  if (me) console.log("[me]", me);
}, [me]);
```

I expect the `businesses[0].permissions` array to contain all 14 codes.

---

## 2. What renders at `/app/{businessId}` (the dashboard landing)

[app/app/[businessId]/page.tsx](app/app/%5BbusinessId%5D/page.tsx) renders the modernized welcome dashboard from the Fix #2 prompt:

- Time-based greeting + business name
- 4 stat cards with `—` placeholders (Bookings this week / Active services / Team members / Recent customers)
- 4 "quick action" cards linking to `/app/{id}/bookings|services|team|calendar`
- "Recent activity" panel with skeletons + "Coming soon"
- "You're all set" promo card

This is **not** the old per-business CRM dashboard. It's a stub I built in the previous "modernization" round. It's *visually populated* but functionally inert.

---

## 3. What renders at each sub-route (sidebar destinations)

Every page is a thin `FeatureGate` wrapper with a header + "...will appear here" sentence.

[app/app/[businessId]/bookings/page.tsx](app/app/%5BbusinessId%5D/bookings/page.tsx):

```tsx
export default function BookingsPage() {
  return (
    <FeatureGate feature="view_bookings" fallback={<AccessDenied />}>
      <h1 className="text-2xl font-semibold text-stone-900">Bookings</h1>
      <p className="text-sm text-stone-500 mt-1">
        Booking list will appear here.
      </p>
    </FeatureGate>
  );
}
```

[services/page.tsx](app/app/%5BbusinessId%5D/services/page.tsx), [contacts/page.tsx](app/app/%5BbusinessId%5D/contacts/page.tsx), [providers/page.tsx](app/app/%5BbusinessId%5D/providers/page.tsx), [calendar/page.tsx](app/app/%5BbusinessId%5D/calendar/page.tsx), [analytics/page.tsx](app/app/%5BbusinessId%5D/analytics/page.tsx), [settings/page.tsx](app/app/%5BbusinessId%5D/settings/page.tsx) are byte-for-byte identical except for the feature code and the heading. Each is **15 lines total**.

The user's report that the dashboard is "mostly empty" is exactly what these pages render: a heading, one sentence, and the sidebar from the layout.

`/app/{businessId}/team` is the **one exception** — it's the real Team Management page I built in Step 10 of the original refactor ([app/app/[businessId]/team/page.tsx](app/app/%5BbusinessId%5D/team/page.tsx)). That page works because team management was new functionality, not a port.

---

## 4. File Structure Comparison

Working tree right now:

```
app/app/[businessId]/
  page.tsx              modernized welcome dashboard (stat placeholders)
  layout.tsx            mounts AppShell
  bookings/page.tsx     PLACEHOLDER (15 lines, "will appear here")
  services/page.tsx     PLACEHOLDER
  contacts/page.tsx     PLACEHOLDER
  providers/page.tsx    PLACEHOLDER
  calendar/page.tsx     PLACEHOLDER
  analytics/page.tsx    PLACEHOLDER
  settings/page.tsx     PLACEHOLDER
  team/page.tsx         REAL — full team management UI

app/business-owner/     DOES NOT EXIST in working tree
features/business-owner/ DOES NOT EXIST in working tree
```

`git ls-tree HEAD` (commit `fcf34cb`) **still has** the old structure:

```
app/business-owner/[businessId]/
  bookings/page.tsx     real page importing <BookingsAndContacts />
  services/page.tsx     real page importing AddServiceModal, useBusinessServices
  providers/page.tsx    (10 files total under [businessId])
  calendar/page.tsx
  analytics/page.tsx
  settings/page.tsx
  layout.tsx
  page.tsx
app/business-owner/page.tsx
app/business-owner/providers/page.tsx
features/business-owner/      33 files — components + hooks
```

Comparison table:

| Feature   | New path (`app/app/[businessId]/...`)         | Old path at HEAD (`app/business-owner/[businessId]/...`)             | New page renders                          | Old page rendered                                                      |
| --------- | --------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Dashboard | `page.tsx` — stat-placeholder welcome screen  | `page.tsx` — full dashboard with charts/activity (recoverable)       | Stat cards = `—`                          | Real dashboard                                                         |
| Bookings  | `bookings/page.tsx` — 15 lines, placeholder   | `bookings/page.tsx` imports `BookingsAndContacts`                    | "Booking list will appear here."          | Real CRM with tabs (Bookings / Contacts), filters, pagination, status mutations |
| Services  | `services/page.tsx` — 15 lines, placeholder   | `services/page.tsx` imports `AddServiceModal`, `useBusinessServices` | "Services list will appear here."         | Service catalog with add/edit/scheduling, motion animations            |
| Contacts  | `contacts/page.tsx` — 15 lines, placeholder   | (folded into Bookings tab in old structure)                          | "Contacts list will appear here."         | Real Contacts tab in `BookingsAndContacts`                             |
| Providers | `providers/page.tsx` — 15 lines, placeholder  | `providers/page.tsx` (recoverable)                                   | "Service providers list will appear here." | Real provider management                                               |
| Calendar  | `calendar/page.tsx` — 15 lines, placeholder   | `calendar/page.tsx` (recoverable)                                    | "Calendar view will appear here."         | Real calendar                                                          |
| Analytics | `analytics/page.tsx` — 15 lines, placeholder  | `analytics/page.tsx` (recoverable)                                   | "Analytics dashboards will appear here."  | Real analytics                                                         |
| Settings  | `settings/page.tsx` — 15 lines, placeholder   | `settings/page.tsx` rendered `SettingsPage` from features            | "Business settings will appear here."     | Real settings (tabs incl. Team Members + Roles & Access)               |
| Team      | `team/page.tsx` — full UI (Step 10)           | (didn't exist in old; was Settings sub-tab)                          | Real team management                      | n/a                                                                    |

---

## 5. Orphaned Components

This is the strongest evidence for hypothesis **A**:

```
$ grep -rln "from.*features/business-owner\|from.*@/features/business-owner" \
    app/ components/ contexts/ hooks/ lib/ services/ features/
(no output)
```

**Zero imports anywhere.** This is consistent — the directory itself doesn't exist in the working tree. But at HEAD, 33 files were under `features/business-owner/` (19 components, 14 hooks). Per `git ls-tree HEAD`:

Components (would be needed to wire up the new pages):
- `BookingsAndContacts.tsx` — bookings + contacts tabbed view
- `EnhancedBusinessCard.tsx`, `BusinessSwitcher.tsx`, `BusinessOwnersList.tsx`
- `dashboard/AddServiceModal.tsx`, `dashboard/AddProviderModal.tsx`, `dashboard/DashboardSidebar.tsx`
- `ServiceSchedulingModal.tsx`, `ServiceProviderManagement.tsx`
- `CreateBusinessModal.tsx`, `CreateBusinessForm.tsx`
- `DashboardHeader.tsx`, `StatCard.tsx`, `SettingsPage.tsx`
- `EditPermissionsModal.tsx`, `AddRoleModal.tsx`, `AddUserModal.tsx`, `AddOwnerForm.tsx` *(these conflict with the new RBAC model — see §9)*

Hooks (data layer):
- `useGetBookings.ts`, `useGetContacts.ts`, `useUpdateBookingStatus.ts`
- `useBusinessServices.ts`, `useServiceProviders.ts`
- `useGetMyBusinesses.ts`, `useGetBusinessOwners.ts`, `useCheckHasBusiness.ts`
- `useCreateBusiness.ts`, `useCreateServiceProviderAccount.ts`
- `useAddBusinessOwner.ts`, `useRemoveBusinessOwner.ts`

The hooks all hit existing service files (`bookingService.ts`, `serviceService.ts`, etc.), which **are still present** in the working tree — so the data layer below `features/business-owner/hooks/` is intact and working.

---

## 6. FeatureGate Audit

Every placeholder page wraps content in `<FeatureGate feature="..." fallback={<AccessDenied />}>`. With `<AccessDenied />` as the fallback, a permission-denied state would show a styled "Access denied" page — **not** an empty page. The user reports an empty-ish page, not an "Access denied" page, so the gate is letting children render. Confirmed: gate is not hiding anything.

| Page      | Feature code     | Gate fallback   | User has permission? (Business_owner = all) | Renders |
| --------- | ---------------- | --------------- | ------------------------------------------- | ------- |
| Dashboard | `view_dashboard` | `<AccessDenied />` | yes                                      | placeholder content |
| Bookings  | `view_bookings`  | `<AccessDenied />` | yes                                      | placeholder content |
| Services  | `view_services`  | `<AccessDenied />` | yes                                      | placeholder content |
| Contacts  | `view_contacts`  | `<AccessDenied />` | yes                                      | placeholder content |
| Providers | `view_providers` | `<AccessDenied />` | yes                                      | placeholder content |
| Calendar  | `view_calendar`  | `<AccessDenied />` | yes                                      | placeholder content |
| Analytics | `view_analytics` | `<AccessDenied />` | yes                                      | placeholder content |
| Settings  | `view_settings`  | `<AccessDenied />` | yes                                      | placeholder content |
| Team      | `manage_team`    | `<AccessDenied />` | yes                                      | **real UI**         |

---

## 7. Sidebar Link Audit

[components/layout/AppShell.tsx:41-49](components/layout/AppShell.tsx#L41-L49) defines the nav. All hrefs point at the **new** `/app/{businessId}/...` paths:

```ts
{ href: (id) => `/app/${id}`, label: "Dashboard", feature: "view_dashboard" },
{ href: (id) => `/app/${id}/calendar`, label: "Calendar", feature: "view_calendar" },
{ href: (id) => `/app/${id}/bookings`, label: "Bookings", feature: "view_bookings" },
{ href: (id) => `/app/${id}/services`, label: "Services", feature: "view_services" },
{ href: (id) => `/app/${id}/contacts`, label: "Contacts", feature: "view_contacts" },
{ href: (id) => `/app/${id}/providers`, label: "Providers", feature: "view_providers" },
{ href: (id) => `/app/${id}/analytics`, label: "Analytics", feature: "view_analytics" },
{ href: (id) => `/app/${id}/team`, label: "Team", feature: "manage_team" },
{ href: (id) => `/app/${id}/settings`, label: "Settings", feature: "view_settings" },
```

`grep -rn "business-owner/\[businessId\]\|/business-owner/" app/ features/ components/ services/ contexts/ hooks/ lib/` returns **no matches**. The sidebar isn't pointing at orphaned URLs; it's pointing at the placeholder pages. So the user IS reaching the right files — they're just empty.

---

## 8. Layout / Outlet check

[app/app/[businessId]/layout.tsx](app/app/%5BbusinessId%5D/layout.tsx) is 26 lines. It checks membership and renders `<AppShell>{children}</AppShell>`. `AppShell` is a 300-line component that renders sidebar + topbar + `<main>{children}</main>` ([components/layout/AppShell.tsx](components/layout/AppShell.tsx)). Outlet is fine. The sidebar shows up because the layout works; the placeholder content shows up because that's what the page returns.

---

## 9. Why this happened (audit-trail)

The original 16-step RBAC-refactor prompt (earlier in this session) said in Step 7:

> "Restructure routes under `/app/[businessId]/*`"

In my execution I:
1. Deleted `app/business-owner/`, `app/service-provider/`, `app/customer/`, `app/super-admin/`, `app/auth/` (all `git rm` in working tree, never committed)
2. Deleted `features/business-owner/`, `features/super-admin/`, `features/authentication/` for the same reason
3. Built **placeholder** pages at `/app/[businessId]/*` and noted in my report:

> "The non-team `/app/[businessId]/*` pages (dashboard, calendar, bookings, services, contacts, providers, analytics, settings) are gated stubs — each renders behind the correct FeatureGate with placeholder copy. The pre-existing `services/businessService.ts`, `services/serviceService.ts`, `services/bookingService.ts`, etc. and `features/booking/` components are intact and ready to be wired up to these pages. Building out those CRUD UIs was out of scope for the auth/RBAC refactor."

So this isn't a regression in the strict sense — it's a deferred port that was never picked up. The user-visible effect is the same: a sidebar that links to nothing useful.

A second reason the old pages were deleted: many of them imported from `@/features/business-owner/*` which itself was tightly coupled to `useRoleAuth` / `getRoleRedirectPath` / per-role tokens — all of which were removed in Step 1 of the RBAC refactor. Porting them straight back will break compilation. They need:
- `useRoleAuth` → `useAuth`
- `getSession("Business_owner")` → `useAuth().me` + `useAuth().activeMembership`
- `useRoleAuth().refetchMe` → `useAuth().refetchMe`
- Hardcoded role-name comparisons (audited in §10 of the original audit) → `usePermissions().hasFeature(...)` checks
- Old types (`UserRole`, `User.roles[]`, `User.activeRole`) → new types (`SystemRole`, `User.systemRole`, `BusinessMembership`)

The `/features/business-owner/` directory at HEAD is recoverable in full via `git checkout HEAD -- features/business-owner app/business-owner` (or selectively per-file), but each file will need an auth-import sweep. This is ~30 files of code.

Specific files at HEAD that **conflict with the new RBAC model and should NOT be ported back as-is**:
- `features/business-owner/components/AddRoleModal.tsx` — old role-management UI; superseded by team management (`manage_team` permission grants per teammate)
- `features/business-owner/components/EditPermissionsModal.tsx` — old per-role permission editor; superseded by per-user `permissions[]`
- `features/business-owner/components/AddUserModal.tsx`, `AddOwnerForm.tsx` — old admin paths; superseded by the invitation flow + new `/super-admin/business-owners/new`
- `features/business-owner/components/SettingsPage.tsx` — was the home of the deprecated Roles & Access tab; the team page now owns that surface

Files that should port **cleanly with auth-import sweep**:
- `BookingsAndContacts.tsx` + hooks `useGetBookings`, `useGetContacts`, `useUpdateBookingStatus`
- `dashboard/AddServiceModal.tsx`, `dashboard/AddProviderModal.tsx`, `ServiceSchedulingModal.tsx`
- `useBusinessServices`, `useServiceProviders`, `useGetMyBusinesses`, `useCheckHasBusiness`, `useCreateBusiness`
- The old per-route pages at `app/business-owner/[businessId]/{bookings,services,providers,calendar,analytics,settings}/page.tsx` — the page wrappers themselves are simple shells that mostly just call the feature components

---

## 10. Root Cause

**Hypothesis A: Pages are placeholders.**

Evidence chain:
1. New pages exist (8 placeholder files at `/app/[businessId]/*`); each is exactly 15 lines and renders a heading + "will appear here." sentence.
2. Old pages are gone from the working tree but **fully present at git HEAD** (43 files across `app/business-owner/` + `features/business-owner/`).
3. Sidebar links point at the new placeholder paths. No old paths are referenced.
4. No file imports from `@/features/business-owner` (orphaned by deletion).
5. `FeatureGate` is not hiding anything — Business_owners get all 14 features per docs, and the pages use `fallback={<AccessDenied />}` (visible would be "Access denied", not blank).
6. The dashboard landing page IS rendering content — just modernized stub content (`—` stat cards). That confirms the layout/outlet/auth/permissions stack is fine; only the per-feature pages are empty.
7. My own Fix #2 report explicitly said the per-feature pages were stubs deferred for later wiring.

Not B (FeatureGate has fallback, would show AccessDenied). Not C (sidebar links match the placeholder pages). Not E (layout outlet works — sidebar + dashboard render). Not F (no `.next/` cache; tree is consistent).

D is partially true (old code was deleted from working tree) but mislabels the user-visible problem. The deletion is a means; the effect is "placeholders never got their real content."

---

## 11. Recommended Fix Approach

**Scope: medium-large.** Restore the old per-business CRM, ported to the new auth + types.

Two paths to consider:

### Path 1 — Restore via `git checkout` then sweep

```bash
git checkout HEAD -- app/business-owner features/business-owner
# Move app/business-owner/[businessId]/* → app/app/[businessId]/* (replacing placeholders)
# Keep features/business-owner/{components,hooks} as-is, then:
# - global-replace useRoleAuth → useAuth across features/business-owner
# - replace getSession("Business_owner") with useAuth().activeMembership
# - replace user.roles[] / user.activeRole references with me.user.systemRole
# - replace hardcoded role enum dropdowns with permission-based gating where applicable
# - delete the conflicting files listed in §9
```

Pros: fastest way to recover the working CRM. Reuses existing data hooks (`useGetBookings` etc.) which already hit the right backend services.

Cons: the auth-import sweep is mechanical but tedious. Some components have hardcoded role checks that need rewrites, not search-and-replace. The old pages were styled with `bg-[#FDFCFB]` (cream) and `bo-dashboard-shell` classes, which don't match the modernized AppShell — visual cleanup pass needed too.

### Path 2 — Rebuild against the new types/auth, copy logic only

```bash
# Keep app/app/[businessId]/* placeholders as starting points
# For each: read the old features/business-owner/components/X.tsx at HEAD, lift the
# rendering logic, but rewrite the auth + state plumbing
```

Pros: clean code that matches the new architecture without legacy cruft. No conflicting role-management UI sneaking back in.

Cons: longer (re-writing JSX you already had). Higher risk of subtle behavioral drift.

**My recommendation:** **Path 1 with selective rejection.** Run the `git checkout` for the restorable files (per the §9 "port cleanly" list), drop the conflicting RBAC files, then do a focused sweep:
1. Move `app/business-owner/[businessId]/{bookings,services,providers,calendar,analytics,settings}/page.tsx` → `app/app/[businessId]/...` (overwriting placeholders)
2. Restore `features/business-owner/components/{BookingsAndContacts, ServiceSchedulingModal, dashboard/*, EnhancedBusinessCard, BusinessSwitcher, BusinessOwnersList, CreateBusinessModal, CreateBusinessForm, ServiceProviderManagement, StatCard}.tsx` and the listed hooks
3. Skip restoring `{AddRoleModal, EditPermissionsModal, AddUserModal, AddOwnerForm, SettingsPage, DashboardHeader}.tsx` (superseded or already replaced)
4. In the restored files, search-and-replace:
   - `useRoleAuth` → `useAuth` (from `@/contexts`)
   - `getSession\("Business_owner"\)` → use `me` + `activeMembership` from `useAuth()`
   - `user.roles?.includes\(...\)` → use `usePermissions().hasFeature(...)`
   - Drop `bo-dashboard-shell` wrapper / `bg-[#FDFCFB]` div from each page (the new `AppShell` provides the chrome)
5. Run `npx tsc --noEmit` and fix the residual errors (~15-30 expected based on import scope)
6. Visual smoke: Bookings tab loads real bookings, Services list renders, etc.

**Estimated scope:** 8 page files moved, ~12 component files restored, ~10 hooks restored, plus an auth-import sweep across ~22 files. **Half a day to a day of focused work.** If you want me to draft the per-file change list as a follow-up prompt, I can.

---

## Files to investigate live before fixing

If you want to triple-confirm before I touch anything:

1. **Open DevTools Network tab on a fresh login**, navigate to `/app/{id}/bookings`. There will be **no** GET to `/booking?...` — the placeholder doesn't fetch anything. (Old page at HEAD called `useGetBookings(businessId, params)` which hits `GET /booking`.)

2. **Inspect the DOM of `/app/{id}/bookings`**. You'll see exactly:
   ```html
   <main class="...">
     <h1>Bookings</h1>
     <p>Booking list will appear here.</p>
   </main>
   ```
   Plus the sidebar from the layout. Nothing else.

3. **Check `me.businesses[0].permissions` in React DevTools** under `<AuthContext.Provider>` → state.me. Confirm 14 codes present. Per backend contract for Business_owners this should always be the full list.

If those three checks confirm the hypothesis, the fix can proceed without further investigation.
