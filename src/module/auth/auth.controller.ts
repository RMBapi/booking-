import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  readCookie,
  setRefreshCookie,
} from '../../common/cookies';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(registerDto);
    await this.attachRefreshCookie(req, res, result.user.id, result.businessId);
    return result;
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);
    await this.attachRefreshCookie(req, res, result.user.id, result.businessId);
    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user, system role, and businesses with permissions',
  })
  @ApiResponse({ status: 200, type: MeResponseDto })
  async getMe(@CurrentUser() user: { id: string }): Promise<MeResponseDto> {
    return this.authService.getMe(user.id);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new access token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const presented = readCookie(req, REFRESH_COOKIE_NAME);
    if (!presented) throw new UnauthorizedException('Missing refresh token');
    const pair = await this.authService.rotateRefreshToken(presented, {
      userAgent: req.headers['user-agent'] ?? undefined,
      ip: req.ip ?? undefined,
    });
    setRefreshCookie(res, pair.refreshToken, {
      maxAgeSeconds: Math.floor(
        (pair.refreshTokenExpiresAt.getTime() - Date.now()) / 1000,
      ),
    });
    return { accessToken: pair.accessToken };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary:
      'Change the authenticated user password. Clears passwordChangeRequired and rotates refresh tokens.',
  })
  async changePassword(
    @CurrentUser() current: { id: string; businessId?: string },
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      current.id,
      dto,
      {
        userAgent: req.headers['user-agent'] ?? undefined,
        ip: req.ip ?? undefined,
      },
      current.businessId,
    );
    setRefreshCookie(res, result.refreshToken, {
      maxAgeSeconds: Math.floor(
        (result.refreshTokenExpiresAt.getTime() - Date.now()) / 1000,
      ),
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
      timestamp: new Date().toISOString(),
      data: { accessToken: result.accessToken, user: result.user },
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const presented = readCookie(req, REFRESH_COOKIE_NAME);
    await this.authService.logoutByRefreshToken(presented);
    clearRefreshCookie(res);
  }

  private async attachRefreshCookie(
    req: Request,
    res: Response,
    userId: string,
    businessId?: string,
  ): Promise<void> {
    const { token, expiresAt } = await this.authService.issueRefreshToken(
      userId,
      {
        userAgent: req.headers['user-agent'] ?? undefined,
        ip: req.ip ?? undefined,
      },
      businessId,
    );
    setRefreshCookie(res, token, {
      maxAgeSeconds: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
  }
}
