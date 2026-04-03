/**
 * Utility script: create (or verify) the Super Admin account.
 * Uses the dynamic RBAC system (userRoles join table) post-migration.
 *
 * Run: npx ts-node scripts/create-super-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
  console.log('Creating Super Admin account...\n');

  // Override defaults via env vars (avoids editing this file per environment)
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'bapi@gmail.com';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'password';
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? 'Admin';
  const phone = process.env.SUPER_ADMIN_PHONE ?? '01834284316';

  console.log('Using Super Admin credentials:');
  console.log('- Email:    ', email);
  console.log('- FirstName:', firstName);
  console.log('- LastName: ', lastName);
  console.log('- Phone:    ', phone);
  console.log('- Password: ', password ? '(set)' : '(empty)');

  try {
    // Check existence via the dynamic userRoles join table
    const existing = await prisma.user.findFirst({
      where: {
        email,
        userRoles: { some: { role: { name: 'Super_Admin' } } },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (existing) {
      console.log('Super Admin already exists!');
      console.log('Email:', existing.email);
      console.log('Name:', existing.firstName, existing.lastName);
      console.log('ID:', existing.id);
      console.log('Active:', existing.isActive);
      return;
    }

    // Ensure the Super_Admin role row exists (run seed first if missing)
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super_Admin' },
    });
    if (!superAdminRole) {
      throw new Error(
        'Super_Admin Role not found in DB. Run seed first: npx ts-node -P tsconfig.seed.json prisma/seed.ts',
      );
    }

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('Creating Super Admin in database...');
    const admin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: superAdminRole.id },
      });

      return user;
    });

    console.log('\nSuper Admin created successfully!\n');
    console.log('='.repeat(50));
    console.log('ID:       ', admin.id);
    console.log('Name:     ', admin.firstName, admin.lastName);
    console.log('Email:    ', admin.email);
    console.log('Phone:    ', admin.phone);
    console.log('Password: ', password, '  (change after first login)');
    console.log('Role:      Super_Admin');
    console.log('Active:   ', admin.isActive);
    console.log('Created:  ', admin.createdAt);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\nError creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createSuperAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
