import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../permissions.constants';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require JWT user’s activeRole to have all listed permissions (AND).
 * Use after authentication, e.g. @UseGuards(JwtAuthGuard, PermissionsGuard).
 */
export const Permissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
