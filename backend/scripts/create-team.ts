import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all users that don't have teams
  const users = await prisma.user.findMany({
    include: {
      teams: true
    }
  });

  console.log(`Found ${users.length} users`);

  for (const user of users) {
    if (user.teams.length === 0) {
      console.log(`Creating team for user ${user.email}`);
      
      // Create a default team
      const team = await prisma.team.create({
        data: {
          name: `${user.name || user.email.split('@')[0]}'s Team`,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });
      
      console.log(`Created team ${team.id} for user ${user.email}`);
    } else {
      console.log(`User ${user.email} already has ${user.teams.length} teams`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
