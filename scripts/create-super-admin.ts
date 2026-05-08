/**
 * Utility script: create (or verify) the Super Admin account.
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
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'bapi@gmail.com';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'password';
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? 'Admin';
  const phone = process.env.SUPER_ADMIN_PHONE ?? '01834284316';

  console.log('Creating Super Admin account...');
  console.log('- Email:    ', email);

  try {
    const existing = await prisma.user.findFirst({
      where: { email, systemRole: 'Super_Admin', deletedAt: null },
      select: { id: true, email: true, isActive: true },
    });

    if (existing) {
      console.log('Super Admin already exists:', existing.email, existing.id);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        isActive: true,
        systemRole: 'Super_Admin',
      },
      select: { id: true, email: true },
    });

    console.log('Super Admin created:', admin.id, admin.email);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createSuperAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
