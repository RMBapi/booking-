import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to users whose activeRole matches one of the given role names.
 * Role names are plain strings (e.g. 'Super_Admin', 'Business_owner').
 * Dynamically created roles are supported — no enum required.
 *
 * @example @Roles('Super_Admin', 'Business_owner')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
