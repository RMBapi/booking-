/**
 * Seed: create one Super_Admin from env vars (idempotent).
 *
 * Run: npx ts-node -P tsconfig.seed.json prisma/seed.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      'SEED_SUPER_ADMIN_EMAIL/PASSWORD not set, skipping super admin seed',
    );
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, systemRole: true },
  });

  if (existing) {
    if (existing.systemRole !== 'Super_Admin') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { systemRole: 'Super_Admin', isActive: true },
      });
      console.log(`Super admin role applied to existing user: ${email}`);
    } else {
      console.log(`Super admin already exists: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      firstName: 'Super',
      lastName: 'Admin',
      email,
      phone: '',
      passwordHash,
      systemRole: 'Super_Admin',
      isActive: true,
    },
  });
  console.log(`Super admin seeded: ${email}`);
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
