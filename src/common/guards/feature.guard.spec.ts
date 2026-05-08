import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGuard } from './feature.guard';
import { FEATURES, SYSTEM_ROLES } from '../constants/permissions';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { IS_PUBLIC_KEY } from '../../module/auth/decorators/public.decorator';

function makeContext({
  user,
  headers = {},
  params = {},
}: {
  user?: { id?: string; systemRole?: string };
  headers?: Record<string, string | undefined>;
  params?: Record<string, string>;
}) {
  const req: any = { user, headers, params };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

function makeReflector(features: string[] | undefined, isPublic = false) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === FEATURE_KEY) return features;
      return undefined;
    }),
  } as unknown as Reflector;
}

describe('FeatureGuard', () => {
  const businessId = 'b1';

  function buildGuard({
    membership = null,
    permissions = [] as string[],
  }: {
    membership?: { role: string; status?: 'Pending' | 'Active' | 'Deactivated' } | null;
    permissions?: string[];
  } = {}) {
    const resolved = membership
      ? { status: 'Active' as const, ...membership }
      : null;
    const prisma: any = {
      userBusiness: { findUnique: jest.fn().mockResolvedValue(resolved) },
      userPermission: {
        findMany: jest
          .fn()
          .mockResolvedValue(permissions.map((permission) => ({ permission }))),
      },
    };
    return {
      prisma,
      guard: (reflector: Reflector) => new FeatureGuard(reflector, prisma),
    };
  }

  it('allows public routes regardless of user', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS], true);
    const { guard } = buildGuard();
    const result = await guard(reflector).canActivate(makeContext({}));
    expect(result).toBe(true);
  });

  it('allows when no features are required', async () => {
    const reflector = makeReflector(undefined);
    const { guard } = buildGuard();
    const result = await guard(reflector).canActivate(
      makeContext({ user: { id: 'u1', systemRole: 'Service_Provider' } }),
    );
    expect(result).toBe(true);
  });

  it('Super_Admin bypasses feature check', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { prisma, guard } = buildGuard();
    const result = await guard(reflector).canActivate(
      makeContext({
        user: { id: 'u1', systemRole: SYSTEM_ROLES.SUPER_ADMIN },
        headers: { 'x-business-id': businessId },
      }),
    );
    expect(result).toBe(true);
    expect(prisma.userBusiness.findUnique).not.toHaveBeenCalled();
  });

  it('Business_owner membership bypasses UserPermission', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { prisma, guard } = buildGuard({
      membership: { role: SYSTEM_ROLES.BUSINESS_OWNER },
    });
    const result = await guard(reflector).canActivate(
      makeContext({
        user: { id: 'u1', systemRole: SYSTEM_ROLES.BUSINESS_OWNER },
        headers: { 'x-business-id': businessId },
      }),
    );
    expect(result).toBe(true);
    expect(prisma.userPermission.findMany).not.toHaveBeenCalled();
  });

  it('Service_Provider with required permission is allowed', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { guard } = buildGuard({
      membership: { role: SYSTEM_ROLES.SERVICE_PROVIDER },
      permissions: [FEATURES.VIEW_BOOKINGS],
    });
    const result = await guard(reflector).canActivate(
      makeContext({
        user: { id: 'u1', systemRole: SYSTEM_ROLES.SERVICE_PROVIDER },
        headers: { 'x-business-id': businessId },
      }),
    );
    expect(result).toBe(true);
  });

  it('Service_Provider without required permission is forbidden', async () => {
    const reflector = makeReflector([FEATURES.MANAGE_BOOKINGS]);
    const { guard } = buildGuard({
      membership: { role: SYSTEM_ROLES.SERVICE_PROVIDER },
      permissions: [FEATURES.VIEW_BOOKINGS],
    });
    await expect(
      guard(reflector).canActivate(
        makeContext({
          user: { id: 'u1', systemRole: SYSTEM_ROLES.SERVICE_PROVIDER },
          headers: { 'x-business-id': businessId },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws BadRequest when X-Business-Id is missing', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { guard } = buildGuard();
    await expect(
      guard(reflector).canActivate(
        makeContext({
          user: { id: 'u1', systemRole: SYSTEM_ROLES.SERVICE_PROVIDER },
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws Forbidden when user is not a member of the business', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { guard } = buildGuard({ membership: null });
    await expect(
      guard(reflector).canActivate(
        makeContext({
          user: { id: 'u1', systemRole: SYSTEM_ROLES.SERVICE_PROVIDER },
          headers: { 'x-business-id': businessId },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('falls back to params.id when no header is provided', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { prisma, guard } = buildGuard({
      membership: { role: SYSTEM_ROLES.BUSINESS_OWNER },
    });
    await guard(reflector).canActivate(
      makeContext({
        user: { id: 'u1', systemRole: SYSTEM_ROLES.BUSINESS_OWNER },
        params: { id: businessId },
      }),
    );
    expect(prisma.userBusiness.findUnique).toHaveBeenCalledWith({
      where: { userId_businessId: { userId: 'u1', businessId } },
      select: { role: true, status: true },
    });
  });

  it('forbids when membership status is Pending', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { guard } = buildGuard({
      membership: { role: SYSTEM_ROLES.SERVICE_PROVIDER, status: 'Pending' },
    });
    await expect(
      guard(reflector).canActivate(
        makeContext({
          user: { id: 'u1', systemRole: SYSTEM_ROLES.SERVICE_PROVIDER },
          headers: { 'x-business-id': businessId },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids when membership status is Deactivated', async () => {
    const reflector = makeReflector([FEATURES.VIEW_BOOKINGS]);
    const { guard } = buildGuard({
      membership: {
        role: SYSTEM_ROLES.SERVICE_PROVIDER,
        status: 'Deactivated',
      },
    });
    await expect(
      guard(reflector).canActivate(
        makeContext({
          user: { id: 'u1', systemRole: SYSTEM_ROLES.SERVICE_PROVIDER },
          headers: { 'x-business-id': businessId },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
