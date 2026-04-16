
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('Starting diagnosis...');
    
    const count = await prisma.user.count();
    console.log('User count:', count);

    const rolesTest = await prisma.user.count({
      where: { roles: { has: 'client' } }
    });
    console.log('Roles test (has client):', rolesTest);

    const storeTest = await prisma.sellerProfile.count({
      where: { user: { createdAt: { lte: new Date() } } }
    });
    console.log('Store relation test:', storeTest);

    const aggregateTest = await prisma.order.aggregate({
      _sum: { total: true, commissionAmount: true },
      where: { paymentStatus: 'paid' }
    });
    console.log('Aggregate test:', aggregateTest);

    console.log('All tests passed!');
  } catch (error) {
    console.error('DIAGNOSIS FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
