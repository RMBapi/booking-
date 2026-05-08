import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { BusinessId } from '../../common/decorators/business.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Review')
@ApiBearerAuth('JWT-auth')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('booking/:id/review')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a review for a completed booking',
    description:
      'Creates a review for the given booking. Requires JWT. The booking must belong to the requesting user, be in `Completed` status, and not already have a review.',
  })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  async create(
    @Param('id') bookingId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    const review = await this.reviewService.createForBooking(
      bookingId,
      user.id,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Review submitted successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ReviewResponseDto, review, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('booking/:id/review')
  @ApiOperation({
    summary: 'Get the review for a booking (owner only)',
  })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async findOne(
    @Param('id') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    const review = await this.reviewService.getForBooking(bookingId, user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Review fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ReviewResponseDto, review, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch('booking/:id/review')
  @ApiOperation({ summary: 'Edit an existing review (owner only)' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async update(
    @Param('id') bookingId: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    const review = await this.reviewService.updateForBooking(
      bookingId,
      user.id,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Review updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ReviewResponseDto, review, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete('booking/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a review (owner only, soft-delete)' })
  async remove(
    @Param('id') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.reviewService.deleteForBooking(bookingId, user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Review deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('review')
  @ApiOperation({
    summary: 'List reviews for the current business (CRM)',
    description:
      'Returns paginated reviews for the business identified by `x-business-id`. Includes reviewer and service info.',
  })
  async findAllForBusiness(
    @Query() query: ReviewQueryDto,
    @BusinessId() businessId: string,
  ) {
    const result = await this.reviewService.findAllForBusiness(
      businessId,
      query,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reviews fetched successfully',
      timestamp: new Date().toISOString(),
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('review/summary')
  @ApiOperation({
    summary: 'Aggregated rating summary for the current business (CRM)',
    description:
      'Returns `{ total, average, distribution }` for the business identified by `x-business-id`.',
  })
  async getSummary(@BusinessId() businessId: string) {
    const summary = await this.reviewService.getBusinessSummary(businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Review summary fetched successfully',
      timestamp: new Date().toISOString(),
      data: summary,
    };
  }
}
