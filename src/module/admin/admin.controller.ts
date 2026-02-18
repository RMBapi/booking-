import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
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
import { UpdateUserDto } from './dto/update-user.dto';

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

  @Patch('user/:id')
  @ApiOperation({
    summary: 'Update user details (Super Admin only)',
    description: `Update any user's information including firstName, lastName, email, phone, isActive status, and roles.
    
**Use Cases:**
- Activate/deactivate user accounts (toggle isActive)
- Update user contact information
- Modify user roles
- Correct user profile data

**Request Body (all fields optional):**
- \`firstName\` - User's first name
- \`lastName\` - User's last name
- \`email\` - User's email (must be unique)
- \`phone\` - User's phone number
- \`isActive\` - Active status (true/false)
- \`roles\` - Array of user roles

**Response:**
Returns updated user information.`,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use',
  })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.adminService.updateUser(id, updateUserDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
      data: user,
    };
  }
}
