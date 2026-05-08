import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SYSTEM_ROLES } from '../constants/permissions';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (req.user?.systemRole !== SYSTEM_ROLES.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin only');
    }
    return true;
  }
}
