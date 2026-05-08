# RBAC

## Roles
Four system roles: `Super_Admin`, `Business_owner`, `Service_Provider`, `Customer`.
A user has exactly one system role, set at registration and stored on `User.systemRole`.

`User.passwordChangeRequired` is a separate flag, not a role. It's set when a
Super_Admin provisions an account on the user's behalf (the admin chose the
password); the next login surfaces the flag and the frontend redirects to
`POST /auth/change-password` before doing anything else. The flag is cleared
on successful password change.

## Per-business membership
`UserBusiness` links users to businesses with a role: `Business_owner` or
`Service_Provider`. A user can be in multiple businesses.

## Per-user permissions
Inside a business, the `Business_owner` toggles feature flags for each
`Service_Provider` via the team management UI. Stored in `UserPermission`.
`Business_owner`s always have all features (no `UserPermission` rows
needed — the guard short-circuits).

## Adding a new feature
1. Add a code to `FEATURES` in `src/common/constants/permissions.ts`
2. Add a label/description to `FEATURE_DESCRIPTIONS`
3. Add `@RequireFeature('your_code')` to the controller method(s)
4. Existing users with `manage_team` permission can grant the new feature
   via the UI. To grant by default, update `DEFAULT_PERMISSIONS`.
