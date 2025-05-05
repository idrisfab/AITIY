import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.chatEmbed.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: hashedPassword,
      name: 'Alice Smith',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: hashedPassword,
      name: 'Bob Johnson',
    },
  });

  // Create API keys for testing
  const aliceApiKey = await prisma.apiKey.create({
    data: {
      name: 'OpenAI Test Key',
      key: 'sk-test-alice123',
      vendor: 'openai',
      userId: alice.id,
    },
  });

  const bobApiKey = await prisma.apiKey.create({
    data: {
      name: 'OpenAI Test Key',
      key: 'sk-test-bob123',
      vendor: 'openai',
      userId: bob.id,
    },
  });

  // Create teams
  const teamAlpha = await prisma.team.create({
    data: {
      name: 'Team Alpha',
      description: 'Development team for Project X',
    },
  });

  const teamBeta = await prisma.team.create({
    data: {
      name: 'Team Beta',
      description: 'Marketing team for Project Y',
    },
  });

  // Create team members
  await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: alice.id,
      role: 'OWNER',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: bob.id,
      role: 'MEMBER',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: bob.id,
      role: 'OWNER',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: alice.id,
      role: 'MEMBER',
    },
  });

  // Create some test embeds
  const embed1 = await prisma.chatEmbed.create({
    data: {
      teamId: teamAlpha.id,
      systemPrompt: 'You are a helpful customer support assistant.',
    },
  });

  const embed2 = await prisma.chatEmbed.create({
    data: {
      teamId: teamBeta.id,
      systemPrompt: 'You are a creative marketing assistant.',
    },
  });

  console.log('🌱 Seed data created successfully:');
  console.log('Users:', {
    alice: { id: alice.id, email: alice.email },
    bob: { id: bob.id, email: bob.email },
  });
  console.log('Teams:', {
    alpha: { id: teamAlpha.id, name: teamAlpha.name },
    beta: { id: teamBeta.id, name: teamBeta.name },
  });
  console.log('Embeds:', {
    supportBot: { id: embed1.id, systemPrompt: embed1.systemPrompt },
    marketingBot: { id: embed2.id, systemPrompt: embed2.systemPrompt },
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 