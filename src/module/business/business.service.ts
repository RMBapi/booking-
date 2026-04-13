import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessQueryDto } from './dto/business-query.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

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
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate a short random suffix (6 alphanumeric characters)
   * Uses Node.js crypto for cryptographically secure randomness
   */
  private generateShortId(): string {
    // Generate 6 random alphanumeric characters
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // Generate 3 random bytes (6 hex chars = 3 bytes)
    const randomBytes = crypto.randomBytes(3);
    return Array.from(randomBytes)
      .map((byte) => chars[byte % chars.length])
      .join('');
  }

  /**
   * Generate a unique slug by checking for conflicts and appending a random suffix if needed
   * This allows multiple businesses to have the same name (e.g., "Joe's Pizza" in different cities)
   * Uses short random IDs (e.g., "joes-pizza-a3f2k9") instead of sequential numbers for better uniqueness
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let attempts = 0;
    const maxAttempts = 10; // Safety limit to prevent infinite loops

    // Check if slug exists, if so, append a random suffix
    while (attempts < maxAttempts) {
      const existing = await this.prisma.business.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        // Slug is available
        return slug;
      }

      // Slug exists, try with a random suffix
      const shortId = this.generateShortId();
      slug = `${baseSlug}-${shortId}`;
      attempts++;
    }

    // Fallback: if somehow we can't find a unique slug after 10 attempts,
    // append timestamp as last resort (extremely unlikely)
    this.logger.warn(
      `Could not generate unique slug after ${maxAttempts} attempts for base: ${baseSlug}`,
    );
    return `${baseSlug}-${Date.now().toString(36)}`;
  }

  async create(createBusinessDto: CreateBusinessDto, userId: string) {
    this.logger.log(
      `Creating business: ${createBusinessDto.name} for user: ${userId}`,
    );

    try {
      // Auto-generate slug from business name if not provided
      // If slug is provided, use it; otherwise generate from name
      let baseSlug: string;
      if (createBusinessDto.slug) {
        // User provided a custom slug
        baseSlug = this.generateSlug(createBusinessDto.slug);
      } else {
        // Auto-generate from business name
        baseSlug = this.generateSlug(createBusinessDto.name);
      }

      // Generate a unique slug (handles conflicts by appending suffix)
      const slug = await this.generateUniqueSlug(baseSlug);
      this.logger.debug(
        `Generated unique slug: ${slug}${slug !== baseSlug ? ` (from base: ${baseSlug})` : ''}`,
      );

      // Create business and link to user in a transaction
      this.logger.debug('Starting database transaction');
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the business
        this.logger.debug('Creating business record');
        const business = await tx.business.create({
          data: {
            name: createBusinessDto.name,
            description: createBusinessDto.description,
            logo: createBusinessDto.logo,
            image: createBusinessDto.image,
            email: createBusinessDto.email,
            phone: createBusinessDto.phone,
            address: createBusinessDto.address,
            slug: slug,
          },
        });

        // Automatically create UserBusiness entry to link user with business
        this.logger.debug(`Linking business ${business.id} to user ${userId}`);
        await tx.userBusiness.create({
          data: {
            userId: userId,
            businessId: business.id,
          },
        });

        // Note: BusinessSite will be created automatically when the first customer registers
        this.logger.debug(
          `Business created. BusinessSite will be auto-created on first customer registration.`,
        );

        return business;
      });

      this.logger.log(
        `Business created successfully with ID: ${result.id}, slug: ${result.slug}`,
      );
      return result;
    } catch (error) {
      // This catch block now mainly handles non-slug related errors
      // since slug conflicts are handled by generateUniqueSlug
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create business: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findByUserId(userId: string) {
    const userBusinesses = await this.prisma.userBusiness.findMany({
      where: {
        userId: userId,
        business: {
          deletedAt: null,
        },
      },
      include: {
        business: true,
      },
    });

    return userBusinesses.map((ub) => ub.business);
  }

  async checkUserHasBusiness(userId: string): Promise<boolean> {
    const count = await this.prisma.userBusiness.count({
      where: {
        userId: userId,
        business: {
          deletedAt: null,
        },
      },
    });

    return count > 0;
  }

  async findOne(id: string) {
    this.logger.debug(`Finding business with ID: ${id}`);

    try {
      const business = await this.prisma.business.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!business) {
        this.logger.warn(`Business not found with ID: ${id}`);
        throw new NotFoundException(`Business with ID ${id} not found`);
      }

      this.logger.debug(`Business found: ${business.name} (${business.slug})`);
      return business;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find business ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findOneBySlug(slug: string) {
    const business = await this.prisma.business.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with slug ${slug} not found`);
    }

    return business;
  }

  /**
   * Get public services for a business by slug
   * Returns only active services (status === "Active" && isActive === true)
   */
  async findPublicServicesBySlug(
    slug: string,
    page: number = 1,
    limit: number = 100,
  ) {
    // First, find the business by slug
    const business = await this.findOneBySlug(slug);

    // Build where clause for services
    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      status: 'Active', // Only Active status
      isActive: true, // Only active services
      businessServices: {
        some: {
          businessId: business.id,
        },
      },
    };

    // Get total count first to validate page number
    const total = await this.prisma.service.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Validate and adjust page number if it exceeds total pages
    if (page > totalPages && totalPages > 0) {
      page = totalPages;
    } else if (page < 1) {
      page = 1;
    }

    // Build pagination options
    const skip = (page - 1) * limit;
    const take = limit;

    // Fetch services
    const data = await this.prisma.service.findMany({
      where,
      skip,
      take,
      include: {
        serviceProviders: {
          where: {
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Build pagination meta
    const meta = this.paginationService.buildMeta(page, limit, total);

    return {
      data,
      meta,
      businessId: business.id,
    };
  }

  /**
   * Get providers for a specific service by business slug (public)
   */
  async findPublicServiceProvidersBySlug(slug: string, serviceId: string) {
    const business = await this.findOneBySlug(slug);

    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
        status: 'Active',
        isActive: true,
        businessServices: {
          some: {
            businessId: business.id,
          },
        },
      },
      include: {
        serviceProviders: {
          where: {
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with ID ${serviceId} not found for this business`,
      );
    }

    const providers = (service.serviceProviders || []).map((provider) => ({
      id: provider.id,
      userId: provider.userId,
      firstName: provider.user?.firstName,
      lastName: provider.user?.lastName,
      description: provider.description ?? null,
      impUrl: provider.impUrl ?? null,
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

  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    await this.findOne(id); // Check if business exists

    try {
      const business = await this.prisma.business.update({
        where: { id },
        data: {
          name: updateBusinessDto.name,
          description: updateBusinessDto.description,
          logo: updateBusinessDto.logo,
          image: updateBusinessDto.image,
          email: updateBusinessDto.email,
          phone: updateBusinessDto.phone,
          address: updateBusinessDto.address,
          slug: updateBusinessDto.slug,
        },
      });
      return business;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Business with this slug already exists',
          );
        }
      }
      throw error;
    }
  }

  async delete(id: string) {
    this.logger.log(`Deleting business with ID: ${id}`);

    try {
      await this.findOne(id); // Check if business exists

      this.logger.debug(`Soft deleting business: ${id}`);
      await this.prisma.business.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      this.logger.log(`Business ${id} deleted successfully`);
      return {
        success: true,
        statusCode: 200,
        message: 'Business deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete business ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findAll(queryDto: BusinessQueryDto) {
    this.logger.log(
      `Finding all businesses with filters: ${JSON.stringify(queryDto)}`,
    );

    try {
      const paginationOptions =
        this.paginationService.buildPaginationOptions(queryDto);

      const where: Prisma.BusinessWhereInput = {
        deletedAt: null,
      };

      if (queryDto.slug) {
        where.slug = {
          contains: queryDto.slug,
          mode: 'insensitive',
        };
      }

      if (queryDto.name) {
        where.name = {
          contains: queryDto.name,
          mode: 'insensitive',
        };
      }

      if (queryDto.search) {
        where.OR = [
          { name: { contains: queryDto.search, mode: 'insensitive' } },
          { slug: { contains: queryDto.search, mode: 'insensitive' } },
          { description: { contains: queryDto.search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.business.findMany({
          where,
          ...paginationOptions,
        }),
        this.prisma.business.count({ where }),
      ]);

      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const meta = this.paginationService.buildMeta(page, limit, total);

      this.logger.log(`Found ${data.length} businesses (total: ${total})`);
      return { data, meta };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find businesses: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  // ============ Business Owner Management ============

  /**
   * Check if a user is an owner of a business
   */
  async isBusinessOwner(businessId: string, userId: string): Promise<boolean> {
    const ownerLink = await this.prisma.userBusiness.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });
    return !!ownerLink;
  }

  /**
   * Get all owners of a business
   */
  async getBusinessOwners(businessId: string) {
    this.logger.log(`Fetching owners for business: ${businessId}`);

    try {
      // Check if business exists
      await this.findOne(businessId);

      const userBusinesses = await this.prisma.userBusiness.findMany({
        where: {
          businessId,
          user: {
            deletedAt: null,
            userRoles: { some: { role: { name: 'Business_owner' } } },
          },
        },
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

      this.logger.log(
        `Found ${userBusinesses.length} owners for business ${businessId}`,
      );
      return userBusinesses.map((ub) => ub.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get business owners for ${businessId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Add an owner to a business
   */
  async addBusinessOwner(
    businessId: string,
    newOwnerUserId: string,
    currentUserId: string,
  ) {
    this.logger.log(
      `Adding owner ${newOwnerUserId} to business ${businessId} by user ${currentUserId}`,
    );

    try {
      // Check if business exists
      await this.findOne(businessId);

      // Check if current user is an owner of this business
      const isOwner = await this.isBusinessOwner(businessId, currentUserId);
      if (!isOwner) {
        this.logger.warn(
          `User ${currentUserId} attempted to add owner to business ${businessId} without permission`,
        );
        throw new ForbiddenException(
          'Only business owners can add other owners',
        );
      }

      // Check if new owner user exists and has Business_owner role
      const newOwner = await this.prisma.user.findFirst({
        where: {
          id: newOwnerUserId,
          userRoles: { some: { role: { name: 'Business_owner' } } },
          deletedAt: null,
        },
      });

      if (!newOwner) {
        this.logger.warn(
          `User ${newOwnerUserId} not found or not a Business_owner`,
        );
        throw new NotFoundException(
          'User not found or does not have Business_owner role',
        );
      }

      // Check if already an owner
      const existingLink = await this.prisma.userBusiness.findUnique({
        where: {
          userId_businessId: {
            userId: newOwnerUserId,
            businessId,
          },
        },
      });

      if (existingLink) {
        this.logger.warn(
          `User ${newOwnerUserId} is already an owner of business ${businessId}`,
        );
        throw new ConflictException(
          'User is already an owner of this business',
        );
      }

      // Add the owner
      await this.prisma.userBusiness.create({
        data: {
          userId: newOwnerUserId,
          businessId,
        },
      });

      this.logger.log(
        `Successfully added owner ${newOwnerUserId} to business ${businessId}`,
      );

      return {
        success: true,
        message: 'Business owner added successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to add business owner: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Add an owner to a business by email
   */
  async addBusinessOwnerByEmail(
    businessId: string,
    email: string,
    currentUserId: string,
  ) {
    this.logger.log(
      `Adding owner with email ${email} to business ${businessId}`,
    );

    try {
      // Find user by email with Business_owner role
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          userRoles: { some: { role: { name: 'Business_owner' } } },
          deletedAt: null,
        },
      });

      if (!user) {
        this.logger.warn(`No Business_owner found with email ${email}`);
        throw new NotFoundException(
          'No Business_owner user found with this email. Please ensure they have registered as a Business_owner.',
        );
      }

      return await this.addBusinessOwner(businessId, user.id, currentUserId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to add business owner by email: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Remove an owner from a business
   */
  async removeBusinessOwner(
    businessId: string,
    ownerUserId: string,
    currentUserId: string,
  ) {
    this.logger.log(
      `Removing owner ${ownerUserId} from business ${businessId} by user ${currentUserId}`,
    );

    try {
      // Check if business exists
      await this.findOne(businessId);

      // Check if current user is an owner of this business
      const isOwner = await this.isBusinessOwner(businessId, currentUserId);
      if (!isOwner) {
        this.logger.warn(
          `User ${currentUserId} attempted to remove owner from business ${businessId} without permission`,
        );
        throw new ForbiddenException(
          'Only business owners can remove other owners',
        );
      }

      // Prevent removing yourself if you're the last owner
      const ownerCount = await this.prisma.userBusiness.count({
        where: { businessId },
      });

      if (ownerCount === 1 && ownerUserId === currentUserId) {
        this.logger.warn(
          `User ${currentUserId} attempted to remove themselves as the last owner of business ${businessId}`,
        );
        throw new BadRequestException(
          'Cannot remove the last owner. Please delete the business instead.',
        );
      }

      // Remove the owner
      const deleted = await this.prisma.userBusiness.deleteMany({
        where: {
          userId: ownerUserId,
          businessId,
        },
      });

      if (deleted.count === 0) {
        this.logger.warn(
          `User ${ownerUserId} is not an owner of business ${businessId}`,
        );
        throw new NotFoundException('User is not an owner of this business');
      }

      this.logger.log(
        `Successfully removed owner ${ownerUserId} from business ${businessId}`,
      );

      return {
        success: true,
        message: 'Business owner removed successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to remove business owner: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
