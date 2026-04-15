
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Reparando precios nulos...');
  
  const standard = await prisma.subscriptionPlan.findFirst({ where: { tier: 'standard' } });
  if (standard) {
    await prisma.subscriptionPlan.update({
      where: { id: standard.id },
      data: {
        prices: { monthly: 120000, quarterly: 330000, semi_annual: 630000, annual: 1200000 }
      }
    });
    console.log('Plan Estándar reparado.');
  }

  const commercial = await prisma.subscriptionPlan.findFirst({ where: { tier: 'commercial' } });
  if (commercial) {
    await prisma.subscriptionPlan.update({
      where: { id: commercial.id },
      data: {
        prices: { monthly: 160000, quarterly: 430000, semi_annual: 830000, annual: 1550000 }
      }
    });
    console.log('Plan Comercial reparado.');
  }

  console.log('Reparación completada.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
