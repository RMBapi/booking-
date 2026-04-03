import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CacheEntry {
  codes: Set<string>;
  expiresAt: number;
}

/**
 * Resolves Permission.code strings for a role (by name) via the dynamic
 * Role → RolePermission → Permission chain.
 *
 * Uses a short in-memory TTL cache to avoid a DB round-trip on every request.
 * Call invalidateCache() after mutating RolePermission rows.
 */
@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly cache = new Map<string, CacheEntry>(); // key = role name
  private readonly ttlMs: number;

  constructor(private readonly prisma: PrismaService) {
    this.ttlMs =
      Number(process.env.PERMISSION_CACHE_TTL_MS) > 0
        ? Number(process.env.PERMISSION_CACHE_TTL_MS)
        : 60_000;
  }

  /**
   * Returns all permission codes granted to a role (by name), cached.
   */
  async getCodesForRole(roleName: string): Promise<Set<string>> {
    const now = Date.now();
    const hit = this.cache.get(roleName);
    if (hit && hit.expiresAt > now) {
      return hit.codes;
    }

    const rows = await this.prisma.rolePermission.findMany({
      where: { role: { name: roleName } },
      select: { permission: { select: { code: true } } },
    });

    const codes = new Set(rows.map((r) => r.permission.code));
    this.cache.set(roleName, { codes, expiresAt: now + this.ttlMs });
    this.logger.debug(
      `Loaded ${codes.size} permission(s) for role "${roleName}" (TTL ${this.ttlMs}ms)`,
    );
    return codes;
  }

  /**
   * Returns true if the role has every listed permission (AND semantics).
   */
  async roleHasAllPermissions(
    roleName: string,
    required: readonly string[],
  ): Promise<boolean> {
    if (required.length === 0) {
      return true;
    }
    const codes = await this.getCodesForRole(roleName);
    return required.every((p) => codes.has(p));
  }

  /**
   * Evict cache after mutating permissions or role-permission mappings.
   * Pass a role name to evict only that entry, or omit to clear all.
   */
  invalidateCache(roleName?: string): void {
    if (roleName === undefined) {
      this.cache.clear();
      this.logger.debug('Permission cache cleared (all roles)');
    } else {
      this.cache.delete(roleName);
      this.logger.debug(`Permission cache cleared for role "${roleName}"`);
    }
  }
}
