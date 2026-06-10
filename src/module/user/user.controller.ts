import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES, SYSTEM_ROLES } from '../../common/constants/permissions';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile fetched successfully',
  })
  getCurrentUser(
    @CurrentUser()
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User profile fetched successfully',
      timestamp: new Date().toISOString(),
      data: user,
    };
  }

  @Get('lookup')
  @RequireFeature(FEATURES.VIEW_BOOKINGS)
  @ApiOperation({
    summary:
      'Look up a user by email. Used by the CRM to decide whether a booking goes through the registered-user path or the guest path.',
  })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiResponse({ status: 404, description: 'No user with that email' })
  async lookupByEmail(@Query('email') rawEmail?: string) {
    const email = rawEmail?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('email query parameter is required');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        systemRole: true,
      },
    });

    if (!user) {
      throw new NotFoundException('No user with that email');
    }

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User found',
      timestamp: new Date().toISOString(),
      data: user,
    };
  }

  @Get('search')
  @RequireFeature(FEATURES.VIEW_BOOKINGS)
  @ApiOperation({
    summary:
      'Autocomplete users by partial email or name. Returns up to 10 matches.',
  })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@Query('q') rawQuery?: string) {
    const q = rawQuery?.trim();
    if (!q || q.length < 2) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Provide at least 2 characters',
        timestamp: new Date().toISOString(),
        data: [],
      };
    }

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        systemRole: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Users fetched successfully',
      timestamp: new Date().toISOString(),
      data: users,
    };
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({
    status: 200,
    description: 'User bookings fetched successfully',
  })
  async getMyBookings(@CurrentUser() user: JwtUser) {
    if (user.systemRole === SYSTEM_ROLES.CUSTOMER && !user.businessId) {
      throw new BadRequestException(
        'Customer session missing business context. Please log in through your business website.',
      );
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        userId: user.id,
        ...(user.businessId ? { businessId: user.businessId } : {}),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            image: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        },
        serviceProvider: {
          select: {
            id: true,
            impUrl: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            deletedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = bookings.map((booking) => ({
      ...booking,
      review:
        booking.review && !booking.review.deletedAt
          ? {
              id: booking.review.id,
              rating: booking.review.rating,
              comment: booking.review.comment,
              createdAt: booking.review.createdAt,
              updatedAt: booking.review.updatedAt,
            }
          : null,
    }));

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User bookings fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('my-businesses')
  @ApiOperation({ summary: 'Get current user businesses' })
  @ApiResponse({
    status: 200,
    description: 'User businesses fetched successfully',
  })
  async getMyBusinesses(@CurrentUser() user: { id: string }) {
    const userBusinesses = await this.prisma.userBusiness.findMany({
      where: {
        userId: user.id,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            email: true,
            phone: true,
            logo: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User businesses fetched successfully',
      timestamp: new Date().toISOString(),
      data: userBusinesses.map((ub) => ub.business),
    };
  }
}
