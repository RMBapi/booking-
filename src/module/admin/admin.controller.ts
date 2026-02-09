import {
  Controller,
  Get,
  Patch,
  Param,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.Super_Admin)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('business-owners')
  @ApiOperation({ summary: 'Get all business owners (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Business owners fetched successfully',
  })
  async getAllBusinessOwners() {
    const businessOwners = await this.adminService.getAllBusinessOwners();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business owners fetched successfully',
      timestamp: new Date().toISOString(),
      data: businessOwners,
    };
  }

  @Get('business-owner/:id')
  @ApiOperation({ summary: 'Get a business owner by ID (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Business owner fetched successfully',
  })
  async getBusinessOwnerById(@Param('id') id: string) {
    const businessOwner = await this.adminService.getBusinessOwnerById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business owner fetched successfully',
      timestamp: new Date().toISOString(),
      data: businessOwner,
    };
  }

  @Patch('business-owner/:id/toggle-status')
  @ApiOperation({
    summary: 'Toggle business owner active status (Super Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Business owner status updated successfully',
  })
  async toggleBusinessOwnerStatus(@Param('id') id: string) {
    const businessOwner =
      await this.adminService.toggleBusinessOwnerStatus(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business owner status updated successfully',
      timestamp: new Date().toISOString(),
      data: businessOwner,
    };
  }
}
