import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma with adapter (Prisma 7 requirement)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetSuperAdminPassword() {
  console.log('🔐 Resetting Super Admin password...\n');

  const email = 'rafidbapi@example.com';
  const newPassword = 'password123'; // This will be the new password

  try {
    // Find Super Admin
    console.log(`Looking for Super Admin: ${email}`);
    const admin = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!admin) {
      console.log('❌ Super Admin not found!');
      return;
    }

    console.log('✅ Super Admin found!');
    console.log('🆔 ID:', admin.id);
    console.log('👤 Name:', admin.firstName, admin.lastName);
    console.log('\n🔒 Hashing new password...');

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    console.log('💾 Updating password in database...');
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash: passwordHash,
      },
    });

    console.log('\n✅ Password updated successfully!\n');
    console.log('='.repeat(50));
    console.log('🎯 NEW LOGIN CREDENTIALS');
    console.log('='.repeat(50));
    console.log(`Email:    ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Role:     Super_Admin`);
    console.log('='.repeat(50));

    console.log('\n📝 Login Request Body:');
    console.log(JSON.stringify({
      email: email,
      password: newPassword,
      role: 'Super_Admin',
    }, null, 2));

    console.log('\n✅ You can now login with these credentials!\n');

  } catch (error) {
    console.error('\n❌ Error resetting password:', error);
    throw error;
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

// Run the script
resetSuperAdminPassword()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
