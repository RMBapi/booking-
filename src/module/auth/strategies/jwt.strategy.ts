import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  /** Role name string (e.g. "Customer", "Super_Admin") — unchanged externally */
  activeRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        // Load roles via the dynamic UserRole join table
        userRoles: {
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const roleNames = user.userRoles.map((ur) => ur.role.name);

    // Verify the activeRole from the token still exists for this user
    if (!roleNames.includes(payload.activeRole)) {
      throw new UnauthorizedException('User no longer has the specified role');
    }

    // Return shape is the same as before; activeRole is still a plain string
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      roles: roleNames,           // string[] of all role names for this user
      activeRole: payload.activeRole,
    };
  }
}
