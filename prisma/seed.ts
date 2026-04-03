/**
 * Seed: upsert permissions and role→permission mappings.
 *
 * Run: npx ts-node -P tsconfig.seed.json prisma/seed.ts
 *
 * Idempotent — safe to re-run after schema changes.
 * Uses the dynamic Role model (not the legacy UserRole enum).
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Permission } from '../src/module/permissions/permissions.constants';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── System roles ─────────────────────────────────────────────────────────────

const SYSTEM_ROLES: { name: string; description: string }[] = [
  { name: 'Customer',         description: 'End users who book services' },
  { name: 'Service_Provider', description: 'Staff who provide services' },
  { name: 'Business_owner',   description: 'Business owners who manage their business' },
  { name: 'Super_Admin',      description: 'Platform super administrators' },
];

// ─── Permission definitions ───────────────────────────────────────────────────

const PERMISSION_DEFS: { code: string; description: string }[] = [
  { code: Permission.ADMIN_BUSINESS_OWNER_LIST,  description: 'List all business owners (super admin)' },
  { code: Permission.ADMIN_BUSINESS_OWNER_READ,  description: 'Read a single business owner (super admin)' },
  { code: Permission.USER_UPDATE,                description: 'Update user records via admin tooling' },
  { code: Permission.BOOKING_CREATE,             description: 'Create bookings' },
  { code: Permission.BOOKING_VIEW_OWN,           description: 'View own bookings' },
  { code: Permission.BOOKING_VIEW_BUSINESS,      description: 'View bookings for the business' },
  { code: Permission.SERVICE_READ,               description: 'Read services' },
];

// ─── Role → permission mappings ───────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Super_Admin:      [Permission.ADMIN_BUSINESS_OWNER_LIST, Permission.ADMIN_BUSINESS_OWNER_READ, Permission.USER_UPDATE],
  Customer:         [Permission.BOOKING_CREATE, Permission.BOOKING_VIEW_OWN],
  Business_owner:   [Permission.BOOKING_VIEW_BUSINESS, Permission.SERVICE_READ],
  Service_Provider: [Permission.BOOKING_VIEW_BUSINESS, Permission.SERVICE_READ],
};

async function main() {
  // 1. Upsert system roles
  console.log('Seeding system roles...');
  for (const def of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where:  { name: def.name },
      create: { name: def.name, description: def.description, isSystem: true },
      update: { description: def.description, isSystem: true },
    });
  }

  // 2. Upsert permissions
  console.log('Seeding permissions...');
  for (const def of PERMISSION_DEFS) {
    await prisma.permission.upsert({
      where:  { code: def.code },
      create: { code: def.code, description: def.description },
      update: { description: def.description },
    });
  }

  // 3. Link roles → permissions
  console.log('Linking role permissions...');
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });

    for (const code of codes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
      await prisma.rolePermission.upsert({
        where:  { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }

  console.log('Seed complete: roles, permissions, and role_permissions applied.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
