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

  @Public()
  @Get('health')
  @ApiExcludeEndpoint()
  health(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
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
        systemRole: string;
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
          systemRole: user.systemRole,
        },
        welcomeMessage: `Welcome ${user.firstName}! You are logged in as ${user.systemRole}`,
      },
    };
  }
}
