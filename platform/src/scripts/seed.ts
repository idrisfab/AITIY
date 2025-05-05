import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing data
  await prisma.embedConfiguration.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      hashedPassword: 'password1',
      name: 'Alice',
      emailVerified: new Date(),
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      hashedPassword: 'password2',
      name: 'Bob',
      emailVerified: new Date(),
    },
  });

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Team Alpha',
      description: 'First test team',
      ownerId: user1.id,
      members: { connect: [{ id: user1.id }, { id: user2.id }] },
    },
  });
  const team2 = await prisma.team.create({
    data: {
      name: 'Team Beta',
      description: 'Second test team',
      ownerId: user2.id,
      members: { connect: [{ id: user1.id }, { id: user2.id }] },
    },
  });

  console.log('Seeded users:', { user1, user2 });
  console.log('Seeded teams:', { team1, team2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 