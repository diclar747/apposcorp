import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, name: true, maxProducts: true, price: true }
  });
  console.log(JSON.stringify(plans, null, 2));
  await prisma.$disconnect();
}

checkPlans();
