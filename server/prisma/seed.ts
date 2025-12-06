import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('test123', salt);

  // Create test users
  const [testUser, testUser2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
      },
    }),
    prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {},
      create: {
        username: 'testuser2',
        email: 'test2@example.com',
        password: hashedPassword,
      },
    })
  ]);

  console.log('Test users created:', [
    { email: testUser.email, id: testUser.id },
    { email: testUser2.email, id: testUser2.id }
  ]);

  // Create a conversation between the two users
  const conversation = await prisma.conversation.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440001' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      participants: {
        create: [
          { userId: testUser.id },
          { userId: testUser2.id }
        ]
      },
      messages: {
        create: [
          {
            content: 'Hey there!',
            senderId: testUser.id,
          },
          {
            content: 'Hi! How are you?',
            senderId: testUser2.id,
          },
          {
            content: 'I\'m doing great, thanks for asking!',
            senderId: testUser.id,
          }
        ]
      }
    },
    include: {
      messages: true
    }
  });

  console.log('Conversation created with messages:', {
    conversationId: conversation.id,
    messageCount: conversation.messages.length
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
