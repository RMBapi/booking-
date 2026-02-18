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
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { GetSingleBookingDto } from './dto/response/get-single-booking.dto';
import { GetAllBookingDto } from './dto/response/get-all-booking.dto';
import { plainToInstance } from 'class-transformer';
import { BookingResponseDto } from './dto/response/booking-response.dto';
import { BusinessId } from '../../common/decorators/business.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BusinessService } from '../business/business.service';

@ApiTags('Booking')
@ApiBearerAuth('JWT-auth')
@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly businessService: BusinessService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Bookings fetched successfully',
    type: GetAllBookingDto,
  })
  async findAll(
    @Query() queryDto: BookingQueryDto,
    @BusinessId() businessId: string,
  ) {
    const result = await this.bookingService.findAll(queryDto, businessId);

    const transformedData = plainToInstance(
      BookingResponseDto,
      result.data,
      {
        excludeExtraneousValues: true,
      },
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      data: transformedData,
      meta: result.meta,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new booking (userId auto-filled from token)',
    description: 
      'Create a new booking for a logged-in user. The userId is automatically filled from the JWT token.\n\n' +
      '**Authentication:** Requires JWT token. userId is automatically extracted.\n\n' +
      '**Business Context:** Provide businessId via `x-business-id` header OR `businessSlug` query parameter.\n\n' +
      '**Required Fields:**\n' +
      '- `serviceId` - The service being booked\n' +
      '- `bookingTime` - Object with start/end times (ISO 8601 format)\n\n' +
      '**Optional Fields:**\n' +
      '- `serviceProviderId` - Specific service provider\n' +
      '- `status` - Booking status (defaults to "Pending")\n' +
      '- `confirmationMethod` - Email, SMS, Phone, or None\n' +
      '- `bookingSource` - Website, Phone, WalkIn, or Mobile\n' +
      '- `customerNotes` - Additional notes',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: GetSingleBookingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required fields or invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Service, business, or service provider not found',
  })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: any,
    @Query('businessSlug') businessSlug?: string,
    @BusinessId() businessId?: string,
  ) {
    // Auto-fill userId from token if not provided
    if (!createBookingDto.userId) {
      if (!user?.id) {
        throw new BadRequestException('User ID is required. Please ensure you are authenticated.');
      }
      createBookingDto.userId = user.id;
    }

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

    const booking = await this.bookingService.create(createBookingDto, resolvedBusinessId);
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
  @ApiOperation({ summary: 'Get a single booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking fetched successfully',
    type: GetSingleBookingDto,
  })
  async findOne(
    @Param('id') id: string,
    @BusinessId() businessId: string,
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
  @ApiOperation({ summary: 'Update a booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: GetSingleBookingDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @BusinessId() businessId: string,
  ) {
    const booking = await this.bookingService.update(id, updateBookingDto, businessId);
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
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    type: GetSingleBookingDto,
  })
  async cancel(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: string,
    @BusinessId() businessId: string,
  ) {
    const booking = await this.bookingService.cancel(id, cancellationReason, businessId);
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
}
