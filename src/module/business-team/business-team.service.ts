import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto/team-dtos';
import {
  ALL_FEATURES,
  FEATURE_DESCRIPTIONS,
  FeatureCode,
  SYSTEM_ROLES,
} from '../../common/constants/permissions';

@Injectable()
export class BusinessTeamService {
  private readonly logger = new Logger(BusinessTeamService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listMembers(businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new NotFoundException('Business not found');

    const memberships = await this.prisma.userBusiness.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    const userIds = memberships.map((m) => m.userId);
    const perms = userIds.length
      ? await this.prisma.userPermission.findMany({
          where: { businessId, userId: { in: userIds } },
          select: { userId: true, permission: true },
        })
      : [];

    const permsByUser = new Map<string, string[]>();
    for (const p of perms) {
      const arr = permsByUser.get(p.userId) ?? [];
      arr.push(p.permission);
      permsByUser.set(p.userId, arr);
    }

    return memberships.map((m) => ({
      userId: m.userId,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      phone: m.user.phone,
      role: m.role,
      status: m.status,
      permissions:
        m.role === SYSTEM_ROLES.BUSINESS_OWNER
          ? [...ALL_FEATURES]
          : (permsByUser.get(m.userId) ?? []),
      joinedAt: m.createdAt,
    }));
  }

  async addMember(businessId: string, dto: AddTeamMemberDto, addedBy: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!business) throw new NotFoundException('Business not found');

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyMember = await this.prisma.userBusiness.findUnique({
        where: {
          userId_businessId: { userId: existingUser.id, businessId },
        },
        select: { id: true },
      });
      if (alreadyMember) {
        throw new ConflictException(
          'User is already a member of this business',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const created = await tx.user.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            isActive: true,
            passwordChangeRequired: true,
            systemRole:
              dto.role === SYSTEM_ROLES.BUSINESS_OWNER
                ? SYSTEM_ROLES.BUSINESS_OWNER
                : SYSTEM_ROLES.SERVICE_PROVIDER,
          },
          select: { id: true },
        });
        userId = created.id;
      }

      await tx.userBusiness.create({
        data: { userId, businessId, role: dto.role, status: 'Pending' },
      });

      if (
        dto.role !== SYSTEM_ROLES.BUSINESS_OWNER &&
        dto.permissions.length > 0
      ) {
        await tx.userPermission.createMany({
          data: dto.permissions.map((p) => ({
            userId,
            businessId,
            permission: p,
            grantedBy: addedBy,
          })),
          skipDuplicates: true,
        });
      }

      return { userId };
    });

    this.logger.log(
      `Direct team member added: user ${result.userId} → business ${businessId} as ${dto.role} (Pending)`,
    );

    return { userId: result.userId, status: 'Pending' as const };
  }

  async updateMember(
    businessId: string,
    userId: string,
    dto: UpdateTeamMemberDto,
    actorId: string,
  ) {
    const membership = await this.prisma.userBusiness.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (dto.role && dto.role !== membership.role) {
      if (
        membership.role === SYSTEM_ROLES.BUSINESS_OWNER &&
        dto.role !== SYSTEM_ROLES.BUSINESS_OWNER
      ) {
        const ownerCount = await this.prisma.userBusiness.count({
          where: { businessId, role: SYSTEM_ROLES.BUSINESS_OWNER },
        });
        if (ownerCount === 1) {
          throw new BadRequestException(
            'Cannot demote the last Business_owner',
          );
        }
      }
      if (userId === actorId && dto.role !== SYSTEM_ROLES.BUSINESS_OWNER) {
        const ownerCount = await this.prisma.userBusiness.count({
          where: { businessId, role: SYSTEM_ROLES.BUSINESS_OWNER },
        });
        if (ownerCount === 1) {
          throw new BadRequestException(
            'Cannot demote yourself as the last Business_owner',
          );
        }
      }
    }

    if (dto.status && dto.status !== membership.status) {
      if (userId === actorId) {
        throw new BadRequestException(
          'You cannot change your own membership status',
        );
      }
      if (
        membership.role === SYSTEM_ROLES.BUSINESS_OWNER &&
        dto.status !== 'Active'
      ) {
        const activeOwners = await this.prisma.userBusiness.count({
          where: {
            businessId,
            role: SYSTEM_ROLES.BUSINESS_OWNER,
            status: 'Active',
          },
        });
        if (activeOwners <= 1) {
          throw new BadRequestException(
            'Cannot deactivate the last active Business_owner',
          );
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const data: {
        role?: string;
        status?: 'Pending' | 'Active' | 'Deactivated';
      } = {};
      if (dto.role) data.role = dto.role;
      if (dto.status) data.status = dto.status;
      if (Object.keys(data).length > 0) {
        await tx.userBusiness.update({
          where: { userId_businessId: { userId, businessId } },
          data,
        });
      }

      if (dto.permissions !== undefined) {
        await tx.userPermission.deleteMany({ where: { userId, businessId } });

        const targetRole = dto.role ?? membership.role;
        if (
          targetRole !== SYSTEM_ROLES.BUSINESS_OWNER &&
          dto.permissions.length > 0
        ) {
          await tx.userPermission.createMany({
            data: dto.permissions.map((p) => ({
              userId,
              businessId,
              permission: p,
              grantedBy: actorId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    return { success: true };
  }

  async removeMember(businessId: string, userId: string, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException(
        'You cannot remove yourself; ask another owner to do it',
      );
    }

    const membership = await this.prisma.userBusiness.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === SYSTEM_ROLES.BUSINESS_OWNER) {
      const ownerCount = await this.prisma.userBusiness.count({
        where: { businessId, role: SYSTEM_ROLES.BUSINESS_OWNER },
      });
      if (ownerCount === 1) {
        throw new BadRequestException('Cannot remove the last Business_owner');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({ where: { userId, businessId } });
      await tx.userBusiness.delete({
        where: { userId_businessId: { userId, businessId } },
      });
    });

    return { success: true };
  }

  availableFeatures() {
    return ALL_FEATURES.map((code: FeatureCode) => ({
      code,
      label: FEATURE_DESCRIPTIONS[code].label,
      description: FEATURE_DESCRIPTIONS[code].description,
    }));
  }
}
