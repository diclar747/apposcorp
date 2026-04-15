import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'testuser@example.com' },
    include: { wallet: true }
  });
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkUser();
