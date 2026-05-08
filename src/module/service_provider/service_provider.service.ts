import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateServiceProviderDto } from './dto/create-service_provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service_provider.dto';
import { ServiceProviderQueryDto } from './dto/service_provider-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceProviderService {
  private readonly logger = new Logger(ServiceProviderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(
    createServiceProviderDto: CreateServiceProviderDto,
    businessId: string,
  ) {
    // Verify business exists
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Verify service exists and belongs to business
    const businessService = await this.prisma.businessService.findFirst({
      where: {
        businessId,
        serviceId: createServiceProviderDto.serviceId,
        service: {
          deletedAt: null,
        },
      },
    });

    if (!businessService) {
      throw new NotFoundException(
        `Service with ID ${createServiceProviderDto.serviceId} not found for this business`,
      );
    }

    // Verify user exists
    const user = await this.prisma.user.findFirst({
      where: { id: createServiceProviderDto.userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createServiceProviderDto.userId} not found`,
      );
    }

    const serviceProvider = await this.prisma.serviceProvider.create({
      data: {
        businessId,
        serviceId: createServiceProviderDto.serviceId,
        userId: createServiceProviderDto.userId,
        description: createServiceProviderDto.description,
        impUrl: createServiceProviderDto.impUrl,
      },
    });

    return serviceProvider;
  }

  async findOne(id: string, businessId: string) {
    const serviceProvider = await this.prisma.serviceProvider.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!serviceProvider) {
      throw new NotFoundException(
        `Service provider with ID ${id} not found for this business`,
      );
    }

    return serviceProvider;
  }

  async update(
    id: string,
    updateServiceProviderDto: UpdateServiceProviderDto,
    businessId: string,
  ) {
    await this.findOne(id, businessId); // Check if service provider exists and belongs to business

    const updateData: Prisma.ServiceProviderUpdateInput = {
      description: updateServiceProviderDto.description,
      impUrl: updateServiceProviderDto.impUrl,
    };

    if (updateServiceProviderDto.serviceId) {
      // Verify service exists and belongs to business
      const businessService = await this.prisma.businessService.findFirst({
        where: {
          businessId,
          serviceId: updateServiceProviderDto.serviceId,
          service: {
            deletedAt: null,
          },
        },
      });

      if (!businessService) {
        throw new NotFoundException(
          `Service with ID ${updateServiceProviderDto.serviceId} not found for this business`,
        );
      }

      updateData.service = {
        connect: { id: updateServiceProviderDto.serviceId },
      };
    }

    if (updateServiceProviderDto.userId) {
      // Verify user exists
      const user = await this.prisma.user.findFirst({
        where: { id: updateServiceProviderDto.userId, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateServiceProviderDto.userId} not found`,
        );
      }

      updateData.user = {
        connect: { id: updateServiceProviderDto.userId },
      };
    }

    const serviceProvider = await this.prisma.serviceProvider.update({
      where: { id },
      data: updateData,
    });

    return serviceProvider;
  }

  async delete(id: string, businessId: string) {
    await this.findOne(id, businessId); // Check if service provider exists and belongs to business

    await this.prisma.serviceProvider.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Service provider deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async findAll(queryDto: ServiceProviderQueryDto, businessId: string) {
    const paginationOptions =
      this.paginationService.buildPaginationOptions(queryDto);

    const where: Prisma.ServiceProviderWhereInput = {
      businessId,
      deletedAt: null,
    };

    if (queryDto.serviceId) {
      where.serviceId = queryDto.serviceId;
    }

    if (queryDto.userId) {
      where.userId = queryDto.userId;
    }

    if (queryDto.search) {
      where.OR = [
        { description: { contains: queryDto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceProvider.findMany({
        where,
        ...paginationOptions,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.serviceProvider.count({ where }),
    ]);

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const meta = this.paginationService.buildMeta(page, limit, total);

    return { data, meta };
  }
}
