import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';
import { InvitationService } from './invitation.service';
import { setRefreshCookie } from '../../common/cookies';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

class ActivationDto {
  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

const REFRESH_TTL_DAYS = 7;
const REFRESH_TOKEN_BYTES = 64;

function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

@ApiTags('Activation')
@Controller('activation')
export class ActivationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get(':token')
  @ApiOperation({ summary: 'Validate an activation token' })
  @ApiResponse({ status: 200 })
  async view(@Param('token') token: string) {
    const inv = await this.invitationService.findByTokenPublic(token);
    if (!inv) return { valid: false };

    const expired = inv.expiresAt.getTime() < Date.now();
    const consumed = !!inv.acceptedAt || !!inv.revokedAt;

    if (expired || consumed) {
      return { valid: false, expired, consumed };
    }

    const [user, business] = await Promise.all([
      this.prisma.user.findFirst({
        where: { email: inv.email, deletedAt: null },
        select: { firstName: true },
      }),
      this.prisma.business.findUnique({
        where: { id: inv.businessId },
        select: { name: true },
      }),
    ]);

    return {
      valid: true,
      email: inv.email,
      businessName: business?.name,
      firstName: user?.firstName,
    };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate an account by setting the password' })
  async activate(
    @Param('token') token: string,
    @Body() dto: ActivationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const inv = await this.invitationService.findByTokenPublic(token);
    if (!inv) throw new BadRequestException('Invalid activation token');

    if (inv.acceptedAt)
      throw new BadRequestException('Activation already used');
    if (inv.revokedAt) throw new BadRequestException('Activation revoked');
    if (inv.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Activation expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: inv.email, deletedAt: null },
      select: { id: true, email: true, systemRole: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true },
      });
      await tx.userBusiness.upsert({
        where: {
          userId_businessId: { userId: user.id, businessId: inv.businessId },
        },
        create: {
          userId: user.id,
          businessId: inv.businessId,
          role:
            inv.role === SYSTEM_ROLES.BUSINESS_OWNER
              ? SYSTEM_ROLES.BUSINESS_OWNER
              : SYSTEM_ROLES.SERVICE_PROVIDER,
        },
        update: {},
      });
      await this.invitationService.markAccepted(tx, inv.id, user.id);
    });

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    const refreshRaw = crypto
      .randomBytes(REFRESH_TOKEN_BYTES)
      .toString('base64url');
    const refreshExpiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: crypto.randomUUID(),
        tokenHash: hashRefreshToken(refreshRaw),
        expiresAt: refreshExpiresAt,
        userAgent: req.headers['user-agent'] ?? null,
        ip: req.ip ?? null,
      },
    });
    setRefreshCookie(res, refreshRaw, {
      maxAgeSeconds: Math.floor(
        (refreshExpiresAt.getTime() - Date.now()) / 1000,
      ),
    });

    return { accessToken };
  }
}
