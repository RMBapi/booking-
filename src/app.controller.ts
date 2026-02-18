import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { Public } from './module/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiExcludeEndpoint()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiExcludeEndpoint()
  getDashboard(
    @Request()
    req: {
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        activeRole: string;
      };
    },
  ) {
    const user = req.user;

    return {
      success: true,
      message: 'Dashboard loaded successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          activeRole: user.activeRole,
        },
        welcomeMessage: `Welcome ${user.firstName}! You are logged in as ${user.activeRole}`,
        availableEndpoints: this.getEndpointsByRole(user.activeRole),
      },
    };
  }

  private getEndpointsByRole(role: string): string[] {
    const endpoints: Record<string, string[]> = {
      Super_Admin: [
        'GET /admin/business-owners - List all business owners',
        'GET /admin/business-owner/:id - Get business owner details',
        'PATCH /admin/user/:id - Update user details (including isActive)',
      ],
      Business_owner: [
        'POST /business - Create business profile',
        'GET /business/check-has-business - Check if user has business',
        'GET /business/my-businesses - Get user businesses',
        'PATCH /business/:id - Update business',
        'DELETE /business/:id - Delete business',
        'GET /business/:id/owners - Get business owners',
        'POST /business/:id/owners - Add owner to business',
        'POST /business/:id/owners/by-email - Add owner by email',
        'DELETE /business/:id/owners/:userId - Remove owner from business',
      ],
      Customer: [
        'POST /booking - Create booking',
        'GET /user/my-bookings - Get user bookings',
        'GET /business/slug/:slug - View business profile',
      ],
      Service_Provider: [
        'GET /service - List services',
        'POST /service - Create service',
        'GET /booking - List bookings',
      ],
    };

    return endpoints[role] ?? [];
  }
}
