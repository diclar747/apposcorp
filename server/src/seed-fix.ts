
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed with REQUESTED CREDENTIALS...');

    // Specific hashing for different passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);

    // List of users from mockData.ts
    const usersToSync = [
        {
            id: 'user-1',
            email: 'admin@oscorp.com',
            password: adminPassword,
            roles: ['superadmin'],
            firstName: 'Super',
            lastName: 'Admin'
        },
        {
            id: 'user-2',
            email: 'vendedor1@oscorp.com',
            password: sellerPassword,
            roles: ['seller'],
            firstName: 'Carlos',
            lastName: 'Martínez',
            sellerProfile: {
                storeName: 'Tecnología Plus',
                storeSlug: 'tecnologia-plus',
                description: 'Store 1',
                address: 'Asuncion',
                phone: '123',
                email: 'vendedor1@oscorp.com',
                whatsappNumber: '123',
            }
        },
        {
            id: 'user-3',
            email: 'vendedor2@oscorp.com',
            password: sellerPassword,
            roles: ['seller'],
            firstName: 'María',
            lastName: 'González',
            sellerProfile: {
                storeName: 'Style Hub',
                storeSlug: 'style-hub',
                description: 'Moda',
                address: 'Asuncion',
                phone: '123',
                email: 'vendedor2@oscorp.com',
                whatsappNumber: '123',
            }
        },
        {
            id: 'user-7',
            email: 'tech@oscorp.com',
            password: sellerPassword,
            roles: ['seller'],
            firstName: 'Elena',
            lastName: 'Vega',
            sellerProfile: {
                storeName: 'TechHub Premium',
                storeSlug: 'techhub',
                description: 'Tech',
                address: 'Asuncion',
                phone: '123',
                email: 'tech@oscorp.com',
                whatsappNumber: '123',
            }
        },
        {
            id: 'user-8',
            email: 'gourmet@oscorp.com',
            password: sellerPassword,
            roles: ['seller'],
            firstName: 'Marco',
            lastName: 'Rossian',
            sellerProfile: {
                storeName: 'Gourmet Market',
                storeSlug: 'gourmet-market',
                description: 'Gourmet',
                address: 'Asuncion',
                phone: '123',
                email: 'gourmet@oscorp.com',
                whatsappNumber: '123',
            }
        },
        {
            id: 'user-9',
            email: 'super@oscorp.com',
            password: sellerPassword,
            roles: ['seller'],
            firstName: 'Ricardo',
            lastName: 'Altamirano',
            sellerProfile: {
                storeName: 'Supermercado Oscorp',
                storeSlug: 'super-oscorp',
                description: 'Super',
                address: 'Asuncion',
                phone: '123',
                email: 'super@oscorp.com',
                whatsappNumber: '123',
            }
        },
        {
            id: 'user-4',
            email: 'cliente1@oscorp.com',
            password: clientPassword,
            roles: ['client'],
            firstName: 'Juan',
            lastName: 'Pérez'
        },
        {
            id: 'user-5',
            email: 'cliente2@oscorp.com',
            password: clientPassword,
            roles: ['client'],
            firstName: 'Ana',
            lastName: 'Rodríguez'
        }
    ];

    for (const user of usersToSync) {
        // 1. Clean up existing user with this ID or Email to avoid conflicts
        try {
            await prisma.user.deleteMany({
                where: {
                    OR: [
                        { id: user.id },
                        { email: user.email }
                    ]
                }
            });
            console.log(`Deleted existing records for ${user.email}`);
        } catch (e) {
            console.log(`No existing user to delete for ${user.email}`);
        }

        // 2. Create user with specific ID
        const createdUser = await prisma.user.create({
            data: {
                id: user.id, // Forcing the ID
                email: user.email,
                password: user.password, // Correct Hashed Password
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.roles as any,
                isActive: true,
                ingenioAccess: true,
                wallet: {
                    create: {
                        balance: 1000000,
                        currency: 'PYG'
                    }
                }
            }
        });

        console.log(`✅ Created user: ${user.email} with ID: ${createdUser.id} and Correct Password`);

        // 3. Create Seller Profile if needed
        if (user.sellerProfile) {
            await prisma.sellerProfile.create({
                data: {
                    userId: createdUser.id,
                    ...user.sellerProfile
                }
            });
            console.log(`   + Created seller profile for ${user.sellerProfile.storeName}`);
        }
    }

    console.log('✨ Seed completed successfully! ALL PASSWORDS SHOULD NOW BE CORRECT.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
