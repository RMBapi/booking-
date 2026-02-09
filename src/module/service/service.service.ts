import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Verify that the user owns the business
   */
  private async verifyBusinessOwnership(businessId: string, userId: string): Promise<void> {
    const ownerLink = await this.prisma.userBusiness.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!ownerLink) {
      throw new ForbiddenException("You don't have access to this business");
    }
  }

  async create(createServiceDto: CreateServiceDto, businessId: string, userId: string) {
    // Verify business exists
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Verify user owns the business
    await this.verifyBusinessOwnership(businessId, userId);

    const service = await this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        price: createServiceDto.price,
        status: createServiceDto.status,
        priceDisplayMode: createServiceDto.priceDisplayMode ?? false,
        isActive: createServiceDto.isActive ?? true,
        businessServices: {
          create: {
            businessId,
          },
        },
      },
    });

    return service;
  }

  async findOne(id: string, businessId: string, userId: string) {
    // Verify user owns the business
    await this.verifyBusinessOwnership(businessId, userId);

    const businessService = await this.prisma.businessService.findFirst({
      where: {
        businessId,
        serviceId: id,
        service: {
          deletedAt: null,
        },
      },
      include: {
        service: {
          include: {
            schedulers: true,
          },
        },
      },
    });

    if (!businessService) {
      throw new NotFoundException(`Service with ID ${id} not found for this business`);
    }

    return businessService.service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, businessId: string, userId: string) {
    await this.findOne(id, businessId, userId); // Check if service exists and belongs to business

    const service = await this.prisma.service.update({
      where: { id },
      data: {
        name: updateServiceDto.name,
        description: updateServiceDto.description,
        price: updateServiceDto.price,
        status: updateServiceDto.status,
        priceDisplayMode: updateServiceDto.priceDisplayMode,
        isActive: updateServiceDto.isActive,
      },
    });

    return service;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findOne(id, businessId, userId); // Check if service exists and belongs to business

    await this.prisma.service.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Service deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async findAll(queryDto: ServiceQueryDto, businessId: string, userId: string) {
    // Verify user owns the business
    await this.verifyBusinessOwnership(businessId, userId);

    const paginationOptions = this.paginationService.buildPaginationOptions(queryDto);

    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      businessServices: {
        some: {
          businessId,
        },
      },
    };

    // Search filter: searches in both name and description (case-insensitive)
    // Only apply if search parameter is provided and not empty
    if (queryDto.search && queryDto.search.trim() !== '') {
      where.OR = [
        { name: { contains: queryDto.search, mode: 'insensitive' } },
        { description: { contains: queryDto.search, mode: 'insensitive' } },
      ];
    }

    // Status filter: only apply if status is provided
    // Empty string is already converted to undefined by the DTO Transform decorator
    if (queryDto.status !== undefined && queryDto.status !== null) {
      where.status = queryDto.status;
    }

    // isActive filter: only apply if isActive is explicitly provided (not undefined)
    // Omitted parameter means "all" so we don't filter
    if (queryDto.isActive !== undefined && queryDto.isActive !== null) {
      where.isActive = queryDto.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          schedulers: true,
        },
        ...paginationOptions,
      }),
      this.prisma.service.count({ where }),
    ]);

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const meta = this.paginationService.buildMeta(page, limit, total);

    return { data, meta };
  }
}
