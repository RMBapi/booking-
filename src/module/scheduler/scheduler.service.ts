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
    const businessService = await this.prisma.businessService.findFirst({
      where: {
        serviceId: getAvailableSlotsDto.serviceId,
        businessId,
        service: {
          deletedAt: null,
        },
      },
    });

    if (!businessService) {
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
    const dayName = this.getDayName(targetDate.getDay());

    // Get day schedule
    const daySchedule = config[dayName.toLowerCase()];

    if (!daySchedule || daySchedule.isOff) {
      return {
        date: targetDate.toISOString().split('T')[0],
        availableSlots: [],
        message: 'Service is not available on this day',
      };
    }

    // If user selection is not allowed, return empty slots
    if (!config.timeSlotConfig?.allowUserSelection) {
      return {
        date: targetDate.toISOString().split('T')[0],
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

    // Get existing bookings for the date to check availability
    const whereClause: any = {
      serviceId: getAvailableSlotsDto.serviceId,
      businessId,
      status: {
        not: 'Cancelled',
      },
    };

    if (getAvailableSlotsDto.serviceProviderId) {
      whereClause.serviceProviderId = getAvailableSlotsDto.serviceProviderId;
    }

    const bookings = await this.prisma.booking.findMany({
      where: whereClause,
    });

    // Filter bookings by date manually since Prisma JSON filtering is limited
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const bookingsForDate = bookings.filter((booking) => {
      const bookingTime = booking.bookingTime as any;
      if (!bookingTime?.start) return false;
      const bookingDate = new Date(bookingTime.start);
      return bookingDate.toISOString().split('T')[0] === targetDateStr;
    });

    // Filter out slots that are fully booked
    const bookingsPerSlot = config.timeSlotConfig.bookingsPerSlot || 1;
    const availableSlots = slots.filter((slot) => {
      const slotBookings = bookingsForDate.filter((booking) => {
        const bookingTime = booking.bookingTime as any;
        if (!bookingTime?.start) return false;
        const bookingStart = new Date(bookingTime.start);
        return (
          bookingStart.toISOString() === slot.start.toISOString() ||
          (bookingStart >= slot.start && bookingStart < slot.end)
        );
      });
      return slotBookings.length < bookingsPerSlot;
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      availableSlots: availableSlots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        available: true,
      })),
      timeFormat: config.timeFormat || '24',
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
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
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
}
