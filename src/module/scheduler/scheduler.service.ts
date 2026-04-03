import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';

type SlotWindow = { start: Date; end: Date };

type SlotAvailability = {
  start: string;
  end: string;
  status: 'free' | 'booked';
  available: boolean;
  bookedCount: number;
  capacity: number;
};

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify that the user owns the business that owns the service
   */
  private async verifyServiceOwnership(
    serviceId: string,
    businessId: string,
    userId: string,
  ): Promise<void> {
    const businessService = await this.prisma.businessService.findFirst({
      where: {
        serviceId,
        businessId,
        service: {
          deletedAt: null,
        },
      },
    });

    if (!businessService) {
      throw new NotFoundException(
        `Service with ID ${serviceId} not found for this business`,
      );
    }

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

  async create(
    createSchedulerDto: CreateSchedulerDto,
    businessId: string,
    userId: string,
  ) {
    await this.verifyServiceOwnership(
      createSchedulerDto.serviceId,
      businessId,
      userId,
    );

    // Check if scheduler already exists for this service
    const existingScheduler = await this.prisma.scheduler.findFirst({
      where: {
        serviceId: createSchedulerDto.serviceId,
      },
    });

    if (existingScheduler) {
      throw new BadRequestException(
        'Scheduler already exists for this service. Use update endpoint instead.',
      );
    }

    const scheduler = await this.prisma.scheduler.create({
      data: {
        serviceId: createSchedulerDto.serviceId,
        canScheduleTime: createSchedulerDto.canScheduleTime as any,
      },
    });

    return scheduler;
  }

  async findOne(serviceId: string, businessId: string, userId: string) {
    await this.verifyServiceOwnership(serviceId, businessId, userId);

    const scheduler = await this.prisma.scheduler.findFirst({
      where: {
        serviceId,
      },
    });

    if (!scheduler) {
      throw new NotFoundException(
        `Scheduler not found for service with ID ${serviceId}`,
      );
    }

    return scheduler;
  }

  async update(
    serviceId: string,
    updateSchedulerDto: UpdateSchedulerDto,
    businessId: string,
    userId: string,
  ) {
    await this.verifyServiceOwnership(serviceId, businessId, userId);

    const existingScheduler = await this.prisma.scheduler.findFirst({
      where: {
        serviceId,
      },
    });

    if (!existingScheduler) {
      throw new NotFoundException(
        `Scheduler not found for service with ID ${serviceId}`,
      );
    }

    const scheduler = await this.prisma.scheduler.update({
      where: { id: existingScheduler.id },
      data: {
        canScheduleTime: updateSchedulerDto.canScheduleTime as any,
      },
    });

    return scheduler;
  }

  async delete(serviceId: string, businessId: string, userId: string) {
    await this.verifyServiceOwnership(serviceId, businessId, userId);

    const scheduler = await this.prisma.scheduler.findFirst({
      where: {
        serviceId,
      },
    });

    if (!scheduler) {
      throw new NotFoundException(
        `Scheduler not found for service with ID ${serviceId}`,
      );
    }

    await this.prisma.scheduler.delete({
      where: { id: scheduler.id },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Scheduler deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getAvailableSlots(
    getAvailableSlotsDto: GetAvailableSlotsDto,
    businessId: string,
  ) {
    // Verify service exists and belongs to business
    const service = await this.prisma.service.findFirst({
      where: {
        id: getAvailableSlotsDto.serviceId,
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
        `Service with ID ${getAvailableSlotsDto.serviceId} not found for this business`,
      );
    }

    // Get scheduler for the service
    const scheduler = await this.prisma.scheduler.findFirst({
      where: {
        serviceId: getAvailableSlotsDto.serviceId,
      },
    });

    if (!scheduler) {
      throw new NotFoundException(
        `Scheduler not found for service with ID ${getAvailableSlotsDto.serviceId}`,
      );
    }

    const config = scheduler.canScheduleTime as any;
    const targetDate = getAvailableSlotsDto.date
      ? new Date(getAvailableSlotsDto.date)
      : new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const dayName = this.getDayName(targetDate.getDay());
    const providerProfiles = service.serviceProviders.map((provider) => ({
      id: provider.id,
      userId: provider.userId,
      firstName: provider.user.firstName,
      lastName: provider.user.lastName,
      description: provider.description,
      impUrl: provider.impUrl,
    }));
    const showProvider =
      Boolean(service.allowCustomerChooseProvider) &&
      providerProfiles.length > 0;

    // Get day schedule
    const daySchedule = config[dayName.toLowerCase()];

    if (!daySchedule || daySchedule.isOff) {
      return {
        date: targetDateStr,
        showProvider,
        providers: providerProfiles,
        slots: [],
        availableSlots: [],
        message: 'Service is not available on this day',
      };
    }

    // If user selection is not allowed, return empty slots
    if (!config.timeSlotConfig?.allowUserSelection) {
      return {
        date: targetDateStr,
        showProvider,
        providers: providerProfiles,
        slots: [],
        availableSlots: [],
        message: 'Time slot selection is not enabled for this service',
      };
    }

    // Generate time slots
    const slots = this.generateTimeSlots(
      daySchedule,
      config.timeSlotConfig.intervalMinutes,
      config.blockedTimes?.[dayName.toLowerCase()] || [],
      targetDate,
    );

    const bookingsPerSlot = Math.max(
      1,
      Number(config.timeSlotConfig.bookingsPerSlot || 1),
    );

    if (showProvider) {
      if (getAvailableSlotsDto.serviceProviderId) {
        const selectedProvider = providerProfiles.find(
          (provider) => provider.id === getAvailableSlotsDto.serviceProviderId,
        );

        if (!selectedProvider) {
          throw new BadRequestException(
            'Selected provider is not attached to this service',
          );
        }

        const bookings = await this.prisma.booking.findMany({
          where: {
            serviceId: getAvailableSlotsDto.serviceId,
            businessId,
            serviceProviderId: getAvailableSlotsDto.serviceProviderId,
            status: {
              not: 'Cancelled',
            },
          },
        });

        const slotsWithStatus = this.buildSlotsAvailability(
          slots,
          this.filterBookingsForDate(bookings, targetDateStr),
          bookingsPerSlot,
        );

        return {
          date: targetDateStr,
          timeFormat: config.timeFormat || '24',
          showProvider: true,
          capacityScope: 'provider',
          providers: providerProfiles,
          selectedProviderId: getAvailableSlotsDto.serviceProviderId,
          slots: slotsWithStatus,
          availableSlots: slotsWithStatus.filter((slot) => slot.available),
        };
      }

      const providerIds = providerProfiles.map((provider) => provider.id);
      const bookings = await this.prisma.booking.findMany({
        where: {
          serviceId: getAvailableSlotsDto.serviceId,
          businessId,
          serviceProviderId: {
            in: providerIds,
          },
          status: {
            not: 'Cancelled',
          },
        },
      });

      const bookingsForDate = this.filterBookingsForDate(
        bookings,
        targetDateStr,
      );
      const providerAvailability = providerProfiles.map((provider) => {
        const providerBookings = bookingsForDate.filter(
          (booking) => booking.serviceProviderId === provider.id,
        );
        const slotsWithStatus = this.buildSlotsAvailability(
          slots,
          providerBookings,
          bookingsPerSlot,
        );

        return {
          providerId: provider.id,
          slots: slotsWithStatus,
          availableSlots: slotsWithStatus.filter((slot) => slot.available),
        };
      });

      return {
        date: targetDateStr,
        timeFormat: config.timeFormat || '24',
        showProvider: true,
        capacityScope: 'provider',
        providers: providerProfiles,
        providerAvailability,
        message: 'Select a provider to continue booking',
      };
    }

    const serviceLevelBookings = await this.prisma.booking.findMany({
      where: {
        serviceId: getAvailableSlotsDto.serviceId,
        businessId,
        status: {
          not: 'Cancelled',
        },
      },
    });

    const slotsWithStatus = this.buildSlotsAvailability(
      slots,
      this.filterBookingsForDate(serviceLevelBookings, targetDateStr),
      bookingsPerSlot,
    );

    return {
      date: targetDateStr,
      timeFormat: config.timeFormat || '24',
      showProvider: false,
      capacityScope: 'service',
      providers: [],
      slots: slotsWithStatus,
      availableSlots: slotsWithStatus.filter((slot) => slot.available),
    };
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
  ): SlotWindow[] {
    const slots: SlotWindow[] = [];
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

      // Check if this slot overlaps with any blocked time
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
      const bookingTime = booking.bookingTime as any;
      if (!bookingTime?.start) return false;
      const bookingDate = new Date(bookingTime.start);
      return bookingDate.toISOString().split('T')[0] === targetDateStr;
    });
  }

  private buildSlotsAvailability(
    slots: SlotWindow[],
    bookingsForDate: any[],
    capacity: number,
  ): SlotAvailability[] {
    return slots.map((slot) => {
      const bookedCount = bookingsForDate.filter((booking) => {
        const bookingTime = booking.bookingTime as any;
        if (!bookingTime?.start) return false;
        const bookingStart = new Date(bookingTime.start);
        return (
          bookingStart.toISOString() === slot.start.toISOString() ||
          (bookingStart >= slot.start && bookingStart < slot.end)
        );
      }).length;

      const available = bookedCount < capacity;

      return {
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        status: available ? 'free' : 'booked',
        available,
        bookedCount,
        capacity,
      };
    });
  }
}
