import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getAllBusinessOwners() {
    this.logger.log('Fetching all business owners');

    try {
      const businessOwners = await this.prisma.user.findMany({
        where: {
          roles: { has: UserRole.Business_owner },
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
          createdAt: true,
          userBusinesses: {
            include: {
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Retrieved ${businessOwners.length} business owners`);
      return businessOwners;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch business owners: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async getBusinessOwnerById(id: string) {
    this.logger.log(`Fetching business owner with ID: ${id}`);

    try {
      const businessOwner = await this.prisma.user.findFirst({
        where: {
          id,
          roles: { has: UserRole.Business_owner },
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
          createdAt: true,
          userBusinesses: {
            include: {
              business: true,
            },
          },
        },
      });

      if (!businessOwner) {
        this.logger.warn(`Business owner not found with ID: ${id}`);
      } else {
        this.logger.log(`Business owner found: ${businessOwner.email}`);
      }

      return businessOwner;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch business owner ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    roles: UserRole[];
  }>) {
    this.logger.log(`Updating user with ID: ${id}`);

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new ConflictException('User not found');
      }

      // If email is being updated, check if it's already in use
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email: updateData.email,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (existingUser) {
          this.logger.warn(
            `Email ${updateData.email} is already in use by another user`,
          );
          throw new ConflictException('Email is already in use');
        }
      }

      this.logger.log(`Updating user ${id} with data: ${JSON.stringify(updateData)}`);

      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`User ${id} updated successfully`);
      return updated;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update user ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
