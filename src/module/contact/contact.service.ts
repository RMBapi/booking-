import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { Prisma } from '@prisma/client';

const CONTACT_INCLUDE = {
  service: {
    select: {
      id: true,
      name: true,
      price: true,
    },
  },
} satisfies Prisma.ContactInclude;

function flattenContact<T extends { service: any }>(contact: T) {
  const svc = contact.service;
  return {
    ...contact,
    service: svc
      ? {
          id: svc.id,
          name: svc.name,
          price: svc.price != null ? Number(svc.price) : null,
        }
      : null,
  };
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createContactDto: CreateContactDto, businessId: string) {
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
        serviceId: createContactDto.serviceId,
        service: {
          deletedAt: null,
        },
      },
    });

    if (!businessService) {
      throw new NotFoundException(
        `Service with ID ${createContactDto.serviceId} not found for this business`,
      );
    }

    const contact = await this.prisma.contact.create({
      data: {
        businessId,
        serviceId: createContactDto.serviceId,
        firstName: createContactDto.firstName,
        lastName: createContactDto.lastName,
        email: createContactDto.email,
        phone: createContactDto.phone,
        bookingTime: createContactDto.bookingTime,
        notes: createContactDto.notes,
      },
    });

    return contact;
  }

  async findOne(id: string, businessId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: CONTACT_INCLUDE,
    });

    if (!contact) {
      throw new NotFoundException(
        `Contact with ID ${id} not found for this business`,
      );
    }

    return flattenContact(contact);
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    businessId: string,
  ) {
    await this.findOne(id, businessId); // Check if contact exists and belongs to business

    const updateData: Prisma.ContactUpdateInput = {
      firstName: updateContactDto.firstName,
      lastName: updateContactDto.lastName,
      email: updateContactDto.email,
      phone: updateContactDto.phone,
      bookingTime: updateContactDto.bookingTime,
      notes: updateContactDto.notes,
    };

    if (updateContactDto.serviceId) {
      // Verify service exists and belongs to business
      const businessService = await this.prisma.businessService.findFirst({
        where: {
          businessId,
          serviceId: updateContactDto.serviceId,
          service: {
            deletedAt: null,
          },
        },
      });

      if (!businessService) {
        throw new NotFoundException(
          `Service with ID ${updateContactDto.serviceId} not found for this business`,
        );
      }

      updateData.service = {
        connect: { id: updateContactDto.serviceId },
      };
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return contact;
  }

  async delete(id: string, businessId: string) {
    await this.findOne(id, businessId); // Check if contact exists and belongs to business

    await this.prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Contact deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async findAll(queryDto: ContactQueryDto, businessId: string) {
    const paginationOptions =
      this.paginationService.buildPaginationOptions(queryDto);

    const where: Prisma.ContactWhereInput = {
      businessId,
      deletedAt: null,
    };

    if (queryDto.email) {
      where.email = {
        contains: queryDto.email,
        mode: 'insensitive',
      };
    }

    if (queryDto.phone) {
      where.phone = {
        contains: queryDto.phone,
      };
    }

    if (queryDto.serviceId) {
      where.serviceId = queryDto.serviceId;
    }

    if (queryDto.search) {
      where.OR = [
        { firstName: { contains: queryDto.search, mode: 'insensitive' } },
        { lastName: { contains: queryDto.search, mode: 'insensitive' } },
        { email: { contains: queryDto.search, mode: 'insensitive' } },
        { phone: { contains: queryDto.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        ...paginationOptions,
        include: CONTACT_INCLUDE,
      }),
      this.prisma.contact.count({ where }),
    ]);

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const meta = this.paginationService.buildMeta(page, limit, total);

    return { data: data.map(flattenContact), meta };
  }
}
