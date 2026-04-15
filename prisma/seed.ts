import { PrismaClient, UserRole, ProductType, CourseLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Clean existing data
  await prisma.subscriptionPlan.deleteMany();
  await prisma.creditPayment.deleteMany();
  await prisma.paymentScheduleItem.deleteMany();
  await prisma.creditDocument.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.userCourse.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.virtualCard.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.bankData.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.financialCategory.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Dados antigos removidos');

  const defaultPassword = await bcrypt.hash('admin123', 10);

  // ============================================
  // CREATE USERS, WALLETS AND CARDS SEQUENTIALLY
  // ============================================

  // 1. Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@oscorp.com',
      password: defaultPassword,
      firstName: 'Administrador',
      lastName: 'Oscorp',
      phone: '+1 234 567 8900',
      roles: [UserRole.superadmin],
      isActive: true, isVerified: true,
      ingenioAccess: true,
    }
  });

  const adminWallet = await prisma.wallet.create({
    data: {
      userId: adminUser.id,
      balance: 10000,
      currency: '₲',
      dailyLimit: 5000000,
      monthlyLimit: 50000000,
      totalIn: 10000,
    }
  });

  await prisma.virtualCard.create({
    data: {
      userId: adminUser.id,
      walletId: adminWallet.id,
      cardNumber: 'OSC000001',
      qrData: JSON.stringify({ cardNumber: 'OSC000001' }),
      design: 'gradient_dark',
    }
  });

  console.log('✅ Admin criado:', adminUser.email);

  // 2. Seller 1
  const seller1User = await prisma.user.create({
    data: {
      email: 'seller1@oscorp.com',
      password: defaultPassword,
      firstName: 'Carlos',
      lastName: 'Vendedor',
      roles: [UserRole.seller],
      isActive: true, isVerified: true,
    }
  });

  const seller1Wallet = await prisma.wallet.create({
    data: {
      userId: seller1User.id,
      balance: 1000000,
      currency: '₲',
    }
  });

  await prisma.virtualCard.create({
    data: {
      userId: seller1User.id,
      walletId: seller1Wallet.id,
      cardNumber: 'OSC000002',
      qrData: JSON.stringify({ cardNumber: 'OSC000002' }),
      design: 'gradient_blue',
    }
  });

  const seller1Profile = await prisma.sellerProfile.create({
    data: {
      userId: seller1User.id,
      storeName: 'Tech Store Pro',
      storeSlug: 'tech-store-pro',
      description: 'A melhor loja de tecnologia da região.',
      address: '456 Seller Ave, Los Angeles',
      phone: '+1 234 567 8901',
      email: 'seller1@oscorp.com',
      whatsappNumber: '+12345678901',
      isVerified: true,
      planActive: true,
    }
  });

  await prisma.store.create({
    data: {
      sellerId: seller1Profile.id,
      name: 'Tech Store Pro',
      slug: 'tech-store-pro',
      description: 'A melhor loja de tecnologia da região.',
      address: '456 Seller Ave, Los Angeles',
      phone: '+1 234 567 8901',
      email: 'seller1@oscorp.com',
      whatsappNumber: '+12345678901',
    }
  });

  // 3. Client 1
  const client1User = await prisma.user.create({
    data: {
      email: 'client1@oscorp.com',
      password: defaultPassword,
      firstName: 'João',
      lastName: 'Silva',
      roles: [UserRole.client],
      isActive: true, isVerified: true,
      ingenioAccess: true,
    }
  });

  const client1Wallet = await prisma.wallet.create({
    data: {
      userId: client1User.id,
      balance: 500000,
      currency: '₲',
    }
  });

  await prisma.virtualCard.create({
    data: {
      userId: client1User.id,
      walletId: client1Wallet.id,
      cardNumber: 'OSC000004',
      qrData: JSON.stringify({ cardNumber: 'OSC000004' }),
      design: 'gradient_blue',
    }
  });

  console.log('✅ Sellers e Clientes criados');
  
  // ============================================
  // CREATE SUBSCRIPTION PLANS
  // ============================================
  console.log('📦 Criando planos de assinatura...');
  
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Emprendedor',
        tier: 'basic',
        description: 'Ideal para quienes están comenzando su negocio digital.',
        price: 0,
        prices: { monthly: 0, quarterly: 0, semi_annual: 0, annual: 0 },
        features: ['Hasta 30 productos', 'Punto de Venta (POS)', 'Soporte vía Ticket'],
        maxProducts: 30,
        hasReports: false,
        commissionRate: 5,
        isCommissionBased: true,
        isActive: true,
      },
      {
        name: 'Profesional',
        tier: 'standard',
        description: 'El plan perfecto para comercios en crecimiento.',
        price: 150000,
        prices: { monthly: 150000, quarterly: 400000, semi_annual: 750000, annual: 1400000 },
        features: ['Hasta 150 productos', 'Reportes Avanzados', 'Soporte Prioritario', 'Sin comisiones por venta'],
        maxProducts: 150,
        hasReports: true,
        commissionRate: 0,
        isCommissionBased: false,
        isActive: true,
      },
      {
        name: 'Corporativo',
        tier: 'commercial',
        description: 'Máxima potencia para grandes volúmenes de venta.',
        price: 350000,
        prices: { monthly: 350000, quarterly: 950000, semi_annual: 1800000, annual: 3300000 },
        features: ['Productos Ilimitados', 'Todas las funciones', 'Gestión de Sucursales', 'Soporte 24/7'],
        maxProducts: 999999,
        hasReports: true,
        commissionRate: 0,
        isCommissionBased: false,
        isActive: true,
      }
    ]
  });
  
  console.log('✅ Planos criados');

  // ============================================
  // CREATE PRODUCTS
  // ============================================
  await prisma.product.create({
    data: {
      sellerId: seller1Profile.id,
      name: 'iPhone 15 Pro Max',
      description: 'O iPhone 15 Pro Max tem design em titânio robusto e leve.',
      price: 9500000,
      stock: 25,
      sku: 'TECH-001',
      category: 'Tecnologia',
      subcategory: 'Smartphones',
      type: ProductType.physical,
      status: 'active',
      isFeatured: true,
    },
  });

  // ============================================
  // CREATE COURSES
  // ============================================
  await prisma.course.create({
    data: {
      title: 'Finanças Pessoais para Iniciantes',
      slug: 'financas-pessoais-iniciantes',
      description: 'Aprenda a gerenciar suas finanças pessoais de forma eficiente.',
      shortDescription: 'Domine suas finanças pessoais.',
      instructorId: adminUser.id,
      instructorName: 'Oscorp Academy',
      category: 'Finanças',
      level: CourseLevel.beginner,
      price: 150000,
      isPublished: true,
      isFeatured: true,
      modules: {
        create: [
          {
            title: 'Módulo 1: Fundamentos',
            description: 'Conceitos básicos de finanças pessoais',
            order: 1,
            lessons: {
              create: [
                { title: 'Introdução às Finanças Pessoais', description: 'Bem vindo ao curso', duration: 15, order: 1, isPreview: true },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Produtos e Cursos criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('🔑 Credenciais de teste:');
  console.log('  Admin:    admin@oscorp.com / admin123');
  console.log('  Client 1: client1@oscorp.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
