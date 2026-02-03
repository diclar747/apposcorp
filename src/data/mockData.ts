import type {
  User, Wallet, VirtualCard, Store, Product, Course, Order,
  Transaction, Credit, Enrollment, FinancialCategory, FinancialRecord,
  Notification, BusinessHours, SocialLinks
} from '@/types';

// ============================================
// USUARIOS
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@oscorp.com',
    password: 'admin123',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+595 981 123456',
    address: 'Av. Aviadores del Chaco 1234',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'superadmin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    walletId: 'wallet-1',
    cardQR: {} as VirtualCard,
    ingenioAccess: true,
  },
  {
    id: 'user-2',
    email: 'vendedor1@oscorp.com',
    password: 'seller123',
    firstName: 'Carlos',
    lastName: 'Martínez',
    phone: '+595 982 234567',
    address: 'Calle Palma 567',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    role: 'seller',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    walletId: 'wallet-2',
    cardQR: {} as VirtualCard,
    ingenioAccess: true,
    sellerProfile: {
      id: 'seller-1',
      userId: 'user-2',
      storeName: 'Tecnología Plus',
      storeSlug: 'tecnologia-plus',
      description: 'Los mejores productos tecnológicos al mejor precio',
      logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&h=400&fit=crop',
      address: 'Shopping del Sol, Local 45',
      phone: '+595 982 234567',
      email: 'vendedor1@oscorp.com',
      businessHours: defaultBusinessHours(),
      socialLinks: {
        facebook: 'https://facebook.com/tecnologiaplus',
        instagram: 'https://instagram.com/tecnologiaplus',
      },
      whatsappNumber: '+595 982 234567',
      isVerified: true,
      planActive: true,
      planExpiryDate: new Date('2025-12-31'),
      commissionRate: 5,
      totalSales: 156,
      totalRevenue: 45800000,
      rating: 4.8,
      reviewCount: 89,
    },
    bankData: {
      bankName: 'Banco Continental',
      accountNumber: '1234567890',
      accountType: 'savings',
      holderName: 'Carlos Martínez',
      documentId: '1234567',
    },
  },
  {
    id: 'user-3',
    email: 'vendedor2@oscorp.com',
    password: 'seller123',
    firstName: 'María',
    lastName: 'González',
    phone: '+595 983 345678',
    address: 'Av. España 890',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    role: 'seller',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    walletId: 'wallet-3',
    cardQR: {} as VirtualCard,
    ingenioAccess: false,
    sellerProfile: {
      id: 'seller-2',
      userId: 'user-3',
      storeName: 'Moda Express',
      storeSlug: 'moda-express',
      description: 'Ropa de moda para toda la familia',
      logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
      address: 'Shopping Mariscal, Local 23',
      phone: '+595 983 345678',
      email: 'vendedor2@oscorp.com',
      businessHours: defaultBusinessHours(),
      socialLinks: {
        facebook: 'https://facebook.com/modaexpress',
        instagram: 'https://instagram.com/modaexpress',
      },
      whatsappNumber: '+595 983 345678',
      isVerified: true,
      planActive: true,
      planExpiryDate: new Date('2025-11-30'),
      commissionRate: 8,
      totalSales: 234,
      totalRevenue: 67200000,
      rating: 4.6,
      reviewCount: 112,
    },
    bankData: {
      bankName: 'Banco Familiar',
      accountNumber: '0987654321',
      accountType: 'checking',
      holderName: 'María González',
      documentId: '7654321',
    },
  },
  {
    id: 'user-4',
    email: 'cliente1@oscorp.com',
    password: 'client123',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+595 984 456789',
    address: 'Calle 14 de Mayo 123',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan',
    role: 'client',
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    walletId: 'wallet-4',
    cardQR: {} as VirtualCard,
    ingenioAccess: true,
    bankData: {
      bankName: 'Banco Atlas',
      accountNumber: '5555666677',
      accountType: 'savings',
      holderName: 'Juan Pérez',
      documentId: '3344556',
    },
  },
  {
    id: 'user-5',
    email: 'cliente2@oscorp.com',
    password: 'client123',
    firstName: 'Ana',
    lastName: 'Rodríguez',
    phone: '+595 985 567890',
    address: 'Av. Santa Teresa 456',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
    role: 'client',
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    walletId: 'wallet-5',
    cardQR: {} as VirtualCard,
    ingenioAccess: false,
  },
  {
    id: 'user-6',
    email: 'cliente3@oscorp.com',
    password: 'client123',
    firstName: 'Pedro',
    lastName: 'López',
    phone: '+595 986 678901',
    address: 'Calle Estados Unidos 789',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
    role: 'client',
    isActive: true,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    walletId: 'wallet-6',
    cardQR: {} as VirtualCard,
    ingenioAccess: true,
  },
];

function defaultBusinessHours(): BusinessHours {
  return {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '13:00', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false },
  };
}

// ============================================
// BILLETERAS
// ============================================

export const mockWallets: Wallet[] = [
  {
    id: 'wallet-1',
    userId: 'user-1',
    balance: 5000000,
    currency: 'PYG',
    status: 'active',
    dailyLimit: 10000000,
    monthlyLimit: 100000000,
    totalIn: 25000000,
    totalOut: 20000000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'wallet-2',
    userId: 'user-2',
    balance: 8500000,
    currency: 'PYG',
    status: 'active',
    dailyLimit: 15000000,
    monthlyLimit: 150000000,
    totalIn: 45800000,
    totalOut: 37300000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'wallet-3',
    userId: 'user-3',
    balance: 12000000,
    currency: 'PYG',
    status: 'active',
    dailyLimit: 20000000,
    monthlyLimit: 200000000,
    totalIn: 67200000,
    totalOut: 55200000,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'wallet-4',
    userId: 'user-4',
    balance: 2500000,
    currency: 'PYG',
    status: 'active',
    dailyLimit: 5000000,
    monthlyLimit: 50000000,
    totalIn: 8000000,
    totalOut: 5500000,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'wallet-5',
    userId: 'user-5',
    balance: 1500000,
    currency: 'PYG',
    status: 'active',
    dailyLimit: 5000000,
    monthlyLimit: 50000000,
    totalIn: 5000000,
    totalOut: 3500000,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: 'wallet-6',
    userId: 'user-6',
    balance: 3800000,
    currency: 'PYG',
    status: 'active',
    dailyLimit: 5000000,
    monthlyLimit: 50000000,
    totalIn: 10000000,
    totalOut: 6200000,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
];

// ============================================
// TARJETAS QR
// ============================================

export const mockCards: VirtualCard[] = mockUsers.map((user, index) => ({
  id: `card-${index + 1}`,
  userId: user.id,
  walletId: `wallet-${index + 1}`,
  cardNumber: `OSC${String(index + 1).padStart(6, '0')}`,
  qrCode: '',
  qrData: JSON.stringify({ userId: user.id, cardNumber: `OSC${String(index + 1).padStart(6, '0')}` }),
  design: (['gradient-blue', 'gradient-purple', 'gradient-dark', 'minimal'][index % 4]) as any,
  isActive: true,
  createdAt: user.createdAt,
}));

// Actualizar cards en users
mockUsers.forEach((user, index) => {
  user.cardQR = mockCards[index];
});

// ============================================
// TIENDAS
// ============================================

export const mockStores: Store[] = [
  {
    id: 'store-1',
    sellerId: 'user-2',
    name: 'Tecnología Plus',
    slug: 'tecnologia-plus',
    description: 'Los mejores productos tecnológicos al mejor precio. Celulares, laptops, accesorios y más.',
    logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&h=400&fit=crop',
    address: 'Shopping del Sol, Local 45, Asunción',
    phone: '+595 982 234567',
    email: 'vendedor1@oscorp.com',
    businessHours: defaultBusinessHours(),
    socialLinks: {
      facebook: 'https://facebook.com/tecnologiaplus',
      instagram: 'https://instagram.com/tecnologiaplus',
    },
    whatsappNumber: '+595 982 234567',
    isActive: true,
    isOnline: true,
    products: [],
  },
  {
    id: 'store-2',
    sellerId: 'user-3',
    name: 'Moda Express',
    slug: 'moda-express',
    description: 'Ropa de moda para toda la familia. Las últimas tendencias a precios increíbles.',
    logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    address: 'Shopping Mariscal, Local 23, Asunción',
    phone: '+595 983 345678',
    email: 'vendedor2@oscorp.com',
    businessHours: defaultBusinessHours(),
    socialLinks: {
      facebook: 'https://facebook.com/modaexpress',
      instagram: 'https://instagram.com/modaexpress',
    },
    whatsappNumber: '+595 983 345678',
    isActive: true,
    isOnline: true,
    products: [],
  },
];

// ============================================
// PRODUCTOS
// ============================================

export const mockProducts: Product[] = [
  // Productos Tecnología Plus
  {
    id: 'prod-1',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'iPhone 15 Pro Max 256GB',
    description: 'El iPhone más potente con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR.',
    price: 8500000,
    comparePrice: 9200000,
    stock: 15,
    sku: 'IPH15PM-256',
    images: [
      'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=600&h=600&fit=crop',
    ],
    category: 'Celulares',
    subcategory: 'Smartphones',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['apple', 'iphone', 'premium'],
    isFeatured: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'prod-2',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Smartphone flagship con S Pen integrado, cámara de 200MP y batería de 5000mAh.',
    price: 7200000,
    comparePrice: 7800000,
    stock: 20,
    sku: 'SGS24U-512',
    images: [
      'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=600&h=600&fit=crop',
    ],
    category: 'Celulares',
    subcategory: 'Smartphones',
    type: 'physical',
    visibility: 'online',
    status: 'active',
    tags: ['samsung', 'android', 'premium'],
    isFeatured: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'prod-3',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'MacBook Air M3 13"',
    description: 'Laptop ultraligera con chip M3, 16GB RAM y 512GB SSD. Hasta 18 horas de batería.',
    price: 9500000,
    comparePrice: 10500000,
    stock: 8,
    sku: 'MBA-M3-16-512',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
    ],
    category: 'Computadoras',
    subcategory: 'Laptops',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['apple', 'macbook', 'laptop'],
    isFeatured: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'prod-4',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'AirPods Pro 2',
    description: 'Auriculares inalámbricos con cancelación activa de ruido y audio espacial.',
    price: 1200000,
    comparePrice: 1450000,
    stock: 30,
    sku: 'APP-2GEN',
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop',
    ],
    category: 'Audio',
    subcategory: 'Auriculares',
    type: 'physical',
    visibility: 'online',
    status: 'active',
    tags: ['apple', 'audio', 'wireless'],
    isFeatured: false,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'prod-5',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'iPad Air 11" M2',
    description: 'Tablet potente con chip M2, pantalla Liquid Retina y compatibilidad con Apple Pencil.',
    price: 5500000,
    stock: 12,
    sku: 'IPDA-M2-128',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop',
    ],
    category: 'Tablets',
    subcategory: 'iPads',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['apple', 'ipad', 'tablet'],
    isFeatured: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'prod-6',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'Reparación de Celulares',
    description: 'Servicio profesional de reparación de celulares. Cambio de pantalla, batería y más.',
    price: 500000,
    stock: 100,
    sku: 'SERV-REP-001',
    images: [
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=600&fit=crop',
    ],
    category: 'Servicios',
    subcategory: 'Reparaciones',
    type: 'service',
    visibility: 'local',
    status: 'active',
    tags: ['servicio', 'reparacion', 'tecnico'],
    isFeatured: false,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  // Productos Moda Express
  {
    id: 'prod-7',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Camisa Oxford Premium',
    description: 'Camisa de algodón 100% con corte slim fit. Disponible en varios colores.',
    price: 280000,
    comparePrice: 350000,
    stock: 50,
    sku: 'CAM-OXF-001',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop',
    ],
    category: 'Hombres',
    subcategory: 'Camisas',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['ropa', 'hombre', 'camisa'],
    isFeatured: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'prod-8',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Vestido Elegante Floral',
    description: 'Vestido largo con estampado floral, perfecto para ocasiones especiales.',
    price: 450000,
    comparePrice: 580000,
    stock: 25,
    sku: 'VES-FLO-001',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop',
    ],
    category: 'Mujeres',
    subcategory: 'Vestidos',
    type: 'physical',
    visibility: 'online',
    status: 'active',
    tags: ['ropa', 'mujer', 'vestido'],
    isFeatured: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'prod-9',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Zapatillas Deportivas Urban',
    description: 'Zapatillas cómodas y modernas para el día a día.',
    price: 380000,
    stock: 40,
    sku: 'ZAP-URB-001',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
    ],
    category: 'Calzado',
    subcategory: 'Zapatillas',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['calzado', 'zapatillas', 'urban'],
    isFeatured: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'prod-10',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Chaqueta de Cuero',
    description: 'Chaqueta de cuero sintético con forro interior. Estilo clásico atemporal.',
    price: 650000,
    comparePrice: 850000,
    stock: 15,
    sku: 'CHA-CUE-001',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
    ],
    category: 'Hombres',
    subcategory: 'Chaquetas',
    type: 'physical',
    visibility: 'online',
    status: 'active',
    tags: ['ropa', 'hombre', 'chaqueta'],
    isFeatured: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'prod-11',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Bolso de Cuero Artesanal',
    description: 'Bolso hecho a mano por artesanos locales. Cuero genuino de alta calidad.',
    price: 520000,
    stock: 20,
    sku: 'BOL-CUE-001',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
    ],
    category: 'Accesorios',
    subcategory: 'Bolsos',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['accesorio', 'bolso', 'cuero'],
    isFeatured: false,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'prod-12',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Asesoría de Imagen Personal',
    description: 'Servicio de asesoría de imagen y estilo personalizado.',
    price: 300000,
    stock: 100,
    sku: 'SERV-ASI-001',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop',
    ],
    category: 'Servicios',
    subcategory: 'Asesoría',
    type: 'service',
    visibility: 'local',
    status: 'active',
    tags: ['servicio', 'asesoria', 'imagen'],
    isFeatured: false,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
];

// Asignar productos a tiendas
mockStores[0].products = mockProducts.filter(p => p.storeId === 'store-1');
mockStores[1].products = mockProducts.filter(p => p.storeId === 'store-2');

// ============================================
// CURSOS
// ============================================

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Finanzas Personales: De Cero a Millonario',
    slug: 'finanzas-personales-cero-millonario',
    description: 'Aprende a gestionar tu dinero, invertir sabiamente y construir riqueza desde cero. Este curso completo te llevará paso a paso por todos los aspectos de las finanzas personales.',
    shortDescription: 'Domina tus finanzas personales y construye riqueza paso a paso.',
    coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop',
    previewVideo: 'https://example.com/preview1.mp4',
    instructorId: 'user-1',
    instructorName: 'Oscorp Academy',
    category: 'Finanzas',
    level: 'beginner',
    price: 450000,
    comparePrice: 650000,
    duration: 1200,
    modules: [
      {
        id: 'mod-1-1',
        title: 'Fundamentos de Finanzas Personales',
        description: 'Conceptos básicos que todo el mundo debe conocer',
        order: 1,
        lessons: [
          { id: 'les-1-1-1', title: 'Bienvenida al curso', description: 'Introducción y objetivos', videoUrl: '', duration: 10, order: 1, isPreview: true, resources: [] },
          { id: 'les-1-1-2', title: 'El mindset del rico', description: 'Cambiar tu mentalidad financiera', videoUrl: '', duration: 25, order: 2, isPreview: false, resources: [] },
          { id: 'les-1-1-3', title: 'Ingresos vs Egresos', description: 'Entendiendo el flujo de dinero', videoUrl: '', duration: 30, order: 3, isPreview: false, resources: [] },
        ],
      },
      {
        id: 'mod-1-2',
        title: 'El Sistema de las 5S',
        description: 'Metodología japonesa aplicada a finanzas',
        order: 2,
        lessons: [
          { id: 'les-1-2-1', title: 'Seiri - Clasificación', description: 'Organiza tus gastos', videoUrl: '', duration: 20, order: 1, isPreview: false, resources: [] },
          { id: 'les-1-2-2', title: 'Seiton - Orden', description: 'Estructura tu presupuesto', videoUrl: '', duration: 25, order: 2, isPreview: false, resources: [] },
          { id: 'les-1-2-3', title: 'Seiso - Limpieza', description: 'Elimina gastos innecesarios', videoUrl: '', duration: 20, order: 3, isPreview: false, resources: [] },
          { id: 'les-1-2-4', title: 'Seiketsu - Estandarización', description: 'Crea hábitos financieros', videoUrl: '', duration: 30, order: 4, isPreview: false, resources: [] },
          { id: 'les-1-2-5', title: 'Shitsuke - Disciplina', description: 'Mantén el control', videoUrl: '', duration: 35, order: 5, isPreview: false, resources: [] },
        ],
      },
      {
        id: 'mod-1-3',
        title: 'Inversión y Crecimiento',
        description: 'Haz crecer tu dinero',
        order: 3,
        lessons: [
          { id: 'les-1-3-1', title: 'Tipos de inversiones', description: 'Conoce tus opciones', videoUrl: '', duration: 40, order: 1, isPreview: false, resources: [] },
          { id: 'les-1-3-2', title: 'Inversión en bolsa', description: 'Cómo empezar', videoUrl: '', duration: 45, order: 2, isPreview: false, resources: [] },
          { id: 'les-1-3-3', title: 'Bienes raíces', description: 'Inversión inmobiliaria', videoUrl: '', duration: 50, order: 3, isPreview: false, resources: [] },
        ],
      },
    ],
    resources: [
      { id: 'res-1-1', title: 'Plantilla de Presupuesto', type: 'pdf', url: '#' },
      { id: 'res-1-2', title: 'Guía de Inversión', type: 'pdf', url: '#' },
    ],
    isPublished: true,
    isFeatured: true,
    enrolledCount: 234,
    rating: 4.9,
    reviewCount: 89,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'course-2',
    title: 'Emprendimiento Digital: Crea tu Negocio Online',
    slug: 'emprendimiento-digital-negocio-online',
    description: 'Aprende a crear, lanzar y escalar un negocio digital desde cero. Estrategias probadas de marketing y ventas.',
    shortDescription: 'Lanza tu negocio digital y escálalo al siguiente nivel.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    previewVideo: 'https://example.com/preview2.mp4',
    instructorId: 'user-1',
    instructorName: 'Oscorp Academy',
    category: 'Emprendimiento',
    level: 'intermediate',
    price: 580000,
    comparePrice: 780000,
    duration: 1500,
    modules: [
      {
        id: 'mod-2-1',
        title: 'Idea y Validación',
        description: 'Encuentra y valida tu idea de negocio',
        order: 1,
        lessons: [
          { id: 'les-2-1-1', title: 'Encontrar tu nicho', description: 'Descubre oportunidades', videoUrl: '', duration: 30, order: 1, isPreview: true, resources: [] },
          { id: 'les-2-1-2', title: 'Validación de mercado', description: 'Asegúrate de que funcione', videoUrl: '', duration: 35, order: 2, isPreview: false, resources: [] },
        ],
      },
      {
        id: 'mod-2-2',
        title: 'Marketing Digital',
        description: 'Estrategias para atraer clientes',
        order: 2,
        lessons: [
          { id: 'les-2-2-1', title: 'SEO para principiantes', description: 'Posicionamiento en Google', videoUrl: '', duration: 40, order: 1, isPreview: false, resources: [] },
          { id: 'les-2-2-2', title: 'Redes sociales', description: 'Estrategia de contenidos', videoUrl: '', duration: 45, order: 2, isPreview: false, resources: [] },
          { id: 'les-2-2-3', title: 'Publicidad pagada', description: 'Facebook y Google Ads', videoUrl: '', duration: 50, order: 3, isPreview: false, resources: [] },
        ],
      },
    ],
    resources: [
      { id: 'res-2-1', title: 'Plantilla de Plan de Negocios', type: 'pdf', url: '#' },
      { id: 'res-2-2', title: 'Checklist de Lanzamiento', type: 'pdf', url: '#' },
    ],
    isPublished: true,
    isFeatured: true,
    enrolledCount: 156,
    rating: 4.7,
    reviewCount: 67,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'course-3',
    title: 'Trading e Inversión en Criptomonedas',
    slug: 'trading-inversion-criptomonedas',
    description: 'Aprende a invertir y hacer trading con criptomonedas de forma segura y rentable.',
    shortDescription: 'Domina el mundo de las criptomonedas y genera ingresos.',
    coverImage: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=450&fit=crop',
    previewVideo: 'https://example.com/preview3.mp4',
    instructorId: 'user-1',
    instructorName: 'Oscorp Academy',
    category: 'Inversión',
    level: 'advanced',
    price: 720000,
    comparePrice: 950000,
    duration: 1800,
    modules: [
      {
        id: 'mod-3-1',
        title: 'Fundamentos de Blockchain',
        description: 'Entiende la tecnología',
        order: 1,
        lessons: [
          { id: 'les-3-1-1', title: 'Qué es blockchain', description: 'Conceptos fundamentales', videoUrl: '', duration: 35, order: 1, isPreview: true, resources: [] },
          { id: 'les-3-1-2', title: 'Bitcoin vs Altcoins', description: 'Diferencias clave', videoUrl: '', duration: 40, order: 2, isPreview: false, resources: [] },
        ],
      },
      {
        id: 'mod-3-2',
        title: 'Trading Técnico',
        description: 'Análisis y estrategias',
        order: 2,
        lessons: [
          { id: 'les-3-2-1', title: 'Análisis técnico básico', description: 'Gráficos y patrones', videoUrl: '', duration: 50, order: 1, isPreview: false, resources: [] },
          { id: 'les-3-2-2', title: 'Indicadores técnicos', description: 'Herramientas profesionales', videoUrl: '', duration: 55, order: 2, isPreview: false, resources: [] },
        ],
      },
    ],
    resources: [
      { id: 'res-3-1', title: 'Guía de Seguridad Crypto', type: 'pdf', url: '#' },
      { id: 'res-3-2', title: 'Plantilla de Trading', type: 'pdf', url: '#' },
    ],
    isPublished: true,
    isFeatured: false,
    enrolledCount: 89,
    rating: 4.8,
    reviewCount: 45,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

// ============================================
// INSCRIPCIONES A CURSOS
// ============================================

export const mockEnrollments: Enrollment[] = [
  {
    id: 'enroll-1',
    userId: 'user-4',
    courseId: 'course-1',
    progress: 65,
    completedModules: ['mod-1-1'],
    completedLessons: ['les-1-1-1', 'les-1-1-2', 'les-1-1-3', 'les-1-2-1', 'les-1-2-2'],
    totalTimeSpent: 480,
    lastAccessedAt: new Date('2024-03-10'),
    completedAt: undefined,
    certificateIssued: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'enroll-2',
    userId: 'user-4',
    courseId: 'course-2',
    progress: 30,
    completedModules: [],
    completedLessons: ['les-2-1-1'],
    totalTimeSpent: 120,
    lastAccessedAt: new Date('2024-03-08'),
    completedAt: undefined,
    certificateIssued: false,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'enroll-3',
    userId: 'user-6',
    courseId: 'course-1',
    progress: 100,
    completedModules: ['mod-1-1', 'mod-1-2', 'mod-1-3'],
    completedLessons: ['les-1-1-1', 'les-1-1-2', 'les-1-1-3', 'les-1-2-1', 'les-1-2-2', 'les-1-2-3', 'les-1-2-4', 'les-1-2-5', 'les-1-3-1', 'les-1-3-2', 'les-1-3-3'],
    totalTimeSpent: 1250,
    lastAccessedAt: new Date('2024-03-01'),
    completedAt: new Date('2024-03-01'),
    certificateIssued: true,
    createdAt: new Date('2024-01-20'),
  },
];

// ============================================
// ÓRDENES/PEDIDOS
// ============================================

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-2024-0001',
    buyerId: 'user-4',
    sellerId: 'user-2',
    storeId: 'store-1',
    items: [
      { id: 'item-1', productId: 'prod-1', productName: 'iPhone 15 Pro Max 256GB', productImage: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=200&h=200&fit=crop', quantity: 1, unitPrice: 8500000, total: 8500000 },
    ],
    subtotal: 8500000,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: 8500000,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'wallet',
    deliveryType: 'pickup',
    trackingHistory: [
      { id: 'track-1', status: 'pending', description: 'Pedido recibido', timestamp: new Date('2024-02-15T10:00:00'), location: '' },
      { id: 'track-2', status: 'confirmed', description: 'Pedido confirmado', timestamp: new Date('2024-02-15T10:30:00'), location: '' },
      { id: 'track-3', status: 'preparing', description: 'Preparando pedido', timestamp: new Date('2024-02-15T11:00:00'), location: '' },
      { id: 'track-4', status: 'ready', description: 'Listo para retirar', timestamp: new Date('2024-02-15T14:00:00'), location: '' },
      { id: 'track-5', status: 'delivered', description: 'Pedido entregado', timestamp: new Date('2024-02-15T16:30:00'), location: '' },
    ],
    commissionAmount: 425000,
    sellerEarnings: 8075000,
    createdAt: new Date('2024-02-15T10:00:00'),
    updatedAt: new Date('2024-02-15T16:30:00'),
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-2024-0002',
    buyerId: 'user-5',
    sellerId: 'user-3',
    storeId: 'store-2',
    items: [
      { id: 'item-2', productId: 'prod-8', productName: 'Vestido Elegante Floral', productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=200&fit=crop', quantity: 2, unitPrice: 450000, total: 900000 },
      { id: 'item-3', productId: 'prod-11', productName: 'Bolso de Cuero Artesanal', productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop', quantity: 1, unitPrice: 520000, total: 520000 },
    ],
    subtotal: 1420000,
    tax: 0,
    shippingCost: 50000,
    discount: 0,
    total: 1470000,
    status: 'in_transit',
    paymentStatus: 'paid',
    paymentMethod: 'wallet',
    deliveryType: 'delivery',
    deliveryAddress: { street: 'Av. Santa Teresa', number: '456', city: 'Asunción', state: 'Central', zipCode: '001' },
    trackingHistory: [
      { id: 'track-6', status: 'pending', description: 'Pedido recibido', timestamp: new Date('2024-03-01T09:00:00'), location: '' },
      { id: 'track-7', status: 'confirmed', description: 'Pedido confirmado', timestamp: new Date('2024-03-01T09:15:00'), location: '' },
      { id: 'track-8', status: 'preparing', description: 'Preparando pedido', timestamp: new Date('2024-03-01T10:00:00'), location: '' },
      { id: 'track-9', status: 'in_transit', description: 'En camino', timestamp: new Date('2024-03-01T14:00:00'), location: 'Asunción' },
    ],
    commissionAmount: 117600,
    sellerEarnings: 1352400,
    createdAt: new Date('2024-03-01T09:00:00'),
    updatedAt: new Date('2024-03-01T14:00:00'),
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-2024-0003',
    buyerId: 'user-6',
    sellerId: 'user-2',
    storeId: 'store-1',
    items: [
      { id: 'item-4', productId: 'prod-4', productName: 'AirPods Pro 2', productImage: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=200&h=200&fit=crop', quantity: 1, unitPrice: 1200000, total: 1200000 },
    ],
    subtotal: 1200000,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: 1200000,
    status: 'preparing',
    paymentStatus: 'paid',
    paymentMethod: 'wallet',
    deliveryType: 'pickup',
    trackingHistory: [
      { id: 'track-10', status: 'pending', description: 'Pedido recibido', timestamp: new Date('2024-03-05T11:00:00'), location: '' },
      { id: 'track-11', status: 'confirmed', description: 'Pedido confirmado', timestamp: new Date('2024-03-05T11:30:00'), location: '' },
      { id: 'track-12', status: 'preparing', description: 'Preparando pedido', timestamp: new Date('2024-03-05T12:00:00'), location: '' },
    ],
    commissionAmount: 60000,
    sellerEarnings: 1140000,
    createdAt: new Date('2024-03-05T11:00:00'),
    updatedAt: new Date('2024-03-05T12:00:00'),
  },
];

// ============================================
// TRANSACCIONES
// ============================================

export const mockTransactions: Transaction[] = [
  {
    id: 'trans-1',
    walletId: 'wallet-4',
    userId: 'user-4',
    type: 'purchase',
    amount: 8500000,
    currency: 'PYG',
    description: 'Compra: iPhone 15 Pro Max 256GB',
    category: 'Tecnología',
    status: 'completed',
    relatedOrderId: 'order-1',
    createdAt: new Date('2024-02-15T10:00:00'),
    updatedAt: new Date('2024-02-15T10:00:00'),
  },
  {
    id: 'trans-2',
    walletId: 'wallet-4',
    userId: 'user-4',
    type: 'deposit',
    amount: 10000000,
    currency: 'PYG',
    description: 'Recarga de saldo',
    category: 'Recarga',
    status: 'completed',
    createdAt: new Date('2024-02-10T09:00:00'),
    updatedAt: new Date('2024-02-10T09:00:00'),
  },
  {
    id: 'trans-3',
    walletId: 'wallet-4',
    userId: 'user-4',
    type: 'purchase',
    amount: 450000,
    currency: 'PYG',
    description: 'Compra: Curso Finanzas Personales',
    category: 'Educación',
    status: 'completed',
    createdAt: new Date('2024-02-01T14:00:00'),
    updatedAt: new Date('2024-02-01T14:00:00'),
  },
  {
    id: 'trans-4',
    walletId: 'wallet-5',
    userId: 'user-5',
    type: 'purchase',
    amount: 1470000,
    currency: 'PYG',
    description: 'Compra: Vestido + Bolso',
    category: 'Moda',
    status: 'completed',
    relatedOrderId: 'order-2',
    createdAt: new Date('2024-03-01T09:00:00'),
    updatedAt: new Date('2024-03-01T09:00:00'),
  },
  {
    id: 'trans-5',
    walletId: 'wallet-2',
    userId: 'user-2',
    type: 'sale',
    amount: 8500000,
    currency: 'PYG',
    description: 'Venta: iPhone 15 Pro Max',
    category: 'Ventas',
    status: 'completed',
    relatedOrderId: 'order-1',
    createdAt: new Date('2024-02-15T10:00:00'),
    updatedAt: new Date('2024-02-15T10:00:00'),
  },
  {
    id: 'trans-6',
    walletId: 'wallet-2',
    userId: 'user-2',
    type: 'commission',
    amount: -425000,
    currency: 'PYG',
    description: 'Comisión Oscorp - Venta iPhone',
    category: 'Comisiones',
    status: 'completed',
    relatedOrderId: 'order-1',
    createdAt: new Date('2024-02-15T10:00:00'),
    updatedAt: new Date('2024-02-15T10:00:00'),
  },
  {
    id: 'trans-7',
    walletId: 'wallet-6',
    userId: 'user-6',
    type: 'purchase',
    amount: 1200000,
    currency: 'PYG',
    description: 'Compra: AirPods Pro 2',
    category: 'Tecnología',
    status: 'completed',
    relatedOrderId: 'order-3',
    createdAt: new Date('2024-03-05T11:00:00'),
    updatedAt: new Date('2024-03-05T11:00:00'),
  },
];

// ============================================
// CRÉDITOS
// ============================================

export const mockCredits: Credit[] = [
  {
    id: 'credit-1',
    userId: 'user-4',
    amount: 3000000,
    concept: 'Inversión en equipamiento',
    installments: 6,
    installmentAmount: 550000,
    totalToPay: 3300000,
    interestRate: 10,
    status: 'active',
    documents: [
      { id: 'doc-1', type: 'id_front', url: 'https://example.com/ci-front.jpg', uploadedAt: new Date('2024-01-15') },
      { id: 'doc-2', type: 'id_back', url: 'https://example.com/ci-back.jpg', uploadedAt: new Date('2024-01-15') },
    ],
    paymentSchedule: [
      { id: 'ps-1', installmentNumber: 1, dueDate: new Date('2024-02-15'), amount: 550000, principal: 500000, interest: 50000, status: 'paid', paidAt: new Date('2024-02-14') },
      { id: 'ps-2', installmentNumber: 2, dueDate: new Date('2024-03-15'), amount: 550000, principal: 500000, interest: 50000, status: 'paid', paidAt: new Date('2024-03-14') },
      { id: 'ps-3', installmentNumber: 3, dueDate: new Date('2024-04-15'), amount: 550000, principal: 500000, interest: 50000, status: 'pending' },
      { id: 'ps-4', installmentNumber: 4, dueDate: new Date('2024-05-15'), amount: 550000, principal: 500000, interest: 50000, status: 'pending' },
      { id: 'ps-5', installmentNumber: 5, dueDate: new Date('2024-06-15'), amount: 550000, principal: 500000, interest: 50000, status: 'pending' },
      { id: 'ps-6', installmentNumber: 6, dueDate: new Date('2024-07-15'), amount: 550000, principal: 500000, interest: 50000, status: 'pending' },
    ],
    payments: [
      { id: 'pay-1', creditId: 'credit-1', installmentId: 'ps-1', amount: 550000, paidAt: new Date('2024-02-14'), paymentMethod: 'wallet' },
      { id: 'pay-2', creditId: 'credit-1', installmentId: 'ps-2', amount: 550000, paidAt: new Date('2024-03-14'), paymentMethod: 'wallet' },
    ],
    approvedBy: 'user-1',
    approvedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-14'),
  },
  {
    id: 'credit-2',
    userId: 'user-5',
    amount: 1500000,
    concept: 'Reparación de vehículo',
    installments: 3,
    installmentAmount: 550000,
    totalToPay: 1650000,
    interestRate: 10,
    status: 'pending',
    documents: [
      { id: 'doc-3', type: 'id_front', url: 'https://example.com/ci-front-2.jpg', uploadedAt: new Date('2024-03-01') },
      { id: 'doc-4', type: 'id_back', url: 'https://example.com/ci-back-2.jpg', uploadedAt: new Date('2024-03-01') },
    ],
    paymentSchedule: [],
    payments: [],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: 'credit-3',
    userId: 'user-6',
    amount: 5000000,
    concept: 'Capital de trabajo',
    installments: 12,
    installmentAmount: 500000,
    totalToPay: 6000000,
    interestRate: 20,
    status: 'completed',
    documents: [
      { id: 'doc-5', type: 'id_front', url: 'https://example.com/ci-front-3.jpg', uploadedAt: new Date('2023-06-01') },
      { id: 'doc-6', type: 'id_back', url: 'https://example.com/ci-back-3.jpg', uploadedAt: new Date('2023-06-01') },
    ],
    paymentSchedule: Array.from({ length: 12 }, (_, i) => ({
      id: `ps-comp-${i + 1}`,
      installmentNumber: i + 1,
      dueDate: new Date(2023, 6 + i, 15),
      amount: 500000,
      principal: 416667,
      interest: 83333,
      status: 'paid' as const,
      paidAt: new Date(2023, 6 + i, 14),
    })),
    payments: Array.from({ length: 12 }, (_, i) => ({
      id: `pay-comp-${i + 1}`,
      creditId: 'credit-3',
      installmentId: `ps-comp-${i + 1}`,
      amount: 500000,
      paidAt: new Date(2023, 6 + i, 14),
      paymentMethod: 'wallet',
    })),
    approvedBy: 'user-1',
    approvedAt: new Date('2023-06-02'),
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-05-14'),
  },
];

// ============================================
// CATEGORÍAS FINANCIERAS (INGENIO MILLONARIO)
// ============================================

export const mockFinancialCategories: FinancialCategory[] = [
  { id: 'fc-1', userId: 'user-4', name: 'Sueldo', type: 'income', color: '#22c55e', icon: 'briefcase', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-2', userId: 'user-4', name: 'Ventas', type: 'income', color: '#16a34a', icon: 'trending-up', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-3', userId: 'user-4', name: 'Inversiones', type: 'income', color: '#15803d', icon: 'pie-chart', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-4', userId: 'user-4', name: 'Alimentación', type: 'expense', color: '#ef4444', icon: 'utensils', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-5', userId: 'user-4', name: 'Transporte', type: 'expense', color: '#dc2626', icon: 'car', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-6', userId: 'user-4', name: 'Servicios', type: 'expense', color: '#b91c1c', icon: 'zap', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-7', userId: 'user-4', name: 'Entretenimiento', type: 'expense', color: '#f97316', icon: 'film', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-8', userId: 'user-4', name: 'Propiedades', type: 'asset', color: '#3b82f6', icon: 'home', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-9', userId: 'user-4', name: 'Vehículos', type: 'asset', color: '#2563eb', icon: 'truck', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-10', userId: 'user-4', name: 'Inversiones', type: 'asset', color: '#1d4ed8', icon: 'trending-up', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-11', userId: 'user-4', name: 'Préstamos', type: 'liability', color: '#7c3aed', icon: 'credit-card', isDefault: true, createdAt: new Date('2024-01-01') },
  { id: 'fc-12', userId: 'user-4', name: 'Tarjetas', type: 'liability', color: '#6d28d9', icon: 'credit-card', isDefault: true, createdAt: new Date('2024-01-01') },
];

// ============================================
// REGISTROS FINANCIEROS
// ============================================

export const mockFinancialRecords: FinancialRecord[] = [
  // Ingresos
  { id: 'fr-1', userId: 'user-4', categoryId: 'fc-1', type: 'income', amount: 5000000, description: 'Sueldo mensual', date: new Date('2024-02-01'), isRecurring: true, createdAt: new Date('2024-02-01') },
  { id: 'fr-2', userId: 'user-4', categoryId: 'fc-2', type: 'income', amount: 1200000, description: 'Ventas freelance', date: new Date('2024-02-10'), isRecurring: false, createdAt: new Date('2024-02-10') },
  { id: 'fr-3', userId: 'user-4', categoryId: 'fc-3', type: 'income', amount: 350000, description: 'Dividendos', date: new Date('2024-02-15'), isRecurring: false, createdAt: new Date('2024-02-15') },
  // Egresos
  { id: 'fr-4', userId: 'user-4', categoryId: 'fc-4', type: 'expense', amount: 1200000, description: 'Supermercado', date: new Date('2024-02-05'), isRecurring: true, createdAt: new Date('2024-02-05') },
  { id: 'fr-5', userId: 'user-4', categoryId: 'fc-5', type: 'expense', amount: 400000, description: 'Nafta', date: new Date('2024-02-08'), isRecurring: true, createdAt: new Date('2024-02-08') },
  { id: 'fr-6', userId: 'user-4', categoryId: 'fc-6', type: 'expense', amount: 650000, description: 'Luz, agua, internet', date: new Date('2024-02-10'), isRecurring: true, createdAt: new Date('2024-02-10') },
  { id: 'fr-7', userId: 'user-4', categoryId: 'fc-7', type: 'expense', amount: 280000, description: 'Cine y salidas', date: new Date('2024-02-14'), isRecurring: false, createdAt: new Date('2024-02-14') },
  // Activos
  { id: 'fr-8', userId: 'user-4', categoryId: 'fc-8', type: 'asset', amount: 150000000, description: 'Apartamento', date: new Date('2024-01-01'), isRecurring: false, createdAt: new Date('2024-01-01') },
  { id: 'fr-9', userId: 'user-4', categoryId: 'fc-9', type: 'asset', amount: 45000000, description: 'Auto', date: new Date('2024-01-01'), isRecurring: false, createdAt: new Date('2024-01-01') },
  { id: 'fr-10', userId: 'user-4', categoryId: 'fc-10', type: 'asset', amount: 8500000, description: 'Portafolio de inversiones', date: new Date('2024-01-01'), isRecurring: false, createdAt: new Date('2024-01-01') },
  // Pasivos
  { id: 'fr-11', userId: 'user-4', categoryId: 'fc-11', type: 'liability', amount: 80000000, description: 'Hipoteca', date: new Date('2024-01-01'), isRecurring: true, createdAt: new Date('2024-01-01') },
  { id: 'fr-12', userId: 'user-4', categoryId: 'fc-12', type: 'liability', amount: 2500000, description: 'Deuda tarjeta', date: new Date('2024-02-01'), isRecurring: false, createdAt: new Date('2024-02-01') },
];

// ============================================
// NOTIFICACIONES
// ============================================

export const mockNotifications: Notification[] = [
  { id: 'notif-1', userId: 'user-4', title: 'Pedido entregado', message: 'Tu pedido ORD-2024-0001 ha sido entregado', type: 'success', isRead: false, actionUrl: '/app/pedidos/order-1', createdAt: new Date('2024-02-15T16:30:00') },
  { id: 'notif-2', userId: 'user-4', title: 'Recarga aprobada', message: 'Tu recarga de ₲10.000.000 ha sido aprobada', type: 'success', isRead: true, actionUrl: '/app/wallet', createdAt: new Date('2024-02-10T09:00:00') },
  { id: 'notif-3', userId: 'user-4', title: 'Nueva lección disponible', message: 'Seiri - Clasificación ya está disponible', type: 'info', isRead: false, actionUrl: '/app/cursos/course-1', createdAt: new Date('2024-02-20T10:00:00') },
  { id: 'notif-4', userId: 'user-2', title: 'Nueva venta', message: 'Tienes una nueva venta: iPhone 15 Pro Max', type: 'success', isRead: false, actionUrl: '/vendedor/pedidos/order-1', createdAt: new Date('2024-02-15T10:00:00') },
  { id: 'notif-5', userId: 'user-2', title: 'Solicitud de retiro', message: 'Tu solicitud de retiro está siendo procesada', type: 'info', isRead: true, actionUrl: '/vendedor/retiros', createdAt: new Date('2024-02-20T14:00:00') },
];

// ============================================
// DATOS DEL ADMIN (para recargas)
// ============================================

export const adminBankData = {
  bankName: 'Banco Continental',
  accountNumber: '000123456789',
  accountType: 'checking' as const,
  holderName: 'Oscorp S.A.',
  documentId: '80012345-6',
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(u => u.email === email);
}

export function getWalletByUserId(userId: string): Wallet | undefined {
  return mockWallets.find(w => w.userId === userId);
}

export function getStoreById(id: string): Store | undefined {
  return mockStores.find(s => s.id === id);
}

export function getStoreBySlug(slug: string): Store | undefined {
  return mockStores.find(s => s.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find(p => p.id === id);
}

export function getProductsByStoreId(storeId: string): Product[] {
  return mockProducts.filter(p => p.storeId === storeId);
}

export function getOrdersByBuyerId(buyerId: string): Order[] {
  return mockOrders.filter(o => o.buyerId === buyerId);
}

export function getOrdersBySellerId(sellerId: string): Order[] {
  return mockOrders.filter(o => o.sellerId === sellerId);
}

export function getTransactionsByWalletId(walletId: string): Transaction[] {
  return mockTransactions.filter(t => t.walletId === walletId);
}

export function getCourses(): Course[] {
  return mockCourses;
}

export function getCourseById(id: string): Course | undefined {
  return mockCourses.find(c => c.id === id);
}

export function getEnrollmentsByUserId(userId: string): Enrollment[] {
  return mockEnrollments.filter(e => e.userId === userId);
}

export function getCreditsByUserId(userId: string): Credit[] {
  return mockCredits.filter(c => c.userId === userId);
}

export function getNotificationsByUserId(userId: string): Notification[] {
  return mockNotifications.filter(n => n.userId === userId);
}

export function getFinancialRecordsByUserId(userId: string): FinancialRecord[] {
  return mockFinancialRecords.filter(r => r.userId === userId);
}

export function getFinancialCategoriesByUserId(userId: string): FinancialCategory[] {
  return mockFinancialCategories.filter(c => c.userId === userId);
}
