import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BookingService } from './booking.service';
import { BusinessService } from '../business/business.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { GetSingleBookingDto } from './dto/response/get-single-booking.dto';
import { GetAllBookingDto } from './dto/response/get-all-booking.dto';
import { BookingResponseDto } from './dto/response/booking-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';
import { BookingSource } from '../../types/enums';

@ApiTags('Booking')
@ApiBearerAuth('JWT-auth')
@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly businessService: BusinessService,
  ) {}

  @Get()
  @RequireFeature(FEATURES.VIEW_BOOKINGS)
  @ApiOperation({ summary: 'Get all bookings with pagination' })
  @ApiResponse({ status: 200, type: GetAllBookingDto })
  async findAll(
    @Query() queryDto: BookingQueryDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const result = await this.bookingService.findAll(queryDto, businessId);
    const transformedData = plainToInstance(BookingResponseDto, result.data, {
      excludeExtraneousValues: true,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      data: transformedData,
      meta: result.meta,
    };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new booking (public, customer-facing)' })
  @ApiResponse({ status: 201, type: GetSingleBookingDto })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: JwtUser | undefined,
    @Query('businessSlug') businessSlug?: string,
    @Headers('x-business-id') businessId?: string,
  ) {
    if (!createBookingDto.userId && !createBookingDto.guest) {
      if (!user?.id) {
        throw new BadRequestException(
          'User ID is required. Please ensure you are authenticated.',
        );
      }
      createBookingDto.userId = user.id;
    }

    if (createBookingDto.bookingSource === BookingSource.CRM) {
      throw new BadRequestException(
        'CRM-source bookings must be created via POST /booking/staff',
      );
    }

    let resolvedBusinessId = businessId;
    if (!resolvedBusinessId && businessSlug) {
      const business = await this.businessService.findOneBySlug(businessSlug);
      resolvedBusinessId = business.id;
    } else if (!resolvedBusinessId) {
      throw new BadRequestException(
        'Either businessId (via x-business-id header) or businessSlug (via query parameter) is required',
      );
    }

    const booking = await this.bookingService.create(
      createBookingDto,
      resolvedBusinessId,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Booking created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BookingResponseDto, booking, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post('staff')
  @RequireFeature(FEATURES.MANAGE_BOOKINGS)
  @ApiOperation({
    summary:
      'Create a booking on behalf of a customer from the CRM. Requires manage_bookings on the target business. Accepts either userId (registered customer) or guest (unregistered).',
  })
  @ApiResponse({ status: 201, type: GetSingleBookingDto })
  async createStaff(
    @Body() createBookingDto: CreateBookingDto,
    @Headers('x-business-id') businessId: string,
  ) {
    if (!businessId) {
      throw new BadRequestException(
        'x-business-id header is required for staff bookings',
      );
    }

    // Default the source to CRM, but allow staff to record Phone / WalkIn
    // bookings through the same endpoint. Reject Website / Mobile here so
    // those continue to flow through the public endpoint.
    if (!createBookingDto.bookingSource) {
      createBookingDto.bookingSource = BookingSource.CRM;
    }
    const allowed = [
      BookingSource.CRM,
      BookingSource.Phone,
      BookingSource.WalkIn,
    ];
    if (!allowed.includes(createBookingDto.bookingSource)) {
      throw new BadRequestException(
        `bookingSource for staff bookings must be one of: ${allowed.join(', ')}`,
      );
    }

    const booking = await this.bookingService.create(
      createBookingDto,
      businessId,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Booking created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BookingResponseDto, booking, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @RequireFeature(FEATURES.VIEW_BOOKINGS)
  @ApiOperation({ summary: 'Get a single booking' })
  @ApiResponse({ status: 200, type: GetSingleBookingDto })
  async findOne(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    const booking = await this.bookingService.findOne(id, businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Booking fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BookingResponseDto, booking, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @RequireFeature(FEATURES.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Update a booking' })
  @ApiResponse({ status: 200, type: GetSingleBookingDto })
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const booking = await this.bookingService.update(
      id,
      updateBookingDto,
      businessId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Booking updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BookingResponseDto, booking, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, type: GetSingleBookingDto })
  async cancel(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const booking = await this.bookingService.cancel(
      id,
      cancelBookingDto.cancellationReason,
      businessId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Booking cancelled successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BookingResponseDto, booking, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Delete a booking (soft cancel by admin)' })
  async delete(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    return this.bookingService.cancel(id, 'Deleted by admin', businessId, {
      allowFromCompleted: true,
    });
  }
}
