import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getAllBusinessOwners() {
    this.logger.log('Fetching all business owners');

    try {
      const businessOwners = await this.prisma.user.findMany({
        where: {
          userRoles: { some: { role: { name: 'Business_owner' } } },
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          userRoles: { select: { role: { select: { name: true } } } },
          userBusinesses: {
            include: {
              business: {
                select: { id: true, name: true, slug: true, email: true, phone: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const result = businessOwners.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role.name),
        userRoles: undefined,
      }));

      this.logger.log(`Retrieved ${result.length} business owners`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack  = error instanceof Error ? error.stack  : undefined;
      this.logger.error(`Failed to fetch business owners: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async getBusinessOwnerById(id: string) {
    this.logger.log(`Fetching business owner with ID: ${id}`);

    try {
      const businessOwner = await this.prisma.user.findFirst({
        where: {
          id,
          userRoles: { some: { role: { name: 'Business_owner' } } },
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          userRoles: { select: { role: { select: { name: true } } } },
          userBusinesses: { include: { business: true } },
        },
      });

      if (!businessOwner) {
        this.logger.warn(`Business owner not found with ID: ${id}`);
        return null;
      }

      return {
        ...businessOwner,
        roles: businessOwner.userRoles.map((ur) => ur.role.name),
        userRoles: undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack  = error instanceof Error ? error.stack  : undefined;
      this.logger.error(`Failed to fetch business owner ${id}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    this.logger.log(`Updating user with ID: ${id}`);

    try {
      const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (dto.email && dto.email !== user.email) {
        const conflict = await this.prisma.user.findFirst({
          where: { email: dto.email, id: { not: id }, deletedAt: null },
        });
        if (conflict) throw new ConflictException('Email is already in use');
      }

      // Resolve role name strings to Role IDs for the join table
      let roleIds: string[] | undefined;
      if (dto.roles !== undefined) {
        const roles = await this.prisma.role.findMany({
          where: { name: { in: dto.roles } },
          select: { id: true, name: true },
        });

        const foundNames = new Set(roles.map((r) => r.name));
        const missing = dto.roles.filter((n) => !foundNames.has(n));
        if (missing.length) {
          throw new ConflictException(`Unknown role(s): ${missing.join(', ')}`);
        }
        roleIds = roles.map((r) => r.id);
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const { roles: _roles, ...scalarData } = dto;

        const updatedUser = await tx.user.update({
          where: { id },
          data: scalarData,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            userRoles: { select: { role: { select: { name: true } } } },
          },
        });

        // Replace all roles if provided
        if (roleIds !== undefined) {
          await tx.userRole.deleteMany({ where: { userId: id } });
          if (roleIds.length > 0) {
            await tx.userRole.createMany({
              data: roleIds.map((roleId) => ({ userId: id, roleId })),
            });
          }
        }

        return updatedUser;
      });

      this.logger.log(`User ${id} updated successfully`);
      return {
        ...updated,
        roles: updated.userRoles.map((ur) => ur.role.name),
        userRoles: undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack  = error instanceof Error ? error.stack  : undefined;
      this.logger.error(`Failed to update user ${id}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
