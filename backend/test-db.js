const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to DB');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Query successful, found', users.length, 'users');
  } catch (e) {
    console.error('Failed to connect or query:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
