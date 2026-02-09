import { PrismaClient, UserRole } from '@prisma/client';
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
  console.log('🚀 Creating Super Admin account...\n');

  const email = 'bapi@gmail.com';
  const password = 'password';
  const firstName = 'Super';
  const lastName = 'Admin';
  const phone = '+1234567890';

  try {
    console.log(`Checking if Super Admin exists with email: ${email}`);
    const existing = await prisma.user.findFirst({
      where: {
        email: email,
        roles: {
          has: UserRole.Super_Admin,
        },
      },
    });

    if (existing) {
      console.log('⚠️  Super Admin already exists!');
      console.log('📧 Email:', existing.email);
      console.log('👤 Name:', existing.firstName, existing.lastName);
      console.log('🆔 ID:', existing.id);
      console.log('✅ Active:', existing.isActive);
      console.log('\nTo login, use:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: Super_Admin`);
      return;
    }

    console.log('\n🔒 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    console.log('💾 Creating Super Admin in database...');
    const admin = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        passwordHash: passwordHash,
        roles: [UserRole.Super_Admin],
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roles: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('='.repeat(50));
    console.log('📋 SUPER ADMIN DETAILS');
    console.log('='.repeat(50));
    console.log('🆔 ID:', admin.id);
    console.log('👤 Name:', admin.firstName, admin.lastName);
    console.log('📧 Email:', admin.email);
    console.log('📱 Phone:', admin.phone);
    console.log('🔑 Password:', password);
    console.log('👔 Role:', admin.roles.join(', '));
    console.log('✅ Active:', admin.isActive);
    console.log('📅 Created:', admin.createdAt);
    console.log('='.repeat(50));

    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     Super_Admin`);
    console.log('='.repeat(50));

    console.log('\n📝 API Login Request:');
    console.log(JSON.stringify({
      email: admin.email,
      password: password,
      role: 'Super_Admin',
    }, null, 2));

    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('Change the password after first login.\n');

  } catch (error) {
    console.error('\n❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
