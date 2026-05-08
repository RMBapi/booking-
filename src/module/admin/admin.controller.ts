import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateBusinessOwnerDto } from './dto/create-business-owner.dto';
import { SetActivationDto } from './dto/set-activation.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('business-owners')
  @ApiOperation({ summary: 'Get all business owners (Super Admin only)' })
  async getAllBusinessOwners() {
    const data = await this.adminService.getAllBusinessOwners();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business owners fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Get('business-owner/:id')
  @ApiOperation({ summary: 'Get a business owner by ID (Super Admin only)' })
  async getBusinessOwnerById(@Param('id') id: string) {
    const data = await this.adminService.getBusinessOwnerById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business owner fetched successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  @Post('business-owners')
  @ApiOperation({
    summary:
      'Create a Business_owner user (no business, no email). Stage 1 of owner onboarding.',
    description:
      'Creates an inactive User with the Super_Admin-supplied password. The Super_Admin shares the password out-of-band, then activates the account via PATCH /admin/business-owners/:id/activation. The owner creates their own Business via POST /business/onboarding after first login + password change.',
  })
  @ApiResponse({ status: 201 })
  async createBusinessOwner(@Body() dto: CreateBusinessOwnerDto) {
    const user = await this.adminService.createBusinessOwner(dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message:
        'Business owner created. Share the password securely with the user.',
      timestamp: new Date().toISOString(),
      data: { user },
    };
  }

  @Patch('business-owners/:id/activation')
  @ApiOperation({ summary: 'Toggle Business_owner active status' })
  async setBusinessOwnerActivation(
    @Param('id') id: string,
    @Body() dto: SetActivationDto,
  ) {
    const user = await this.adminService.setBusinessOwnerActivation(
      id,
      dto.isActive,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: dto.isActive
        ? 'Business owner activated'
        : 'Business owner deactivated',
      timestamp: new Date().toISOString(),
      data: { user },
    };
  }

  @Patch('user/:id')
  @ApiOperation({ summary: 'Update user details (Super Admin only)' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.adminService.updateUser(id, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
      data,
    };
  }
}
