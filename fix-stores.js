
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixStores() {
    // Fix Tecnología Plus
    await prisma.sellerProfile.update({
        where: { storeSlug: 'tecnologia-plus' },
        data: {
            category: 'Tecnología',
            planActive: true,
            banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
            logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200'
        }
    });

    // Fix Fashion Trends
    await prisma.sellerProfile.update({
        where: { storeSlug: 'fashion-trends' },
        data: {
            category: 'Moda'
        }
    });

    console.log('Stores data updated successfully');
}

fixStores()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
