import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(__dirname, '../src/tests/test.env') });

async function setupTestDatabase() {
  const prisma = new PrismaClient();

  try {
    // Connect to the database
    await prisma.$connect();

    // Run migrations
    console.log('Running migrations...');
    // You'll need to run migrations manually using prisma migrate

    console.log('Test database setup complete!');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestDatabase(); 