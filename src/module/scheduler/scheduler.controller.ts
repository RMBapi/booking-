import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { plainToInstance } from 'class-transformer';
import { SchedulerResponseDto } from './dto/response/scheduler-response.dto';
import { BusinessId } from '../../common/decorators/business.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { BusinessService } from '../business/business.service';

@ApiTags('Scheduler')
@ApiBearerAuth('JWT-auth')
@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly businessService: BusinessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new scheduler for a service' })
  @ApiResponse({
    status: 201,
    description: 'Scheduler created successfully',
    type: SchedulerResponseDto,
  })
  async create(
    @Body() createSchedulerDto: CreateSchedulerDto,
    @BusinessId() businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const scheduler = await this.schedulerService.create(
      createSchedulerDto,
      businessId,
      user.id,
    );

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Scheduler created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(SchedulerResponseDto, scheduler, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get scheduler for a service' })
  @ApiResponse({
    status: 200,
    description: 'Scheduler fetched successfully',
    type: SchedulerResponseDto,
  })
  async findOne(
    @Param('serviceId') serviceId: string,
    @BusinessId() businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const scheduler = await this.schedulerService.findOne(
      serviceId,
      businessId,
      user.id,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Scheduler fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(SchedulerResponseDto, scheduler, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch('service/:serviceId')
  @ApiOperation({ summary: 'Update scheduler for a service' })
  @ApiResponse({
    status: 200,
    description: 'Scheduler updated successfully',
    type: SchedulerResponseDto,
  })
  async update(
    @Param('serviceId') serviceId: string,
    @Body() updateSchedulerDto: UpdateSchedulerDto,
    @BusinessId() businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const scheduler = await this.schedulerService.update(
      serviceId,
      updateSchedulerDto,
      businessId,
      user.id,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Scheduler updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(SchedulerResponseDto, scheduler, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete('service/:serviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete scheduler for a service' })
  @ApiResponse({
    status: 200,
    description: 'Scheduler deleted successfully',
  })
  async delete(
    @Param('serviceId') serviceId: string,
    @BusinessId() businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.schedulerService.delete(serviceId, businessId, user.id);
  }

  @Public()
  @Get('available-slots')
  @ApiOperation({
    summary: 'Get available time slots for booking (Public - No Auth Required)',
    description: `Get available time slots for a specific service and date. This endpoint is public and does not require authentication.

**Use Cases:**
- Frontend booking forms need to show available time slots
- Both logged-in and non-logged-in users can access this endpoint
- Slots are generated based on scheduler configuration (start/end time, interval, blocked times)
- Returns slot status for each slot (\`free\` / \`booked\`)
- Supports provider-first flow when service has \`showProvider = true\`

**Query Parameters:**
- \`serviceId\` (required) - The service ID to get slots for
- \`businessSlug\` (optional) - Business slug (alternative to x-business-id header)
- \`date\` (optional) - Date in YYYY-MM-DD format (defaults to today)
- \`serviceProviderId\` (optional) - Filter slots by specific service provider

**Response:**
Returns provider-aware slot availability with free/booked status and capacity metadata.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Available slots fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Available slots fetched successfully',
        timestamp: '2025-11-19T10:00:00.000Z',
        data: {
          date: '2025-11-20',
          showProvider: true,
          providers: [
            {
              id: 'provider-1',
              userId: 'user-1',
              firstName: 'Jane',
              lastName: 'Doe',
              description: 'Senior stylist',
              impUrl: 'https://example.com/provider.png',
            },
          ],
          slots: [
            {
              start: '2025-11-20T11:00:00.000Z',
              end: '2025-11-20T11:30:00.000Z',
              status: 'free',
              available: true,
              bookedCount: 0,
              capacity: 1,
            },
            {
              start: '2025-11-20T12:00:00.000Z',
              end: '2025-11-20T12:30:00.000Z',
              status: 'booked',
              available: false,
              bookedCount: 1,
              capacity: 1,
            },
          ],
          availableSlots: [
            {
              start: '2025-11-20T11:00:00.000Z',
              end: '2025-11-20T11:30:00.000Z',
              available: true,
            },
            {
              start: '2025-11-20T12:00:00.000Z',
              end: '2025-11-20T12:30:00.000Z',
              available: true,
            },
          ],
          timeFormat: '12',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Missing required parameters or invalid provider/slot selection',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or service not found',
  })
  async getAvailableSlots(
    @Query() getAvailableSlotsDto: GetAvailableSlotsDto,
    @Query('businessSlug') businessSlug?: string,
    @BusinessId() businessId?: string,
  ) {
    // Get businessId from slug if not provided via header
    let resolvedBusinessId = businessId;
    if (!resolvedBusinessId && businessSlug) {
      const business = await this.businessService.findOneBySlug(businessSlug);
      resolvedBusinessId = business.id;
    } else if (!resolvedBusinessId) {
      throw new BadRequestException(
        'Either businessId (via x-business-id header) or businessSlug (via query parameter) is required',
      );
    }

    const result = await this.schedulerService.getAvailableSlots(
      getAvailableSlotsDto,
      resolvedBusinessId,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Available slots fetched successfully',
      timestamp: new Date().toISOString(),
      data: result,
    };
  }
}
