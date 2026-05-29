import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateOwnBusinessDto } from './dto/create-own-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessQueryDto } from './dto/business-query.dto';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateShortId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(3);
    return Array.from(randomBytes)
      .map((b) => chars[b % chars.length])
      .join('');
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    for (let i = 0; i < 10; i++) {
      const existing = await this.prisma.business.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      slug = `${baseSlug}-${this.generateShortId()}`;
    }
    return `${baseSlug}-${Date.now().toString(36)}`;
  }

  async create(dto: CreateBusinessDto, userId: string) {
    const baseSlug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.name);
    const slug = await this.generateUniqueSlug(baseSlug);

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: dto.name,
          description: dto.description,
          logo: dto.logo,
          image: dto.image,
          backupImage: dto.backupImage,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          slug,
        },
      });

      await tx.userBusiness.create({
        data: {
          userId,
          businessId: business.id,
          role: SYSTEM_ROLES.BUSINESS_OWNER,
        },
      });

      return business;
    });
  }

  /**
   * Stage-5 of the new owner onboarding flow. Self-serve business creation
   * for an authenticated `Business_owner` who doesn't yet belong to one.
   * Refuses if the caller already has a UserBusiness row — owner-with-many-
   * businesses is not supported via this endpoint (use the team flows for
   * that).
   */
  async onboardOwnBusiness(dto: CreateOwnBusinessDto, userId: string) {
    const existing = await this.prisma.userBusiness.findFirst({
      where: { userId, business: { deletedAt: null } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'You already have a business. Multiple businesses per owner are not supported via this endpoint.',
      );
    }

    const slugConflict = await this.prisma.business.findUnique({
      where: { slug: dto.slug },
      select: { id: true, deletedAt: true },
    });
    if (slugConflict && !slugConflict.deletedAt) {
      throw new ConflictException('A business with that slug already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          logo: dto.logo,
          image: dto.image,
          backupImage: dto.backupImage,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          image: true,
          backupImage: true,
          email: true,
          phone: true,
          address: true,
          createdAt: true,
        },
      });

      await tx.userBusiness.create({
        data: {
          userId,
          businessId: business.id,
          role: SYSTEM_ROLES.BUSINESS_OWNER,
        },
      });

      return business;
    });
  }

  async findByUserId(userId: string) {
    const ubs = await this.prisma.userBusiness.findMany({
      where: { userId, business: { deletedAt: null } },
      include: { business: true },
    });
    return ubs.map((ub) => ub.business);
  }

  async checkUserHasBusiness(userId: string): Promise<boolean> {
    const count = await this.prisma.userBusiness.count({
      where: { userId, business: { deletedAt: null } },
    });
    return count > 0;
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findFirst({
      where: { id, deletedAt: null },
    });
    if (!business)
      throw new NotFoundException(`Business with ID ${id} not found`);
    return business;
  }

  async findOneBySlug(slug: string) {
    const business = await this.prisma.business.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!business)
      throw new NotFoundException(`Business with slug ${slug} not found`);
    return business;
  }

  async findPublicServicesBySlug(slug: string, page = 1, limit = 100) {
    const business = await this.findOneBySlug(slug);

    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      status: 'Active',
      isActive: true,
      businessServices: { some: { businessId: business.id } },
    };

    const total = await this.prisma.service.count({ where });
    const totalPages = Math.ceil(total / limit);
    if (page > totalPages && totalPages > 0) page = totalPages;
    if (page < 1) page = 1;
    const skip = (page - 1) * limit;

    const data = await this.prisma.service.findMany({
      where,
      skip,
      take: limit,
      include: {
        serviceProviders: {
          where: { deletedAt: null },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const meta = this.paginationService.buildMeta(page, limit, total);
    return { data, meta, businessId: business.id };
  }

  async findPublicServiceProvidersBySlug(slug: string, serviceId: string) {
    const business = await this.findOneBySlug(slug);

    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
        status: 'Active',
        isActive: true,
        businessServices: { some: { businessId: business.id } },
      },
      include: {
        serviceProviders: {
          where: { deletedAt: null },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with ID ${serviceId} not found for this business`,
      );
    }

    const providers = (service.serviceProviders || []).map((p) => ({
      id: p.id,
      userId: p.userId,
      firstName: p.user?.firstName,
      lastName: p.user?.lastName,
      description: p.description ?? null,
      impUrl: p.impUrl ?? null,
    }));

    const showProvider =
      Boolean(service.allowCustomerChooseProvider) && providers.length > 0;

    return {
      businessId: business.id,
      serviceId: service.id,
      showProvider,
      providers: showProvider ? providers : [],
    };
  }

  async update(id: string, dto: UpdateBusinessDto) {
    await this.findOne(id);
    try {
      return await this.prisma.business.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          logo: dto.logo,
          image: dto.image,
          backupImage: dto.backupImage,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          slug: dto.slug,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Business with this slug already exists');
      }
      throw error;
    }
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.business.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return {
      success: true,
      statusCode: 200,
      message: 'Business deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async findAll(queryDto: BusinessQueryDto) {
    const paginationOptions =
      this.paginationService.buildPaginationOptions(queryDto);
    const where: Prisma.BusinessWhereInput = { deletedAt: null };

    if (queryDto.slug)
      where.slug = { contains: queryDto.slug, mode: 'insensitive' };
    if (queryDto.name)
      where.name = { contains: queryDto.name, mode: 'insensitive' };
    if (queryDto.search) {
      where.OR = [
        { name: { contains: queryDto.search, mode: 'insensitive' } },
        { slug: { contains: queryDto.search, mode: 'insensitive' } },
        { description: { contains: queryDto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.business.findMany({ where, ...paginationOptions }),
      this.prisma.business.count({ where }),
    ]);

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const meta = this.paginationService.buildMeta(page, limit, total);
    return { data, meta };
  }
}
