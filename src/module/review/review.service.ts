import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async createForBooking(
    bookingId: string,
    userId: string,
    dto: CreateReviewDto,
  ) {
    this.logger.log(
      `Creating review for booking ${bookingId} by user ${userId}`,
    );

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== 'Completed') {
      throw new BadRequestException(
        'Reviews can only be left on completed bookings',
      );
    }

    if (booking.review) {
      throw new BadRequestException('A review already exists for this booking');
    }

    return this.prisma.review.create({
      data: {
        bookingId,
        userId,
        businessId: booking.businessId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      },
    });
  }

  async getForBooking(bookingId: string, userId?: string) {
    const review = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException('No review found for this booking');
    }

    if (userId && review.userId !== userId) {
      throw new ForbiddenException('You are not allowed to view this review');
    }

    return review;
  }

  async updateForBooking(
    bookingId: string,
    userId: string,
    dto: UpdateReviewDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException('No review found for this booking');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own review');
    }

    const data: Prisma.ReviewUpdateInput = {};
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.comment !== undefined) data.comment = dto.comment;

    return this.prisma.review.update({
      where: { id: review.id },
      data,
    });
  }

  async deleteForBooking(bookingId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException('No review found for this booking');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }

    await this.prisma.review.update({
      where: { id: review.id },
      data: { deletedAt: new Date() },
    });
  }

  async findAllForBusiness(businessId: string, query: ReviewQueryDto) {
    const paginationOptions =
      this.paginationService.buildPaginationOptions(query);

    const where: Prisma.ReviewWhereInput = {
      businessId,
      deletedAt: null,
    };

    if (query.rating) where.rating = query.rating;
    if (query.userId) where.userId = query.userId;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        ...paginationOptions,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          booking: {
            select: {
              id: true,
              serviceId: true,
              serviceProviderId: true,
              service: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const meta = this.paginationService.buildMeta(page, limit, total);

    return { data, meta };
  }

  async getBusinessSummary(businessId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { businessId, deletedAt: null },
      select: { rating: true },
    });

    const total = reviews.length;
    const average =
      total === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const review of reviews) {
      distribution[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }

    return {
      businessId,
      total,
      average: Number(average.toFixed(2)),
      distribution,
    };
  }
}
