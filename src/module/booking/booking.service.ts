import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingStatus } from '../../types/enums';
import { Prisma } from '@prisma/client';

const BOOKING_INCLUDE = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      price: true,
    },
  },
  serviceProvider: {
    select: {
      id: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

function flattenBooking<
  T extends {
    service: any;
    serviceProvider: any;
    user?: any;
    guestFirstName?: string | null;
    guestLastName?: string | null;
    guestEmail?: string | null;
    guestPhone?: string | null;
  },
>(booking: T) {
  const sp = booking.serviceProvider;
  const svc = booking.service;
  // Surface either the registered user or the guest snapshot under a single
  // `user` key on the response so the FE can render one consistent shape.
  const user = booking.user
    ? booking.user
    : booking.guestEmail
      ? {
          id: null,
          firstName: booking.guestFirstName ?? null,
          lastName: booking.guestLastName ?? null,
          email: booking.guestEmail,
          phone: booking.guestPhone ?? null,
          isGuest: true,
        }
      : null;
  return {
    ...booking,
    user,
    service: svc
      ? {
          id: svc.id,
          name: svc.name,
          price: svc.price != null ? Number(svc.price) : null,
        }
      : null,
    serviceProvider: sp
      ? {
          id: sp.id,
          firstName: sp.user?.firstName ?? null,
          lastName: sp.user?.lastName ?? null,
        }
      : null,
  };
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createBookingDto: CreateBookingDto, businessId: string) {
    this.logger.log(
      `Creating booking for business: ${businessId}, user: ${createBookingDto.userId ?? 'guest:' + createBookingDto.guest?.email}`,
    );

    try {
      // Booking must be tied to either a registered user OR a guest contact.
      if (!createBookingDto.userId && !createBookingDto.guest) {
        throw new BadRequestException(
          'Either userId or guest details are required',
        );
      }
      if (createBookingDto.userId && createBookingDto.guest) {
        throw new BadRequestException(
          'Provide either userId or guest, not both',
        );
      }

      // Verify business exists
      this.logger.debug(`Verifying business exists: ${businessId}`);
      const business = await this.prisma.business.findFirst({
        where: { id: businessId, deletedAt: null },
      });

      if (!business) {
        this.logger.warn(`Business not found: ${businessId}`);
        throw new NotFoundException(`Business with ID ${businessId} not found`);
      }

      // If a userId is provided, verify the user actually exists. For guest
      // bookings we'll still attempt to match on email so a returning guest
      // doesn't create duplicate identity rows down the line.
      let resolvedUserId: string | null = createBookingDto.userId ?? null;
      if (resolvedUserId) {
        this.logger.debug(`Verifying user exists: ${resolvedUserId}`);
        const user = await this.prisma.user.findFirst({
          where: { id: resolvedUserId, deletedAt: null },
        });

        if (!user) {
          this.logger.warn(`User not found: ${resolvedUserId}`);
          throw new NotFoundException(
            `User with ID ${resolvedUserId} not found`,
          );
        }
      } else if (createBookingDto.guest) {
        const existingByEmail = await this.prisma.user.findFirst({
          where: {
            email: {
              equals: createBookingDto.guest.email,
              mode: 'insensitive',
            },
            deletedAt: null,
          },
          select: { id: true },
        });
        if (existingByEmail) {
          // A registered account exists for this email — link the booking to
          // it instead of stamping the guest fields, so the customer sees the
          // booking under "my bookings" if they ever log in.
          resolvedUserId = existingByEmail.id;
        }
      }

      // Verify service exists and belongs to business
      this.logger.debug(
        `Verifying service exists: ${createBookingDto.serviceId} for business: ${businessId}`,
      );
      const service = await this.prisma.service.findFirst({
        where: {
          id: createBookingDto.serviceId,
          deletedAt: null,
          businessServices: {
            some: {
              businessId,
            },
          },
        },
        include: {
          serviceProviders: {
            where: {
              businessId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (!service) {
        this.logger.warn(
          `Service ${createBookingDto.serviceId} not found for business ${businessId}`,
        );
        throw new NotFoundException(
          `Service with ID ${createBookingDto.serviceId} not found for this business`,
        );
      }

      const providerIds = service.serviceProviders.map(
        (provider) => provider.id,
      );
      const showProvider =
        Boolean(service.allowCustomerChooseProvider) && providerIds.length > 0;
      let serviceProviderId: string | undefined =
        createBookingDto.serviceProviderId;

      if (showProvider) {
        if (!serviceProviderId) {
          throw new BadRequestException(
            'Provider selection is required for this service',
          );
        }

        if (!providerIds.includes(serviceProviderId)) {
          throw new BadRequestException(
            'Selected provider is not attached to this service',
          );
        }
      } else {
        // Force service-level booking when provider selection is disabled
        serviceProviderId = undefined;
      }

      const bookingTime = await this.validateBookingSlot({
        serviceId: createBookingDto.serviceId,
        serviceProviderId,
        bookingTime: createBookingDto.bookingTime,
        businessId,
        scopedToProvider: showProvider,
      });

      this.logger.debug('Creating booking in database');
      const guestSnapshot =
        !resolvedUserId && createBookingDto.guest
          ? {
              guestFirstName: createBookingDto.guest.firstName,
              guestLastName: createBookingDto.guest.lastName,
              guestEmail: createBookingDto.guest.email,
              guestPhone: createBookingDto.guest.phone,
            }
          : {};

      const booking = await this.prisma.booking.create({
        data: {
          businessId,
          userId: resolvedUserId,
          serviceId: createBookingDto.serviceId,
          serviceProviderId: serviceProviderId || null,
          bookingTime: {
            start: bookingTime.start.toISOString(),
            end: bookingTime.end.toISOString(),
          },
          status: createBookingDto.status,
          confirmationMethod: createBookingDto.confirmationMethod,
          customerNotes: createBookingDto.customerNotes,
          bookingSource: createBookingDto.bookingSource,
          ...guestSnapshot,
        },
      });

      this.logger.log(`Booking created successfully with ID: ${booking.id}`);
      return booking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create booking: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findOne(id: string, businessId: string) {
    this.logger.debug(`Finding booking: ${id} for business: ${businessId}`);

    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id,
          businessId,
        },
        include: BOOKING_INCLUDE,
      });

      if (!booking) {
        this.logger.warn(
          `Booking not found: ${id} for business: ${businessId}`,
        );
        throw new NotFoundException(
          `Booking with ID ${id} not found for this business`,
        );
      }

      this.logger.debug(`Booking found: ${id}`);
      return flattenBooking(booking);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find booking ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    businessId: string,
  ) {
    if (updateBookingDto.status === BookingStatus.Cancelled) {
      throw new BadRequestException(
        'Cannot cancel a booking via PATCH. Use POST /booking/:id/cancel instead.',
      );
    }

    const existing = await this.findOne(id, businessId);

    if (existing.status === BookingStatus.Cancelled) {
      throw new BadRequestException('Cannot edit a cancelled booking');
    }

    const updateData: Prisma.BookingUpdateInput = {
      status: updateBookingDto.status,
      confirmationMethod: updateBookingDto.confirmationMethod,
      customerNotes: updateBookingDto.customerNotes,
      bookingSource: updateBookingDto.bookingSource,
    };

    if (updateBookingDto.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: updateBookingDto.userId, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateBookingDto.userId} not found`,
        );
      }

      updateData.user = {
        connect: { id: updateBookingDto.userId },
      };
    }

    let nextServiceId: string = existing.serviceId;
    if (updateBookingDto.serviceId) {
      const businessService = await this.prisma.businessService.findFirst({
        where: {
          businessId,
          serviceId: updateBookingDto.serviceId,
          service: {
            deletedAt: null,
          },
        },
      });

      if (!businessService) {
        throw new NotFoundException(
          `Service with ID ${updateBookingDto.serviceId} not found for this business`,
        );
      }

      nextServiceId = updateBookingDto.serviceId;
      updateData.service = {
        connect: { id: updateBookingDto.serviceId },
      };
    }

    let nextServiceProviderId: string | null = existing.serviceProviderId;
    let providerExplicitlyCleared = false;
    if (updateBookingDto.serviceProviderId !== undefined) {
      if (
        updateBookingDto.serviceProviderId === null ||
        updateBookingDto.serviceProviderId === ''
      ) {
        updateData.serviceProvider = { disconnect: true };
        nextServiceProviderId = null;
        providerExplicitlyCleared = true;
      } else {
        const serviceProvider = await this.prisma.serviceProvider.findFirst({
          where: {
            id: updateBookingDto.serviceProviderId,
            businessId,
            deletedAt: null,
          },
        });

        if (!serviceProvider) {
          throw new NotFoundException(
            `Service provider with ID ${updateBookingDto.serviceProviderId} not found for this business`,
          );
        }

        nextServiceProviderId = updateBookingDto.serviceProviderId;
        updateData.serviceProvider = {
          connect: { id: updateBookingDto.serviceProviderId },
        };
      }
    }

    const serviceChanged = updateBookingDto.serviceId !== undefined;
    const providerChanged = updateBookingDto.serviceProviderId !== undefined;
    const timeChanged = updateBookingDto.bookingTime !== undefined;

    if (serviceChanged || providerChanged || timeChanged) {
      const service = await this.prisma.service.findFirst({
        where: {
          id: nextServiceId,
          deletedAt: null,
          businessServices: { some: { businessId } },
        },
        include: {
          serviceProviders: {
            where: { businessId, deletedAt: null },
            select: { id: true },
          },
        },
      });

      if (!service) {
        throw new NotFoundException(
          `Service with ID ${nextServiceId} not found for this business`,
        );
      }

      const providerIds = service.serviceProviders.map((p) => p.id);
      const showProvider =
        Boolean(service.allowCustomerChooseProvider) && providerIds.length > 0;

      let providerForValidation: string | undefined;
      if (showProvider) {
        if (providerExplicitlyCleared) {
          throw new BadRequestException(
            'Provider selection is required for this service',
          );
        }
        const candidate = nextServiceProviderId ?? undefined;
        if (!candidate) {
          throw new BadRequestException(
            'Provider selection is required for this service',
          );
        }
        if (!providerIds.includes(candidate)) {
          throw new BadRequestException(
            'Selected provider is not attached to this service',
          );
        }
        providerForValidation = candidate;
      } else {
        providerForValidation = undefined;
        if (nextServiceProviderId) {
          updateData.serviceProvider = { disconnect: true };
        }
      }

      const bookingTimeInput =
        updateBookingDto.bookingTime ??
        (existing.bookingTime as { start: string; end: string });

      const validatedTime = await this.validateBookingSlot({
        serviceId: nextServiceId,
        serviceProviderId: providerForValidation,
        bookingTime: bookingTimeInput,
        businessId,
        scopedToProvider: showProvider,
        excludeBookingId: id,
      });

      updateData.bookingTime = {
        start: validatedTime.start.toISOString(),
        end: validatedTime.end.toISOString(),
      };
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return booking;
  }

  async cancel(
    id: string,
    cancellationReason: string,
    businessId: string,
    options: { allowFromCompleted?: boolean } = {},
  ) {
    this.logger.log(`Cancelling booking: ${id} for business: ${businessId}`);

    try {
      const booking = await this.findOne(id, businessId);

      if (booking.status === BookingStatus.Cancelled) {
        this.logger.warn(`Booking ${id} is already cancelled`);
        throw new BadRequestException('Booking is already cancelled');
      }

      if (
        booking.status === BookingStatus.Completed &&
        !options.allowFromCompleted
      ) {
        throw new BadRequestException('Completed bookings cannot be cancelled');
      }

      this.logger.debug(`Updating booking ${id} status to Cancelled`);
      const cancelledBooking = await this.prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.Cancelled,
          cancelledAt: new Date(),
          cancellationReason,
        },
      });

      this.logger.log(`Booking ${id} cancelled successfully`);
      return cancelledBooking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to cancel booking ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async cancelAsCustomer(
    id: string,
    cancellationReason: string,
    businessId: string,
    userId: string,
  ) {
    this.logger.log(
      `Customer cancelling booking: ${id} for business: ${businessId}, user: ${userId}`,
    );

    const booking = await this.findOne(id, businessId);

    if (!booking.userId) {
      throw new ForbiddenException(
        'Only registered customers can cancel this booking',
      );
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to cancel this booking',
      );
    }

    return this.cancel(id, cancellationReason, businessId);
  }

  async findAll(queryDto: BookingQueryDto, businessId: string) {
    this.logger.log(
      `Finding all bookings for business: ${businessId} with filters: ${JSON.stringify(queryDto)}`,
    );

    try {
      const include = this.buildBookingInclude(queryDto.include);

      const hasDateFilter = Boolean(queryDto.startDate || queryDto.endDate);
      if (hasDateFilter) {
        const { data, total } = await this.findAllWithDateRange(
          queryDto,
          businessId,
          include,
        );
        const page = queryDto.page || 1;
        const limit = queryDto.limit || 10;
        const meta = this.paginationService.buildMeta(page, limit, total);
        return { data: data.map(flattenBooking), meta };
      }

      const paginationOptions =
        this.paginationService.buildPaginationOptions(queryDto);

      const where: Prisma.BookingWhereInput = {
        businessId,
      };

      if (queryDto.status) {
        where.status = queryDto.status;
      } else if (queryDto.excludeStatus) {
        const excluded = this.parseStatusList(queryDto.excludeStatus);
        if (excluded.length > 0) {
          where.status = { notIn: excluded };
        }
      }

      if (queryDto.userId) {
        where.userId = queryDto.userId;
      }

      if (queryDto.serviceId) {
        where.serviceId = queryDto.serviceId;
      }

      if (queryDto.serviceProviderId) {
        where.serviceProviderId = queryDto.serviceProviderId;
      }

      if (queryDto.search) {
        where.OR = [
          { customerNotes: { contains: queryDto.search, mode: 'insensitive' } },
          {
            cancellationReason: {
              contains: queryDto.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          ...paginationOptions,
          include,
        }),
        this.prisma.booking.count({ where }),
      ]);

      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const meta = this.paginationService.buildMeta(page, limit, total);

      this.logger.log(
        `Found ${data.length} bookings (total: ${total}) for business: ${businessId}`,
      );
      return { data: data.map(flattenBooking), meta };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to find bookings for business ${businessId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  private buildBookingInclude(include?: string): Prisma.BookingInclude {
    if (!include) return BOOKING_INCLUDE;
    const set = new Set(
      include
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );

    const result: Prisma.BookingInclude = {};
    if (set.has('customer')) result.user = BOOKING_INCLUDE.user;
    if (set.has('service')) result.service = BOOKING_INCLUDE.service;
    if (set.has('serviceProvider'))
      result.serviceProvider = BOOKING_INCLUDE.serviceProvider;
    return result;
  }

  private parseStatusList(raw: string): BookingStatus[] {
    const values = raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const allowed = new Set(Object.values(BookingStatus));
    return values.filter((value) => allowed.has(value as BookingStatus)) as
      | BookingStatus[]
      | [];
  }

  private parseDateInput(value: string, label: string, isEnd = false): Date {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const start = new Date(`${trimmed}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException(`${label} must be a valid ISO date`);
      }
      if (isEnd) {
        return new Date(start.getTime() + 86_399_999);
      }
      return start;
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} must be a valid ISO date`);
    }
    return date;
  }

  private async findAllWithDateRange(
    queryDto: BookingQueryDto,
    businessId: string,
    include: Prisma.BookingInclude,
  ) {
    const start = queryDto.startDate
      ? this.parseDateInput(queryDto.startDate, 'startDate')
      : undefined;
    const end = queryDto.endDate
      ? this.parseDateInput(queryDto.endDate, 'endDate', true)
      : undefined;

    if (start && end && end < start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const filters: Prisma.Sql[] = [Prisma.sql`"business_id" = ${businessId}`];

    if (queryDto.status) {
      filters.push(Prisma.sql`"status" = ${queryDto.status}`);
    } else if (queryDto.excludeStatus) {
      const excluded = this.parseStatusList(queryDto.excludeStatus);
      if (excluded.length > 0) {
        filters.push(Prisma.sql`"status" NOT IN (${Prisma.join(excluded)})`);
      }
    }

    if (queryDto.userId) {
      filters.push(Prisma.sql`"user_id" = ${queryDto.userId}`);
    }

    if (queryDto.serviceId) {
      filters.push(Prisma.sql`"service_id" = ${queryDto.serviceId}`);
    }

    if (queryDto.serviceProviderId) {
      filters.push(
        Prisma.sql`"service_provider_id" = ${queryDto.serviceProviderId}`,
      );
    }

    if (queryDto.search) {
      const like = `%${queryDto.search}%`;
      filters.push(
        Prisma.sql`(
          "customer_notes" ILIKE ${like}
          OR "cancellation_reason" ILIKE ${like}
        )`,
      );
    }

    if (start || end) {
      filters.push(Prisma.sql`"bookingTime" IS NOT NULL`);
      if (start) {
        filters.push(
          Prisma.sql`("bookingTime"->>'start')::timestamptz >= ${start}`,
        );
      }
      if (end) {
        filters.push(
          Prisma.sql`("bookingTime"->>'start')::timestamptz <= ${end}`,
        );
      }
    }

    const whereSql = Prisma.join(filters, ' AND ');

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const offset = (page - 1) * limit;
    const sortOrder = queryDto.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const sortColumn = this.mapSortColumn(queryDto.sortBy);

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT "id"
        FROM "bookings"
        WHERE ${whereSql}
        ORDER BY ${sortColumn} ${Prisma.raw(sortOrder)}
        LIMIT ${limit} OFFSET ${offset}
      `,
    );

    const totalRows = await this.prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS "total"
        FROM "bookings"
        WHERE ${whereSql}
      `,
    );

    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) {
      return { data: [], total: Number(totalRows[0]?.total ?? 0) };
    }

    const data = await this.prisma.booking.findMany({
      where: { id: { in: ids } },
      include,
    });

    const byId = new Map(data.map((booking) => [booking.id, booking]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((booking): booking is (typeof data)[number] => Boolean(booking));

    return { data: ordered, total: Number(totalRows[0]?.total ?? 0) };
  }

  private mapSortColumn(sortBy?: string) {
    switch (sortBy) {
      case 'updatedAt':
        return Prisma.sql`"updated_at"`;
      case 'status':
        return Prisma.sql`"status"`;
      case 'bookingTime':
        return Prisma.sql`("bookingTime"->>'start')::timestamptz`;
      case 'userId':
        return Prisma.sql`"user_id"`;
      case 'serviceId':
        return Prisma.sql`"service_id"`;
      case 'serviceProviderId':
        return Prisma.sql`"service_provider_id"`;
      case 'createdAt':
      default:
        return Prisma.sql`"created_at"`;
    }
  }

  private async validateBookingSlot(params: {
    serviceId: string;
    serviceProviderId: string | undefined;
    bookingTime: unknown;
    businessId: string;
    scopedToProvider: boolean;
    excludeBookingId?: string;
  }): Promise<{ start: Date; end: Date }> {
    const {
      serviceId,
      serviceProviderId,
      bookingTime: bookingTimeInput,
      businessId,
      scopedToProvider,
      excludeBookingId,
    } = params;

    const bookingTime = this.parseBookingTime(bookingTimeInput);

    const scheduler = await this.prisma.scheduler.findFirst({
      where: { serviceId },
    });

    if (!scheduler) {
      throw new BadRequestException(
        'Scheduler is not configured for this service',
      );
    }

    const config = scheduler.canScheduleTime as any;
    const dayName = this.getDayName(bookingTime.start.getDay());
    const daySchedule = config[dayName.toLowerCase()];

    if (!daySchedule || daySchedule.isOff) {
      throw new BadRequestException(
        'Service is not available on selected date',
      );
    }

    if (!config.timeSlotConfig?.allowUserSelection) {
      throw new BadRequestException(
        'Time slot selection is not enabled for this service',
      );
    }

    const slots = this.generateTimeSlots(
      daySchedule,
      config.timeSlotConfig.intervalMinutes,
      config.blockedTimes?.[dayName.toLowerCase()] || [],
      bookingTime.start,
    );

    const matchedSlot = slots.find(
      (slot) =>
        slot.start.toISOString() === bookingTime.start.toISOString() &&
        slot.end.toISOString() === bookingTime.end.toISOString(),
    );

    if (!matchedSlot) {
      throw new BadRequestException(
        'Selected booking time does not match configured service slots',
      );
    }

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        serviceId,
        businessId,
        ...(scopedToProvider && serviceProviderId ? { serviceProviderId } : {}),
        status: { not: 'Cancelled' },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    });

    const bookingsForDate = this.filterBookingsForDate(
      existingBookings,
      bookingTime.start.toISOString().split('T')[0],
    );
    const slotBookedCount = this.getSlotBookedCount(
      matchedSlot,
      bookingsForDate,
    );
    const capacity = Math.max(
      1,
      Number(config.timeSlotConfig.bookingsPerSlot || 1),
    );

    if (slotBookedCount >= capacity) {
      throw new ConflictException('Selected time slot is fully booked');
    }

    return bookingTime;
  }

  private parseBookingTime(bookingTime: any): { start: Date; end: Date } {
    if (!bookingTime?.start || !bookingTime?.end) {
      throw new BadRequestException(
        'bookingTime.start and bookingTime.end are required',
      );
    }

    const start = new Date(bookingTime.start);
    const end = new Date(bookingTime.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException(
        'Booking time must be a valid ISO datetime',
      );
    }

    if (end <= start) {
      throw new BadRequestException(
        'Booking end time must be after start time',
      );
    }

    return { start, end };
  }

  private getDayName(dayIndex: number): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayIndex];
  }

  private generateTimeSlots(
    daySchedule: any,
    intervalMinutes: number,
    blockedTimes: any[],
    date: Date,
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const [startHour, startMinute] = daySchedule.startTime
      .split(':')
      .map(Number);
    const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + intervalMinutes);

      if (slotEnd > endTime) break;

      const isBlocked = blockedTimes.some((blocked) => {
        const [blockStartHour, blockStartMin] = blocked.startTime
          .split(':')
          .map(Number);
        const [blockEndHour, blockEndMin] = blocked.endTime
          .split(':')
          .map(Number);

        const blockStart = new Date(date);
        blockStart.setHours(blockStartHour, blockStartMin, 0, 0);

        const blockEnd = new Date(date);
        blockEnd.setHours(blockEndHour, blockEndMin, 0, 0);

        return (
          (currentTime >= blockStart && currentTime < blockEnd) ||
          (slotEnd > blockStart && slotEnd <= blockEnd) ||
          (currentTime <= blockStart && slotEnd >= blockEnd)
        );
      });

      if (!isBlocked) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
        });
      }

      currentTime = new Date(slotEnd);
    }

    return slots;
  }

  private filterBookingsForDate(bookings: any[], targetDateStr: string): any[] {
    return bookings.filter((booking) => {
      const existingBookingTime = booking.bookingTime;
      if (!existingBookingTime?.start) return false;
      const bookingDate = new Date(existingBookingTime.start);
      return bookingDate.toISOString().split('T')[0] === targetDateStr;
    });
  }

  private getSlotBookedCount(
    slot: { start: Date; end: Date },
    bookings: any[],
  ): number {
    return bookings.filter((booking) => {
      const existingBookingTime = booking.bookingTime;
      if (!existingBookingTime?.start) return false;
      const bookingStart = new Date(existingBookingTime.start);
      return (
        bookingStart.toISOString() === slot.start.toISOString() ||
        (bookingStart >= slot.start && bookingStart < slot.end)
      );
    }).length;
  }
}
