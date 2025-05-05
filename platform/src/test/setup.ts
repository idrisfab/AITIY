import { prisma } from '../index';
import { EmailService } from '../services/email.service';

// Mock the email service
jest.mock('../services/email.service', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  },
}));

beforeEach(async () => {
  // Clean up the test database before each test
  await prisma.embedConfiguration.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // Disconnect Prisma after all tests
  await prisma.$disconnect();
}); 