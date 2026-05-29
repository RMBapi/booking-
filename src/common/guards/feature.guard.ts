import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { FeatureCode, SYSTEM_ROLES } from '../constants/permissions';
import { IS_PUBLIC_KEY } from '../../module/auth/decorators/public.decorator';

const HEADER_NAME = 'x-business-id';

type FeatureGuardRequest = {
  user?: { id: string; systemRole?: string };
  params?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  businessId?: string;
  userBusinessRole?: string;
};

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<FeatureCode[]>(
      FEATURE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<FeatureGuardRequest>();
    const user = req.user as { id: string; systemRole?: string } | undefined;
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.systemRole === SYSTEM_ROLES.SUPER_ADMIN) {
      req.businessId = this.resolveBusinessId(req);
      return true;
    }

    const businessId = this.resolveBusinessId(req);
    if (!businessId) {
      throw new BadRequestException(
        'X-Business-Id header or business id path param required',
      );
    }

    const membership = await this.prisma.userBusiness.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { role: true, status: true },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this business');
    }
    if (membership.status !== 'Active') {
      throw new ForbiddenException(
        membership.status === 'Pending'
          ? 'Your membership is pending activation by the business owner'
          : 'Your membership has been deactivated by the business owner',
      );
    }

    req.businessId = businessId;
    req.userBusinessRole = membership.role;

    if (membership.role === SYSTEM_ROLES.BUSINESS_OWNER) {
      return true;
    }

    const granted = await this.prisma.userPermission.findMany({
      where: {
        userId: user.id,
        businessId,
        permission: { in: required },
      },
      select: { permission: true },
    });
    const grantedSet = new Set(granted.map((g) => g.permission));
    const missing = required.filter((f) => !grantedSet.has(f));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing required feature(s): ${missing.join(', ')}`,
      );
    }

    return true;
  }

  private resolveBusinessId(req: {
    params?: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const header = req.headers[HEADER_NAME];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    if (fromHeader) return fromHeader;
    return req.params?.id;
  }
}
