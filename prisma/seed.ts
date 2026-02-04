import { PrismaClient, UserRole, ProductType, CourseLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Clean existing data
  await prisma.creditPayment.deleteMany();
  await prisma.paymentScheduleItem.deleteMany();
  await prisma.creditDocument.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.enrollment.deleteMany();
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

  // Hash password
  const defaultPassword = await bcrypt.hash('123456', 10);

  // ============================================
  // CREATE SUPERADMIN
  // ============================================
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@oscorp.com',
      password: defaultPassword,
      firstName: 'Administrador',
      lastName: 'Oscorp',
      phone: '+1 234 567 8900',
      address: '123 Admin Street',
      city: 'New York',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      role: UserRole.superadmin,
      isActive: true,
      ingenioAccess: true,
      wallet: {
        create: {
          balance: 10000,
          currency: 'USD',
          dailyLimit: 5000,
          monthlyLimit: 50000,
          totalIn: 10000,
        },
      },
      virtualCard: {
        create: {
          cardNumber: 'OSC000001',
          qrData: JSON.stringify({ cardNumber: 'OSC000001' }),
          design: 'gradient_dark',
        },
      },
    },
    include: {
      wallet: true,
      virtualCard: true,
    },
  });

  console.log('✅ Admin criado:', adminUser.email);

  // ============================================
  // CREATE SELLERS
  // ============================================
  const seller1 = await prisma.user.create({
    data: {
      email: 'seller1@oscorp.com',
      password: defaultPassword,
      firstName: 'Carlos',
      lastName: 'Vendedor',
      phone: '+1 234 567 8901',
      address: '456 Seller Ave',
      city: 'Los Angeles',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller1',
      role: UserRole.seller,
      isActive: true,
      wallet: {
        create: {
          balance: 2500,
          currency: 'USD',
          totalIn: 5000,
          totalOut: 2500,
        },
      },
      virtualCard: {
        create: {
          cardNumber: 'OSC000002',
          qrData: JSON.stringify({ cardNumber: 'OSC000002' }),
          design: 'gradient_blue',
        },
      },
      sellerProfile: {
        create: {
          storeName: 'Tech Store Pro',
          storeSlug: 'tech-store-pro',
          description: 'A melhor loja de tecnologia da região. Oferecemos os melhores produtos com preços competitivos.',
          logo: 'https://images.unsplash.com/photo-1531297424006-0145f3c06e78?w=200',
          banner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200',
          address: '456 Seller Ave, Los Angeles',
          phone: '+1 234 567 8901',
          email: 'seller1@oscorp.com',
          whatsappNumber: '+12345678901',
          isVerified: true,
          planActive: true,
          commissionRate: 5,
          totalSales: 150,
          totalRevenue: 15000,
          rating: 4.8,
          reviewCount: 45,
          businessHours: {
            monday: { open: '09:00', close: '18:00', isOpen: true },
            tuesday: { open: '09:00', close: '18:00', isOpen: true },
            wednesday: { open: '09:00', close: '18:00', isOpen: true },
            thursday: { open: '09:00', close: '18:00', isOpen: true },
            friday: { open: '09:00', close: '18:00', isOpen: true },
            saturday: { open: '10:00', close: '14:00', isOpen: true },
            sunday: { open: '10:00', close: '14:00', isOpen: false },
          },
          socialLinks: {
            facebook: 'https://facebook.com/techstorepro',
            instagram: 'https://instagram.com/techstorepro',
            website: 'https://techstorepro.com',
          },
        },
      },
    },
    include: {
      wallet: true,
      sellerProfile: true,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'seller2@oscorp.com',
      password: defaultPassword,
      firstName: 'Maria',
      lastName: 'Loja',
      phone: '+1 234 567 8902',
      address: '789 Market St',
      city: 'Miami',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller2',
      role: UserRole.seller,
      isActive: true,
      wallet: {
        create: {
          balance: 1800,
          currency: 'USD',
          totalIn: 3500,
          totalOut: 1700,
        },
      },
      virtualCard: {
        create: {
          cardNumber: 'OSC000003',
          qrData: JSON.stringify({ cardNumber: 'OSC000003' }),
          design: 'gradient_purple',
        },
      },
      sellerProfile: {
        create: {
          storeName: 'Fashion Trends',
          storeSlug: 'fashion-trends',
          description: 'Moda e estilo para todas as ocasiões. Encontre as últimas tendências da temporada.',
          logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
          banner: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200',
          address: '789 Market St, Miami',
          phone: '+1 234 567 8902',
          email: 'seller2@oscorp.com',
          whatsappNumber: '+12345678902',
          isVerified: true,
          planActive: true,
          commissionRate: 5,
          totalSales: 89,
          totalRevenue: 8900,
          rating: 4.5,
          reviewCount: 28,
          businessHours: {
            monday: { open: '10:00', close: '20:00', isOpen: true },
            tuesday: { open: '10:00', close: '20:00', isOpen: true },
            wednesday: { open: '10:00', close: '20:00', isOpen: true },
            thursday: { open: '10:00', close: '20:00', isOpen: true },
            friday: { open: '10:00', close: '21:00', isOpen: true },
            saturday: { open: '10:00', close: '21:00', isOpen: true },
            sunday: { open: '12:00', close: '18:00', isOpen: true },
          },
          socialLinks: {
            instagram: 'https://instagram.com/fashiontrends',
            facebook: 'https://facebook.com/fashiontrends',
          },
        },
      },
    },
    include: {
      wallet: true,
      sellerProfile: true,
    },
  });

  console.log('✅ Sellers criados');

  // Create stores for sellers
  await prisma.store.create({
    data: {
      sellerId: seller1.sellerProfile!.id,
      name: 'Tech Store Pro',
      slug: 'tech-store-pro',
      description: 'A melhor loja de tecnologia da região.',
      logo: 'https://images.unsplash.com/photo-1531297424006-0145f3c06e78?w=200',
      banner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200',
      address: '456 Seller Ave, Los Angeles',
      phone: '+1 234 567 8901',
      email: 'seller1@oscorp.com',
      whatsappNumber: '+12345678901',
      isActive: true,
      isOnline: true,
      businessHours: seller1.sellerProfile!.businessHours,
      socialLinks: seller1.sellerProfile!.socialLinks,
    },
  });

  await prisma.store.create({
    data: {
      sellerId: seller2.sellerProfile!.id,
      name: 'Fashion Trends',
      slug: 'fashion-trends',
      description: 'Moda e estilo para todas as ocasiões.',
      logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
      banner: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200',
      address: '789 Market St, Miami',
      phone: '+1 234 567 8902',
      email: 'seller2@oscorp.com',
      whatsappNumber: '+12345678902',
      isActive: true,
      isOnline: true,
      businessHours: seller2.sellerProfile!.businessHours,
      socialLinks: seller2.sellerProfile!.socialLinks,
    },
  });

  // ============================================
  // CREATE CLIENTS
  // ============================================
  const client1 = await prisma.user.create({
    data: {
      email: 'client1@oscorp.com',
      password: defaultPassword,
      firstName: 'João',
      lastName: 'Silva',
      phone: '+1 234 567 8903',
      address: '321 Client Blvd',
      city: 'Chicago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1',
      role: UserRole.client,
      isActive: true,
      ingenioAccess: true,
      wallet: {
        create: {
          balance: 500,
          currency: 'USD',
          totalIn: 2000,
          totalOut: 1500,
        },
      },
      virtualCard: {
        create: {
          cardNumber: 'OSC000004',
          qrData: JSON.stringify({ cardNumber: 'OSC000004' }),
          design: 'gradient_blue',
        },
      },
      bankData: {
        create: {
          bankName: 'Bank of America',
          accountNumber: '1234567890',
          accountType: 'checking',
          holderName: 'João Silva',
          documentId: '123456789',
        },
      },
    },
    include: {
      wallet: true,
      virtualCard: true,
      bankData: true,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'client2@oscorp.com',
      password: defaultPassword,
      firstName: 'Ana',
      lastName: 'Souza',
      phone: '+1 234 567 8904',
      address: '654 User Lane',
      city: 'Boston',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2',
      role: UserRole.client,
      isActive: true,
      ingenioAccess: false,
      wallet: {
        create: {
          balance: 150,
          currency: 'USD',
          totalIn: 800,
          totalOut: 650,
        },
      },
      virtualCard: {
        create: {
          cardNumber: 'OSC000005',
          qrData: JSON.stringify({ cardNumber: 'OSC000005' }),
          design: 'gradient_purple',
        },
      },
    },
    include: {
      wallet: true,
      virtualCard: true,
    },
  });

  console.log('✅ Clientes criados');

  // ============================================
  // CREATE PRODUCTS
  // ============================================
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: seller1.sellerProfile!.id,
        name: 'iPhone 15 Pro Max',
        description: 'O iPhone 15 Pro Max tem design em titânio robusto e leve, com parte traseira em vidro matte texturizado.',
        price: 1199,
        comparePrice: 1299,
        stock: 25,
        sku: 'TECH-001',
        images: [
          'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800',
          'https://images.unsplash.com/photo-1696446702216-8e1b0a0b0b0b?w=800',
        ],
        category: 'Tecnologia',
        subcategory: 'Smartphones',
        type: ProductType.physical,
        visibility: 'both',
        status: 'active',
        tags: ['apple', 'iphone', 'smartphone'],
        isFeatured: true,
        attributes: {
          create: [
            { name: 'Marca', value: 'Apple' },
            { name: 'Memória', value: '256GB' },
            { name: 'Cor', value: 'Titanium Natural' },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.sellerProfile!.id,
        name: 'MacBook Pro 14" M3',
        description: 'O MacBook Pro com chip M3 é o laptop mais avançado para profissionais exigentes.',
        price: 1999,
        comparePrice: 2199,
        stock: 15,
        sku: 'TECH-002',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        ],
        category: 'Tecnologia',
        subcategory: 'Laptops',
        type: ProductType.physical,
        visibility: 'both',
        status: 'active',
        tags: ['apple', 'macbook', 'laptop'],
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.sellerProfile!.id,
        name: 'Sony WH-1000XM5',
        description: 'Fones de ouvido com cancelamento de ruído líder da indústria e som premium.',
        price: 399,
        comparePrice: 449,
        stock: 30,
        sku: 'TECH-003',
        images: [
          'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
        ],
        category: 'Tecnologia',
        subcategory: 'Áudio',
        type: ProductType.physical,
        visibility: 'online',
        status: 'active',
        tags: ['sony', 'headphones', 'audio'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.sellerProfile!.id,
        name: 'Vestido Elegante Floral',
        description: 'Vestido longo estampado floral perfeito para ocasiões especiais. Tecido leve e confortável.',
        price: 89,
        comparePrice: 129,
        stock: 50,
        sku: 'FASH-001',
        images: [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        ],
        category: 'Moda',
        subcategory: 'Vestidos',
        type: ProductType.physical,
        visibility: 'both',
        status: 'active',
        tags: ['vestido', 'floral', 'elegante'],
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.sellerProfile!.id,
        name: 'Tênis Esportivo Premium',
        description: 'Tênis de alta performance para corrida e treino. Tecnologia de amortecimento avançada.',
        price: 159,
        stock: 40,
        sku: 'FASH-002',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        ],
        category: 'Moda',
        subcategory: 'Calçados',
        type: ProductType.physical,
        visibility: 'both',
        status: 'active',
        tags: ['tênis', 'esportivo', 'corrida'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.sellerProfile!.id,
        name: 'Bolsa de Couro Italiano',
        description: 'Bolsa artesanal em couro genuíno italiano. Design atemporal e qualidade superior.',
        price: 249,
        comparePrice: 349,
        stock: 20,
        sku: 'FASH-003',
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        ],
        category: 'Moda',
        subcategory: 'Acessórios',
        type: ProductType.physical,
        visibility: 'both',
        status: 'active',
        tags: ['bolsa', 'couro', 'italiano'],
      },
    }),
  ]);

  console.log('✅ Produtos criados:', products.length);

  // ============================================
  // CREATE COURSES
  // ============================================
  const course1 = await prisma.course.create({
    data: {
      title: 'Finanças Pessoais para Iniciantes',
      slug: 'financas-pessoais-iniciantes',
      description: 'Aprenda a gerenciar suas finanças pessoais de forma eficiente. Desde orçamento até investimentos.',
      shortDescription: 'Domine suas finanças pessoais e alcance a liberdade financeira.',
      coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
      instructorId: adminUser.id,
      instructorName: 'Oscorp Academy',
      category: 'Finanças',
      level: CourseLevel.beginner,
      price: 49,
      comparePrice: 99,
      duration: 480, // 8 hours
      isPublished: true,
      isFeatured: true,
      enrolledCount: 1250,
      rating: 4.8,
      reviewCount: 342,
      modules: {
        create: [
          {
            title: 'Módulo 1: Fundamentos',
            description: 'Conceitos básicos de finanças pessoais',
            order: 1,
            lessons: {
              create: [
                { title: 'Introdução às Finanças Pessoais', duration: 15, order: 1, isPreview: true },
                { title: 'Consciência Financeira', duration: 20, order: 2 },
                { title: 'Mentalidade de Abundância', duration: 25, order: 3 },
              ],
            },
          },
          {
            title: 'Módulo 2: Orçamento',
            description: 'Como criar e manter um orçamento efetivo',
            order: 2,
            lessons: {
              create: [
                { title: 'Análise de Renda e Gastos', duration: 30, order: 1 },
                { title: 'Regra 50-30-20', duration: 25, order: 2 },
                { title: 'Ferramentas de Controle', duration: 20, order: 3 },
              ],
            },
          },
          {
            title: 'Módulo 3: Investimentos',
            description: 'Primeiros passos no mundo dos investimentos',
            order: 3,
            lessons: {
              create: [
                { title: 'Tipos de Investimentos', duration: 35, order: 1 },
                { title: 'Renda Fixa vs Variável', duration: 30, order: 2 },
                { title: 'Diversificação', duration: 25, order: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Marketing Digital para Empreendedores',
      slug: 'marketing-digital-empreendedores',
      description: 'Estratégias práticas de marketing digital para alavancar seu negócio online.',
      shortDescription: 'Aprenda a promover seu negócio nas redes sociais e mecanismos de busca.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      instructorId: adminUser.id,
      instructorName: 'Oscorp Academy',
      category: 'Marketing',
      level: CourseLevel.intermediate,
      price: 79,
      comparePrice: 149,
      duration: 720, // 12 hours
      isPublished: true,
      isFeatured: true,
      enrolledCount: 890,
      rating: 4.6,
      reviewCount: 215,
      modules: {
        create: [
          {
            title: 'Fundamentos do Marketing Digital',
            description: 'Conceitos essenciais para iniciar',
            order: 1,
            lessons: {
              create: [
                { title: 'O que é Marketing Digital', duration: 20, order: 1, isPreview: true },
                { title: 'Funil de Vendas', duration: 25, order: 2 },
                { title: 'Persona do Cliente', duration: 30, order: 3 },
              ],
            },
          },
          {
            title: 'Redes Sociais',
            description: 'Estratégias para Instagram, Facebook e TikTok',
            order: 2,
            lessons: {
              create: [
                { title: 'Instagram para Negócios', duration: 40, order: 1 },
                { title: 'Criação de Conteúdo', duration: 35, order: 2 },
                { title: 'Anúncios Pagos', duration: 45, order: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Cursos criados');

  // ============================================
  // CREATE TRANSACTIONS
  // ============================================
  await prisma.transaction.createMany({
    data: [
      {
        walletId: client1.wallet!.id,
        userId: client1.id,
        type: 'deposit',
        amount: 500,
        description: 'Depósito inicial',
        status: 'completed',
      },
      {
        walletId: client1.wallet!.id,
        userId: client1.id,
        type: 'purchase',
        amount: -199,
        description: 'Compra: iPhone 15 Pro Max',
        status: 'completed',
      },
      {
        walletId: client2.wallet!.id,
        userId: client2.id,
        type: 'deposit',
        amount: 300,
        description: 'Depósito',
        status: 'completed',
      },
      {
        walletId: client2.wallet!.id,
        userId: client2.id,
        type: 'purchase',
        amount: -89,
        description: 'Compra: Vestido Elegante',
        status: 'completed',
      },
      {
        walletId: seller1.wallet!.id,
        userId: seller1.id,
        type: 'sale',
        amount: 199,
        description: 'Venda: iPhone 15 Pro Max',
        status: 'completed',
      },
    ],
  });

  console.log('✅ Transações criadas');

  // ============================================
  // CREATE FINANCIAL CATEGORIES FOR CLIENT1
  // ============================================
  await prisma.financialCategory.createMany({
    data: [
      { userId: client1.id, name: 'Salário', type: 'income', color: '#10B981', icon: 'dollar-sign', isDefault: true },
      { userId: client1.id, name: 'Freelance', type: 'income', color: '#3B82F6', icon: 'briefcase', isDefault: true },
      { userId: client1.id, name: 'Alimentação', type: 'expense', color: '#EF4444', icon: 'utensils', isDefault: true },
      { userId: client1.id, name: 'Transporte', type: 'expense', color: '#F59E0B', icon: 'car', isDefault: true },
      { userId: client1.id, name: 'Moradia', type: 'expense', color: '#8B5CF6', icon: 'home', isDefault: true },
      { userId: client1.id, name: 'Lazer', type: 'expense', color: '#EC4899', icon: 'gamepad-2', isDefault: true },
    ],
  });

  const categories = await prisma.financialCategory.findMany({
    where: { userId: client1.id },
  });

  // Create financial records
  const today = new Date();
  await prisma.financialRecord.createMany({
    data: [
      { userId: client1.id, categoryId: categories[0].id, type: 'income', amount: 3000, description: 'Salário Janeiro', date: new Date(today.getFullYear(), today.getMonth(), 5) },
      { userId: client1.id, categoryId: categories[1].id, type: 'income', amount: 800, description: 'Projeto Freelance', date: new Date(today.getFullYear(), today.getMonth(), 15) },
      { userId: client1.id, categoryId: categories[2].id, type: 'expense', amount: 450, description: 'Supermercado', date: new Date(today.getFullYear(), today.getMonth(), 8) },
      { userId: client1.id, categoryId: categories[3].id, type: 'expense', amount: 200, description: 'Combustível', date: new Date(today.getFullYear(), today.getMonth(), 10) },
      { userId: client1.id, categoryId: categories[4].id, type: 'expense', amount: 800, description: 'Aluguel', date: new Date(today.getFullYear(), today.getMonth(), 1) },
      { userId: client1.id, categoryId: categories[5].id, type: 'expense', amount: 150, description: 'Cinema e jantar', date: new Date(today.getFullYear(), today.getMonth(), 20) },
    ],
  });

  console.log('✅ Registros financeiros criados');

  // ============================================
  // CREATE NOTIFICATIONS
  // ============================================
  await prisma.notification.createMany({
    data: [
      { userId: client1.id, title: 'Bem-vindo!', message: 'Bem-vindo à plataforma Oscorp!', type: 'success' },
      { userId: client1.id, title: 'Novo curso disponível', message: 'O curso "Finanças Pessoais" está disponível!', type: 'info' },
      { userId: seller1.id, title: 'Nova venda', message: 'Você tem uma nova venda!', type: 'success' },
      { userId: adminUser.id, title: 'Sistema atualizado', message: 'O sistema foi atualizado com sucesso.', type: 'info' },
    ],
  });

  console.log('✅ Notificações criadas');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('═══════════════════════════════════════');
  console.log('📊 Resumo:');
  console.log('  👤 Usuários: 5 (1 admin, 2 sellers, 2 clients)');
  console.log('  🛍️ Produtos: 6');
  console.log('  📚 Cursos: 2');
  console.log('═══════════════════════════════════════');
  console.log('\n🔑 Credenciais de teste:');
  console.log('  Admin:    admin@oscorp.com / 123456');
  console.log('  Seller 1: seller1@oscorp.com / 123456');
  console.log('  Seller 2: seller2@oscorp.com / 123456');
  console.log('  Client 1: client1@oscorp.com / 123456');
  console.log('  Client 2: client2@oscorp.com / 123456');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
