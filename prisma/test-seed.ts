import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting incremental test seed...');

    // Clean up
    await prisma.store.deleteMany();
    await prisma.sellerProfile.deleteMany();
    await prisma.virtualCard.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();

    const adminPass = await bcrypt.hash('123456', 10);
    const sellerPass = await bcrypt.hash('seller123', 10);
    const clientPass = await bcrypt.hash('client123', 10);

    // 1. Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@oscorp.com',
            password: adminPass,
            firstName: 'Admin',
            lastName: 'Oscorp',
            roles: ['superadmin'],
            isActive: true
        }
    });
    console.log('✅ Admin user created');

    const adminWallet = await prisma.wallet.create({
        data: {
            userId: admin.id,
            balance: 1000000,
            currency: 'PYG'
        }
    });
    console.log('✅ Admin wallet created');

    await prisma.virtualCard.create({
        data: {
            userId: admin.id,
            walletId: adminWallet.id,
            cardNumber: 'OSC-ADM-001',
            qrData: 'admin-qr',
            design: 'gradient_dark'
        }
    });
    console.log('✅ Admin card created');

    // 2. Seller (TechHub)
    const sellerUser = await prisma.user.create({
        data: {
            email: 'tech@oscorp.com',
            password: sellerPass,
            firstName: 'Elena',
            lastName: 'Vega',
            roles: ['seller'],
            isActive: true
        }
    });
    console.log('✅ Seller user created');

    const sellerWallet = await prisma.wallet.create({
        data: {
            userId: sellerUser.id,
            balance: 5000000,
            currency: 'PYG'
        }
    });

    const sellerProfile = await prisma.sellerProfile.create({
        data: {
            userId: sellerUser.id,
            storeName: 'TechHub Premium',
            storeSlug: 'techhub-premium',
            description: 'Liderando la innovación tecnológica.',
            address: 'Paseo La Galería, Asunción',
            phone: '+595 991 111222',
            email: 'tech@oscorp.com',
            whatsappNumber: '+595 991 111222',
            isVerified: true,
            planActive: true
        }
    });

    await prisma.store.create({
        data: {
            sellerId: sellerProfile.id,
            name: 'TechHub Premium',
            slug: 'techhub-premium',
            description: 'Liderando la innovación tecnológica.',
            address: 'Paseo La Galería, Asunción',
            phone: '+595 991 111222',
            email: 'tech@oscorp.com',
            whatsappNumber: '+595 991 111222',
            category: 'Tecnología'
        }
    });
    console.log('✅ TechHub store created');

    // 3. Client
    const clientUser = await prisma.user.create({
        data: {
            email: 'cliente2@oscorp.com',
            password: clientPass,
            firstName: 'Ana',
            lastName: 'Rodríguez',
            roles: ['client'],
            isActive: true
        }
    });

    await prisma.wallet.create({
        data: {
            userId: clientUser.id,
            balance: 8500000,
            currency: 'PYG'
        }
    });
    console.log('✅ Client created');

    console.log('\n🚀 SEED COMPLETED SUCCESSFULLY');
}

main()
    .catch((e) => {
        console.error('❌ SEED FAILED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
