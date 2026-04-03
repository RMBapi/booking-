import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { Permission } from '../permissions/permissions.constants';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Roles (RBAC)')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('Super_Admin')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ─── Role CRUD ──────────────────────────────────────────────────────────────

  @Get()
  @Permissions(Permission.ADMIN_BUSINESS_OWNER_LIST)
  @ApiOperation({ summary: 'List all roles (Super_Admin)' })
  async listRoles() {
    return { success: true, data: await this.rolesService.listRoles() };
  }

  @Get(':id')
  @Permissions(Permission.ADMIN_BUSINESS_OWNER_READ)
  @ApiOperation({ summary: 'Get a role with its permissions (Super_Admin)' })
  async getRole(@Param('id') id: string) {
    return { success: true, data: await this.rolesService.getRole(id) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic role (Super_Admin)' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 409, description: 'Role name already taken' })
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.rolesService.createRole(dto);
    return { success: true, statusCode: HttpStatus.CREATED, data: role };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a non-system role (Super_Admin)' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 400, description: 'System roles cannot be deleted' })
  async deleteRole(@Param('id') id: string) {
    await this.rolesService.deleteRole(id);
  }

  // ─── Permission management ──────────────────────────────────────────────────

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign permission codes to a role (Super_Admin)' })
  async assignPermissions(
    @Param('id') roleId: string,
    @Body('codes') codes: string[],
  ) {
    await this.rolesService.assignPermissionsToRole(roleId, codes);
    return { success: true, message: `Permissions assigned to role ${roleId}` };
  }

  @Delete(':id/permissions/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a permission from a role (Super_Admin)' })
  async revokePermission(
    @Param('id') roleId: string,
    @Param('code') code: string,
  ) {
    await this.rolesService.revokePermissionFromRole(roleId, code);
  }

  // ─── User ↔ Role management ─────────────────────────────────────────────────

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all roles assigned to a user (Super_Admin)' })
  async getUserRoles(@Param('userId') userId: string) {
    return { success: true, data: await this.rolesService.getUserRoles(userId) };
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a role to a user (Super_Admin)' })
  async assignRoleToUser(@Body() dto: AssignRoleDto) {
    await this.rolesService.assignRoleToUser(dto);
    return { success: true, message: `Role "${dto.roleName}" assigned to user ${dto.userId}` };
  }

  @Delete('user/:userId/role/:roleName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a role from a user (Super_Admin)' })
  async revokeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleName') roleName: string,
  ) {
    await this.rolesService.revokeRoleFromUser(userId, roleName);
  }
}
