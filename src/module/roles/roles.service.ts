import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionService } from '../permissions/permissions.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  // ─── Role CRUD ──────────────────────────────────────────────────────────────

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        createdAt: true,
        _count: { select: { userRoles: true, rolePermissions: true } },
      },
    });
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Role '${dto.name}' already exists`);

    return this.prisma.role.create({
      data: { name: dto.name, description: dto.description, isSystem: false },
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    await this.prisma.role.delete({ where: { id } });
    this.permissionService.invalidateCache(role.name);
    this.logger.log(`Role "${role.name}" (${id}) deleted`);
  }

  // ─── Permission assignment ──────────────────────────────────────────────────

  async assignPermissionsToRole(roleId: string, permissionCodes: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);

    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    const foundCodes = new Set(permissions.map((p) => p.code));
    const missing = permissionCodes.filter((c) => !foundCodes.has(c));
    if (missing.length) {
      throw new NotFoundException(`Unknown permission codes: ${missing.join(', ')}`);
    }

    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      skipDuplicates: true,
    });

    this.permissionService.invalidateCache(role.name);
    this.logger.log(`Assigned ${permissions.length} permission(s) to role "${role.name}"`);
  }

  async revokePermissionFromRole(roleId: string, permissionCode: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);

    const permission = await this.prisma.permission.findUnique({ where: { code: permissionCode } });
    if (!permission) throw new NotFoundException(`Permission '${permissionCode}' not found`);

    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: permission.id },
    });

    this.permissionService.invalidateCache(role.name);
  }

  // ─── User ↔ Role assignment ─────────────────────────────────────────────────

  async assignRoleToUser(dto: AssignRoleDto) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.role.findUnique({ where: { name: dto.roleName } }),
    ]);

    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);
    if (!role) throw new NotFoundException(`Role '${dto.roleName}' not found`);

    try {
      await this.prisma.userRole.create({ data: { userId: dto.userId, roleId: role.id } });
      this.logger.log(`Assigned role "${role.name}" to user ${dto.userId}`);
    } catch {
      throw new ConflictException(`User already has role '${dto.roleName}'`);
    }
  }

  async revokeRoleFromUser(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role '${roleName}' not found`);

    const deleted = await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });

    if (deleted.count === 0) {
      throw new NotFoundException(`User ${userId} does not have role '${roleName}'`);
    }
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userRoles: { select: { role: { select: { id: true, name: true, description: true } } } },
      },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return { userId: user.id, email: user.email, roles: user.userRoles.map((ur) => ur.role) };
  }
}
