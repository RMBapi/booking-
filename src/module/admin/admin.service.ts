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

  async toggleBusinessOwnerStatus(id: string) {
    this.logger.log(`Toggling business owner status for ID: ${id}`);

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          roles: { has: UserRole.Business_owner },
          deletedAt: null,
        },
      });

      if (!user) {
        this.logger.warn(`Business owner not found with ID: ${id}`);
        throw new ConflictException('Business owner not found');
      }

      const newStatus = !user.isActive;
      this.logger.log(
        `Changing business owner ${id} status from ${user.isActive} to ${newStatus}`,
      );

      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: newStatus,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
        },
      });

      this.logger.log(
        `Business owner ${id} status updated successfully to ${newStatus}`,
      );
      return updated;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to toggle business owner status ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
