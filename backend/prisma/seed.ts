import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seeds the database with initial test users.
 * Creates three users: adam, thomas, and clara with password 'password123'.
 * 
 * @returns Promise<void>
 */
async function main(): Promise<void> {
  console.log('Starting database seed...');

  // Hash the password once for all users (in production, each would have unique passwords)
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create test users
  const adam = await prisma.user.upsert({
    where: { username: 'adam' },
    update: {},
    create: {
      username: 'adam',
      passwordHash,
    },
  });

  const thomas = await prisma.user.upsert({
    where: { username: 'thomas' },
    update: {},
    create: {
      username: 'thomas',
      passwordHash,
    },
  });

  const clara = await prisma.user.upsert({
    where: { username: 'clara' },
    update: {},
    create: {
      username: 'clara',
      passwordHash,
    },
  });

  console.log('Created users:', { adam, thomas, clara });

  // Create a sample thread between adam and thomas
  const thread1 = await prisma.thread.create({
    data: {
      participants: {
        create: [
          { userId: adam.id },
          { userId: thomas.id },
        ],
      },
      messages: {
        create: [
          {
            senderId: adam.id,
            content: 'Hello thomas! How are you?',
          },
          {
            senderId: thomas.id,
            content: 'Hi adam! I\'m doing well, thanks for asking.',
          },
        ],
      },
    },
  });

  console.log('Created sample thread:', thread1);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
