
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function listStores() {
    const stores = await prisma.sellerProfile.findMany({
        include: { user: true }
    });
    console.log('=== STORES IN DB ===');
    stores.forEach(s => {
        console.log(`- Name: ${s.storeName}, Slug: ${s.storeSlug}, Active: ${s.planActive}, Category: ${s.category}, User: ${s.user.email}, UserActive: ${s.user.isActive}`);
    });
}

listStores()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
