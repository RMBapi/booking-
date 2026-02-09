import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

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

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({
    status: 200,
    description: 'User bookings fetched successfully',
  })
  async getMyBookings(@CurrentUser() user: { id: string }) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User bookings fetched successfully',
      timestamp: new Date().toISOString(),
      data: bookings,
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
            logoUrl: true,
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
