import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { InvitationService } from '../invitation/invitation.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MeResponseDto } from './dto/me-response.dto';
import {
  ALL_FEATURES,
  ALL_SYSTEM_ROLES,
  SYSTEM_ROLES,
} from '../../common/constants/permissions';

export interface ChangePasswordResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    systemRole: string;
    passwordChangeRequired: boolean;
  };
}

export interface RefreshContext {
  userAgent?: string;
  ip?: string;
}

export interface RotatedTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

const REFRESH_TTL_DAYS = 7;
const REFRESH_TOKEN_BYTES = 64;

function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function newFamilyId(): string {
  return crypto.randomUUID();
}

function newRefreshTokenRaw(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private invitationService: InvitationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    if (registerDto.role === SYSTEM_ROLES.SUPER_ADMIN) {
      throw new ConflictException(
        'Super_Admin accounts cannot be created through registration',
      );
    }

    if (!ALL_SYSTEM_ROLES.includes(registerDto.role as any)) {
      throw new ConflictException(`Unknown role '${registerDto.role}'`);
    }

    const existing = await this.prisma.user.findFirst({
      where: { email: registerDto.email, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const isActive = registerDto.role === SYSTEM_ROLES.CUSTOMER;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email,
          phone: registerDto.phone,
          passwordHash,
          isActive,
          systemRole: registerDto.role,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          systemRole: true,
          passwordChangeRequired: true,
        },
      });

      if (registerDto.role === SYSTEM_ROLES.BUSINESS_OWNER) {
        const baseName =
          registerDto.businessName?.trim() ||
          `${registerDto.firstName} ${registerDto.lastName}'s Business`.trim();
        const baseSlug =
          slugify(baseName) || `business-${created.id.slice(0, 8)}`;
        const uniqueSlug = await this.findUniqueSlug(tx, baseSlug);

        const business = await tx.business.create({
          data: { name: baseName, slug: uniqueSlug },
          select: { id: true },
        });

        await tx.userBusiness.create({
          data: {
            userId: created.id,
            businessId: business.id,
            role: SYSTEM_ROLES.BUSINESS_OWNER,
          },
        });
      } else if (registerDto.role === SYSTEM_ROLES.CUSTOMER) {
        if (!registerDto.businessSiteSlug) {
          throw new ConflictException(
            'businessSiteSlug is required when registering a Customer',
          );
        }
        const business = await tx.business.findFirst({
          where: { slug: registerDto.businessSiteSlug, deletedAt: null },
          select: { id: true, name: true, slug: true },
        });
        if (!business) {
          throw new ConflictException('Business not found for provided slug');
        }
        let site = await tx.businessSite.findFirst({
          where: {
            businessId: business.id,
            slug: registerDto.businessSiteSlug,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!site) {
          site = await tx.businessSite.create({
            data: {
              businessId: business.id,
              name: `${business.name} Site`,
              slug: business.slug,
            },
            select: { id: true },
          });
        }
        await tx.customerBusinessSite.create({
          data: { userId: created.id, businessSiteId: site.id },
        });
      }

      return created;
    });

    if (registerDto.invitationToken) {
      try {
        await this.invitationService.acceptDuringRegister(
          registerDto.invitationToken,
          user.id,
          user.email,
        );
      } catch (err) {
        this.logger.warn(
          `Auto-accept failed for ${user.id}: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        systemRole: user.systemRole,
        passwordChangeRequired: user.passwordChangeRequired,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        isActive: true,
        systemRole: true,
        passwordChangeRequired: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // Check active *after* the password compare so the response time of an
    // inactive-account login matches a password-mismatch response.
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is inactive. Contact your administrator.',
      );
    }

    if (user.systemRole === SYSTEM_ROLES.CUSTOMER) {
      if (!loginDto.businessSiteSlug) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const customerSite = await this.prisma.customerBusinessSite.findFirst({
        where: {
          userId: user.id,
          businessSite: { slug: loginDto.businessSiteSlug, deletedAt: null },
        },
        select: { id: true },
      });
      if (!customerSite) throw new UnauthorizedException('Invalid credentials');
    } else if (user.systemRole !== SYSTEM_ROLES.SUPER_ADMIN) {
      // Business_owner / Service_Provider: require at least one Active membership
      // so we can give a clear, status-specific error before they hit the dashboard.
      const memberships = await this.prisma.userBusiness.findMany({
        where: { userId: user.id, business: { deletedAt: null } },
        select: { status: true },
      });
      if (memberships.length > 0) {
        const hasActive = memberships.some((m) => m.status === 'Active');
        if (!hasActive) {
          const allDeactivated = memberships.every(
            (m) => m.status === 'Deactivated',
          );
          throw new UnauthorizedException(
            allDeactivated
              ? 'Your account has been deactivated. Contact your business owner.'
              : 'Your account is pending activation by your business owner.',
          );
        }
      }
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        systemRole: user.systemRole,
        passwordChangeRequired: user.passwordChangeRequired,
      },
    };
  }

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        systemRole: true,
        passwordChangeRequired: true,
        createdAt: true,
        isActive: true,
        userBusinesses: {
          select: {
            role: true,
            status: true,
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const businessIds = user.userBusinesses
      .filter((ub) => ub.business && !ub.business.deletedAt)
      .map((ub) => ub.business.id);

    const permissions = businessIds.length
      ? await this.prisma.userPermission.findMany({
          where: { userId, businessId: { in: businessIds } },
          select: { businessId: true, permission: true },
        })
      : [];

    const permsByBusiness = new Map<string, string[]>();
    for (const p of permissions) {
      const list = permsByBusiness.get(p.businessId) ?? [];
      list.push(p.permission);
      permsByBusiness.set(p.businessId, list);
    }

    const businesses = user.userBusinesses
      .filter((ub) => ub.business && !ub.business.deletedAt)
      .map((ub) => ({
        id: ub.business.id,
        name: ub.business.name,
        slug: ub.business.slug,
        logo: ub.business.logo,
        role: ub.role,
        status: ub.status,
        permissions:
          ub.role === SYSTEM_ROLES.BUSINESS_OWNER
            ? [...ALL_FEATURES]
            : (permsByBusiness.get(ub.business.id) ?? []),
      }));

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        systemRole: user.systemRole,
        passwordChangeRequired: user.passwordChangeRequired,
        createdAt: user.createdAt,
      },
      businesses,
    };
  }

  /**
   * Change the password for the authenticated user. Validates the current
   * password, persists the new hash, clears `passwordChangeRequired`, revokes
   * every outstanding refresh token (so other devices are forced to log in
   * again), and issues a fresh access+refresh pair so the calling tab stays
   * signed in seamlessly.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ctx: RefreshContext = {},
  ): Promise<ChangePasswordResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordHash: true,
        isActive: true,
        systemRole: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const sameAsCurrent = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (sameAsCurrent) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    const familyId = newFamilyId();
    const refreshRaw = newRefreshTokenRaw();
    const refreshExpiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, passwordChangeRequired: false },
      });
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          familyId,
          tokenHash: hashRefreshToken(refreshRaw),
          expiresAt: refreshExpiresAt,
          userAgent: ctx.userAgent ?? null,
          ip: ctx.ip ?? null,
        },
      });
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    this.logger.log(`Password changed for user ${user.id}; refresh family rotated`);

    return {
      accessToken,
      refreshToken: refreshRaw,
      refreshTokenExpiresAt: refreshExpiresAt,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        systemRole: user.systemRole,
        passwordChangeRequired: false,
      },
    };
  }

  // ─── Refresh token lifecycle ─────────────────────────────────────────────

  async issueRefreshToken(
    userId: string,
    ctx: RefreshContext = {},
  ): Promise<{ token: string; expiresAt: Date }> {
    const familyId = newFamilyId();
    return this.persistRefreshToken(userId, familyId, ctx);
  }

  async rotateRefreshToken(
    rawToken: string,
    ctx: RefreshContext = {},
  ): Promise<RotatedTokenPair> {
    const tokenHash = hashRefreshToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    if (stored.revokedAt) {
      this.logger.warn(
        `Refresh-token reuse detected: family ${stored.familyId} for user ${stored.userId} — revoking entire family`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId, deletedAt: null },
      select: { id: true, email: true, isActive: true, systemRole: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    const { token: refreshToken, expiresAt: refreshTokenExpiresAt } =
      await this.prisma.$transaction(async (tx) => {
        const rawNew = newRefreshTokenRaw();
        const newExpiresAt = new Date(
          Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
        );
        const created = await tx.refreshToken.create({
          data: {
            userId: user.id,
            familyId: stored.familyId,
            tokenHash: hashRefreshToken(rawNew),
            expiresAt: newExpiresAt,
            userAgent: ctx.userAgent ?? null,
            ip: ctx.ip ?? null,
          },
        });
        await tx.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date(), replacedById: created.id },
        });
        return { token: rawNew, expiresAt: newExpiresAt };
      });

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  async logoutByRefreshToken(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashRefreshToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });
    if (!stored) return;
    await this.prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async persistRefreshToken(
    userId: string,
    familyId: string,
    ctx: RefreshContext,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = newRefreshTokenRaw();
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: hashRefreshToken(token),
        expiresAt,
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
      },
    });
    return { token, expiresAt };
  }

  private async findUniqueSlug(
    tx: {
      business: { findUnique: (args: any) => Promise<{ id: string } | null> };
    },
    base: string,
  ): Promise<string> {
    let slug = base;
    for (let i = 0; i < 10; i++) {
      const existing = await tx.business.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      const suffix = crypto.randomBytes(3).toString('hex');
      slug = `${base}-${suffix}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }
}
