import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateBusinessOwnerDto } from './dto/create-business-owner.dto';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

const ADMIN_USER_PROJECTION = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  isActive: true,
  systemRole: true,
  passwordChangeRequired: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AdminUserView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  systemRole: string;
  passwordChangeRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getAllBusinessOwners() {
    return this.prisma.user.findMany({
      where: { systemRole: SYSTEM_ROLES.BUSINESS_OWNER, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        systemRole: true,
        passwordChangeRequired: true,
        createdAt: true,
        userBusinesses: {
          select: {
            role: true,
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBusinessOwnerById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, systemRole: SYSTEM_ROLES.BUSINESS_OWNER, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        systemRole: true,
        passwordChangeRequired: true,
        createdAt: true,
        userBusinesses: { include: { business: true } },
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<AdminUserView> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id }, deletedAt: null },
      });
      if (conflict) throw new ConflictException('Email is already in use');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: ADMIN_USER_PROJECTION,
    });
  }

  /**
   * Stage-1 of the new owner onboarding flow. Creates only the User
   * row. No Business, no UserBusiness, no invitation, no email — the
   * Super_Admin shares the password out-of-band, then activates the
   * account via PATCH /admin/business-owners/:id/activation.
   */
  async createBusinessOwner(dto: CreateBusinessOwnerDto): Promise<AdminUserView> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A user with that email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        isActive: false,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: true,
      },
      select: ADMIN_USER_PROJECTION,
    });

    this.logger.log(
      `Super_Admin created Business_owner ${created.id} (${created.email}), inactive pending activation`,
    );

    return created;
  }

  /**
   * Toggle isActive for a Business_owner. Used by the dedicated
   * activation-toggle UX in the admin panel.
   */
  async setBusinessOwnerActivation(
    id: string,
    isActive: boolean,
  ): Promise<AdminUserView> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Business owner not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: ADMIN_USER_PROJECTION,
    });
  }
}
