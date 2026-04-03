import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createBookingDto: CreateBookingDto, businessId: string) {
    this.logger.log(
      `Creating booking for business: ${businessId}, user: ${createBookingDto.userId}`,
    );

    try {
      // Validate userId is provided
      if (!createBookingDto.userId) {
        this.logger.warn('User ID is required for booking creation');
        throw new BadRequestException(
          'User ID is required for booking creation',
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

      // Verify user exists
      this.logger.debug(`Verifying user exists: ${createBookingDto.userId}`);
      const user = await this.prisma.user.findFirst({
        where: { id: createBookingDto.userId, deletedAt: null },
      });

      if (!user) {
        this.logger.warn(`User not found: ${createBookingDto.userId}`);
        throw new NotFoundException(
          `User with ID ${createBookingDto.userId} not found`,
        );
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

      const bookingTime = this.parseBookingTime(createBookingDto.bookingTime);

      const scheduler = await this.prisma.scheduler.findFirst({
        where: {
          serviceId: createBookingDto.serviceId,
        },
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
          serviceId: createBookingDto.serviceId,
          businessId,
          ...(showProvider && serviceProviderId ? { serviceProviderId } : {}),
          status: {
            not: 'Cancelled',
          },
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
        throw new BadRequestException('Selected time slot is fully booked');
      }

      this.logger.debug('Creating booking in database');
      // At this point, userId is guaranteed to be defined due to validation above
      // serviceProviderId is optional and can be null
      const booking = await this.prisma.booking.create({
        data: {
          businessId,
          userId: createBookingDto.userId!, // Non-null assertion: validated above
          serviceId: createBookingDto.serviceId,
          serviceProviderId: serviceProviderId || null, // Optional - can be null
          bookingTime: {
            start: bookingTime.start.toISOString(),
            end: bookingTime.end.toISOString(),
          },
          status: createBookingDto.status,
          confirmationMethod: createBookingDto.confirmationMethod,
          customerNotes: createBookingDto.customerNotes,
          bookingSource: createBookingDto.bookingSource,
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
      return booking;
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
    await this.findOne(id, businessId); // Check if booking exists and belongs to business

    const updateData: Prisma.BookingUpdateInput = {
      bookingTime: updateBookingDto.bookingTime,
      status: updateBookingDto.status,
      confirmationMethod: updateBookingDto.confirmationMethod,
      customerNotes: updateBookingDto.customerNotes,
      bookingSource: updateBookingDto.bookingSource,
    };

    if (updateBookingDto.userId) {
      // Verify user exists
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

    if (updateBookingDto.serviceId) {
      // Verify service exists and belongs to business
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

      updateData.service = {
        connect: { id: updateBookingDto.serviceId },
      };
    }

    if (updateBookingDto.serviceProviderId !== undefined) {
      if (
        updateBookingDto.serviceProviderId === null ||
        updateBookingDto.serviceProviderId === ''
      ) {
        // Allow removing service provider assignment
        updateData.serviceProvider = {
          disconnect: true,
        };
      } else {
        // Verify service provider exists and belongs to business
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

        updateData.serviceProvider = {
          connect: { id: updateBookingDto.serviceProviderId },
        };
      }
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return booking;
  }

  async cancel(id: string, cancellationReason: string, businessId: string) {
    this.logger.log(`Cancelling booking: ${id} for business: ${businessId}`);

    try {
      const booking = await this.findOne(id, businessId);

      if (booking.status === 'Cancelled') {
        this.logger.warn(`Booking ${id} is already cancelled`);
        throw new BadRequestException('Booking is already cancelled');
      }

      this.logger.debug(`Updating booking ${id} status to Cancelled`);
      const cancelledBooking = await this.prisma.booking.update({
        where: { id },
        data: {
          status: 'Cancelled',
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

  async findAll(queryDto: BookingQueryDto, businessId: string) {
    this.logger.log(
      `Finding all bookings for business: ${businessId} with filters: ${JSON.stringify(queryDto)}`,
    );

    try {
      const paginationOptions =
        this.paginationService.buildPaginationOptions(queryDto);

      const where: Prisma.BookingWhereInput = {
        businessId,
      };

      if (queryDto.status) {
        where.status = queryDto.status;
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
        }),
        this.prisma.booking.count({ where }),
      ]);

      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const meta = this.paginationService.buildMeta(page, limit, total);

      this.logger.log(
        `Found ${data.length} bookings (total: ${total}) for business: ${businessId}`,
      );
      return { data, meta };
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
      const existingBookingTime = booking.bookingTime as any;
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
      const existingBookingTime = booking.bookingTime as any;
      if (!existingBookingTime?.start) return false;
      const bookingStart = new Date(existingBookingTime.start);
      return (
        bookingStart.toISOString() === slot.start.toISOString() ||
        (bookingStart >= slot.start && bookingStart < slot.end)
      );
    }).length;
  }
}
