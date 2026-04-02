import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        phone: '+1234567890',
        password: hashedPassword,
        displayName: 'Alice Johnson',
        statusMessage: 'Living my best life ✨',
        onlineStatus: 'ONLINE',
        isVerified: true,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        phone: '+1234567891',
        password: hashedPassword,
        displayName: 'Bob Smith',
        statusMessage: 'Available',
        onlineStatus: 'ONLINE',
        isVerified: true,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie@example.com',
        phone: '+1234567892',
        password: hashedPassword,
        displayName: 'Charlie Brown',
        statusMessage: 'Busy coding 💻',
        onlineStatus: 'AWAY',
        isVerified: true,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'diana@example.com',
        phone: '+1234567893',
        password: hashedPassword,
        displayName: 'Diana Prince',
        statusMessage: 'Wonder Woman 🦸‍♀️',
        onlineStatus: 'ONLINE',
        isVerified: true,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'eve@example.com',
        phone: '+1234567894',
        password: hashedPassword,
        displayName: 'Eve Wilson',
        statusMessage: 'Exploring the world 🌍',
        onlineStatus: 'OFFLINE',
        lastSeen: new Date(Date.now() - 3600000),
        isVerified: true,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'frank@example.com',
        phone: '+1234567895',
        password: hashedPassword,
        displayName: 'Frank Castle',
        statusMessage: 'Punisher',
        onlineStatus: 'BUSY',
        isVerified: true,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        displayName: 'Admin User',
        statusMessage: 'System Administrator',
        onlineStatus: 'ONLINE',
        isVerified: true,
        role: 'ADMIN',
      },
    }),
  ]);

  const [alice, bob, charlie, diana, eve, frank] = users;

  // Create contacts
  await Promise.all([
    prisma.contact.create({ data: { userId: alice.id, contactUserId: bob.id } }),
    prisma.contact.create({ data: { userId: alice.id, contactUserId: charlie.id } }),
    prisma.contact.create({ data: { userId: alice.id, contactUserId: diana.id } }),
    prisma.contact.create({ data: { userId: bob.id, contactUserId: alice.id } }),
    prisma.contact.create({ data: { userId: bob.id, contactUserId: charlie.id } }),
    prisma.contact.create({ data: { userId: charlie.id, contactUserId: alice.id } }),
    prisma.contact.create({ data: { userId: charlie.id, contactUserId: diana.id } }),
    prisma.contact.create({ data: { userId: diana.id, contactUserId: alice.id } }),
    prisma.contact.create({ data: { userId: diana.id, contactUserId: eve.id } }),
    prisma.contact.create({ data: { userId: eve.id, contactUserId: frank.id } }),
    prisma.contact.create({ data: { userId: frank.id, contactUserId: eve.id } }),
  ]);

  // Create private chats
  const chatAliceBob = await prisma.chat.create({
    data: {
      type: 'PRIVATE',
      participants: {
        create: [
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const chatAliceCharlie = await prisma.chat.create({
    data: {
      type: 'PRIVATE',
      participants: {
        create: [
          { userId: alice.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const chatDianaEve = await prisma.chat.create({
    data: {
      type: 'PRIVATE',
      participants: {
        create: [
          { userId: diana.id, role: 'MEMBER' },
          { userId: eve.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create group chat
  const groupChat = await prisma.chat.create({
    data: {
      type: 'GROUP',
      name: 'Dev Team 🚀',
      description: 'Main development team chat',
      ownerId: alice.id,
      participants: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
          { userId: diana.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create messages
  const now = Date.now();

  await Promise.all([
    prisma.message.create({
      data: {
        chatId: chatAliceBob.id,
        senderId: alice.id,
        content: 'Hey Bob! How are you doing?',
        type: 'TEXT',
        status: 'READ',
      },
    }),
    prisma.message.create({
      data: {
        chatId: chatAliceBob.id,
        senderId: bob.id,
        content: 'Hi Alice! I\'m great, thanks for asking. Working on the new messaging app project.',
        type: 'TEXT',
        status: 'READ',
        createdAt: new Date(now + 60000),
      },
    }),
    prisma.message.create({
      data: {
        chatId: chatAliceBob.id,
        senderId: alice.id,
        content: 'That sounds awesome! Let me know if you need any help.',
        type: 'TEXT',
        status: 'DELIVERED',
        createdAt: new Date(now + 120000),
      },
    }),
    prisma.message.create({
      data: {
        chatId: groupChat.id,
        senderId: alice.id,
        content: 'Welcome everyone to the Dev Team chat! 🎉',
        type: 'TEXT',
        status: 'READ',
      },
    }),
    prisma.message.create({
      data: {
        chatId: groupChat.id,
        senderId: bob.id,
        content: 'Thanks Alice! Excited to be here.',
        type: 'TEXT',
        status: 'READ',
        createdAt: new Date(now + 30000),
      },
    }),
    prisma.message.create({
      data: {
        chatId: groupChat.id,
        senderId: charlie.id,
        content: 'Let\'s build something amazing together! 💪',
        type: 'TEXT',
        status: 'READ',
        createdAt: new Date(now + 60000),
      },
    }),
    prisma.message.create({
      data: {
        chatId: groupChat.id,
        senderId: diana.id,
        content: 'I\'ve already started working on the UI components. Will share a preview soon.',
        type: 'TEXT',
        status: 'DELIVERED',
        createdAt: new Date(now + 90000),
      },
    }),
    prisma.message.create({
      data: {
        chatId: chatAliceCharlie.id,
        senderId: charlie.id,
        content: 'Hey Alice, can we schedule a meeting for tomorrow?',
        type: 'TEXT',
        status: 'READ',
      },
    }),
    prisma.message.create({
      data: {
        chatId: chatDianaEve.id,
        senderId: diana.id,
        content: 'Hey Eve! Long time no see 😊',
        type: 'TEXT',
        status: 'READ',
      },
    }),
    prisma.message.create({
      data: {
        chatId: chatDianaEve.id,
        senderId: eve.id,
        content: 'Diana! Yes, it\'s been too long. How have you been?',
        type: 'TEXT',
        status: 'DELIVERED',
        createdAt: new Date(now + 45000),
      },
    }),
  ]);

  // Create statuses
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.status.create({
      data: {
        userId: alice.id,
        type: 'TEXT',
        content: 'Just launched our new messaging app! 🚀',
        expiresAt: tomorrow,
      },
    }),
    prisma.status.create({
      data: {
        userId: bob.id,
        type: 'TEXT',
        content: 'Coding all night long 💻☕',
        expiresAt: tomorrow,
      },
    }),
    prisma.status.create({
      data: {
        userId: diana.id,
        type: 'TEXT',
        content: 'Beautiful sunset today 🌅',
        expiresAt: tomorrow,
      },
    }),
  ]);

  console.log(`✅ Seeded ${users.length} users`);
  console.log('✅ Created contacts, chats, messages, and statuses');
  console.log('\n📧 Test accounts:');
  console.log('  alice@example.com / Password123!');
  console.log('  bob@example.com / Password123!');
  console.log('  charlie@example.com / Password123!');
  console.log('  diana@example.com / Password123!');
  console.log('  eve@example.com / Password123!');
  console.log('  frank@example.com / Password123!');
  console.log('  admin@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
