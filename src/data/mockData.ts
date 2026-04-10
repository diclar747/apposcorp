import type {
  User, Wallet, VirtualCard, Store, Product, Course, Order,
  Transaction, Credit, Enrollment, FinancialCategory, FinancialRecord,
  Notification, BusinessHours, SocialLinks, Review
} from '@/types';

// ============================================
// HELPERS
// ============================================

const defaultBusinessHours = (): BusinessHours => ({
  monday: { open: '08:00', close: '18:00', isOpen: true },
  tuesday: { open: '08:00', close: '18:00', isOpen: true },
  wednesday: { open: '08:00', close: '18:00', isOpen: true },
  thursday: { open: '08:00', close: '18:00', isOpen: true },
  friday: { open: '08:00', close: '18:00', isOpen: true },
  saturday: { open: '09:00', close: '13:00', isOpen: true },
  sunday: { open: '00:00', close: '00:00', isOpen: false },
});

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
    roles: ['superadmin'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    walletId: 'wallet-1',
    virtualCard: {} as VirtualCard,
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
    roles: ['seller'],
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    walletId: 'wallet-2',
    virtualCard: {} as VirtualCard,
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
    roles: ['seller'],
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    walletId: 'wallet-3',
    virtualCard: {} as VirtualCard,
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
    roles: ['client'],
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    walletId: 'wallet-4',
    virtualCard: {} as VirtualCard,
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
    roles: ['client'],
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    walletId: 'wallet-5',
    virtualCard: {} as VirtualCard,
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
    roles: ['client'],
    isActive: true,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    walletId: 'wallet-6',
    virtualCard: {} as VirtualCard,
    ingenioAccess: true,
  },
  {
    id: 'user-7',
    email: 'tech@oscorp.com',
    password: 'seller123',
    firstName: 'Elena',
    lastName: 'Vega',
    phone: '+595 991 111222',
    address: 'Centro Asunción',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
    roles: ['seller'],
    isActive: true,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    walletId: 'wallet-7',
    virtualCard: {} as VirtualCard,
    ingenioAccess: true,
    sellerProfile: {
      id: 'seller-3',
      userId: 'user-7',
      storeName: 'TechHub Premium',
      storeSlug: 'techhub',
      description: 'Tecnología de punta y gadgets exclusivos.',
      address: 'Villa Morra',
      phone: '+595 991 111222',
      email: 'tech@oscorp.com',
      businessHours: defaultBusinessHours(),
      socialLinks: {},
      whatsappNumber: '+595 991 111222',
      isVerified: true,
      planActive: true,
      commissionRate: 5,
      totalSales: 50,
      totalRevenue: 25000000,
      rating: 5.0,
      reviewCount: 20,
    }
  },
  {
    id: 'user-8',
    email: 'gourmet@oscorp.com',
    password: 'seller123',
    firstName: 'Marco',
    lastName: 'Rossian',
    phone: '+595 992 333444',
    address: 'Recoleta',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marco',
    roles: ['seller'],
    isActive: true,
    createdAt: new Date('2024-04-02'),
    updatedAt: new Date('2024-04-02'),
    walletId: 'wallet-8',
    virtualCard: {} as VirtualCard,
    ingenioAccess: true,
    sellerProfile: {
      id: 'seller-4',
      userId: 'user-8',
      storeName: 'Gourmet Market',
      storeSlug: 'gourmet-market',
      description: 'Selección exclusiva de quesos, vinos y delicatessen.',
      address: 'Carmelitas',
      phone: '+595 992 333444',
      email: 'gourmet@oscorp.com',
      businessHours: defaultBusinessHours(),
      socialLinks: {},
      whatsappNumber: '+595 992 333444',
      isVerified: true,
      planActive: true,
      commissionRate: 5,
      totalSales: 100,
      totalRevenue: 15000000,
      rating: 4.9,
      reviewCount: 45,
    }
  },
  {
    id: 'user-9',
    email: 'super@oscorp.com',
    password: 'seller123',
    firstName: 'Ricardo',
    lastName: 'Altamirano',
    phone: '+595 993 555666',
    address: 'Lambaré',
    city: 'Asunción',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ricardo',
    roles: ['seller'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    walletId: 'wallet-9',
    virtualCard: {} as VirtualCard,
    ingenioAccess: true,
    sellerProfile: {
      id: 'seller-5',
      userId: 'user-9',
      storeName: 'Supermercado Oscorp',
      storeSlug: 'super-oscorp',
      description: 'Tu supermercado de confianza con los mejores precios del mercado.',
      address: 'Shopping Multiplaza, Asunción',
      phone: '+595 993 555666',
      email: 'super@oscorp.com',
      businessHours: defaultBusinessHours(),
      socialLinks: {},
      whatsappNumber: '+595 993 555666',
      isVerified: true,
      planActive: false, // Testing trial
      planExpiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days trial
      commissionRate: 3,
      totalSales: 0,
      totalRevenue: 0,
      rating: 5.0,
      reviewCount: 0,
    }
  },
];


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
  design: (['gradient_blue', 'gradient_purple', 'gradient_dark', 'minimal'][index % 4]) as any,
  isActive: true,
  createdAt: user.createdAt,
}));

// Actualizar cards en users
mockUsers.forEach((user, index) => {
  user.virtualCard = mockCards[index];
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
    category: 'Tecnología',
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
    category: 'Moda',
    products: [],
  },
  {
    id: 'store-3',
    sellerId: 'user-7',
    name: 'TechHub Premium',
    slug: 'techhub',
    description: 'Tecnología de punta, gadgets exclusivos y el mejor servicio técnico.',
    logo: 'https://images.unsplash.com/photo-1598327773202-3c1f043f479e?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
    address: 'Villa Morra, Asunción',
    phone: '+595 991 111222',
    email: 'tech@oscorp.com',
    businessHours: defaultBusinessHours(),
    socialLinks: {
      instagram: 'https://instagram.com/techhub',
      website: 'https://techhub.com.py',
    },
    whatsappNumber: '+595 991 111222',
    isActive: true,
    isOnline: true,
    category: 'Tecnología',
    products: [],
  },
  {
    id: 'store-4',
    sellerId: 'user-8',
    name: 'Gourmet Market',
    slug: 'gourmet-market',
    description: 'Una cuidada selección de vinos, quesos y productos gourmet importados.',
    logo: 'https://images.unsplash.com/photo-1579113800032-c38bd6060006?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&h=400&fit=crop',
    address: 'Carmelitas, Asunción',
    phone: '+595 992 333444',
    email: 'gourmet@oscorp.com',
    businessHours: defaultBusinessHours(),
    socialLinks: {
      instagram: 'https://instagram.com/gourmetmarket',
    },
    whatsappNumber: '+595 992 333444',
    isActive: true,
    isOnline: true,
    category: 'Gourmet',
    products: [],
  },
  {
    id: 'store-5',
    sellerId: 'user-9',
    name: 'Supermercado Oscorp',
    slug: 'super-oscorp',
    description: 'Tu supermercado de confianza con los mejores precios del mercado.',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1604719312563-8a8463e46101?w=1200&h=400&fit=crop',
    address: 'Shopping Multiplaza, Asunción',
    phone: '+595 993 555666',
    email: 'super@oscorp.com',
    businessHours: defaultBusinessHours(),
    socialLinks: {
      instagram: 'https://instagram.com/superoscorp',
    },
    whatsappNumber: '+595 993 555666',
    isActive: true,
    isOnline: true,
    category: 'Supermercado',
    products: [],
  },
];

// ============================================
// PROVEEDORES
// ============================================

export const mockSuppliers = [
  {
    id: 'sup-1',
    sellerId: 'user-7',
    name: 'Apple Distribuidor PY',
    contactName: 'Carlos Chen',
    phone: '0981123123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sup-2',
    sellerId: 'user-8',
    name: 'Vinos del Mundo SA',
    contactName: 'Roberto Gomez',
    phone: '0971456456',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// ============================================
// MOVIMIENTOS DE STOCK (Ejemplos)
// ============================================
export const mockStockMovements = [];

// ============================================
// PRODUCTOS
// ============================================

export const mockProducts: Product[] = [
  // Productos Tecnología Plus
  {
    id: 'prod-1',
    sellerId: 'user-2',
    storeId: 'store-1',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    description: 'El último iPhone con marco de titanio, chip A17 Pro y el sistema de cámara más avanzado.',
    price: 8500000,
    cost: 7000000,
    profitPercentage: 21.43,
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
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Smartphone flagship con S Pen integrado, cámara de 200MP y batería de 5000mAh.',
    price: 7200000,
    cost: 6000000,
    profitPercentage: 20,
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
    slug: 'macbook-air-m3-13',
    description: 'Laptop ultraligera con chip M3, 16GB RAM y 512GB SSD. Hasta 18 horas de batería.',
    price: 9500000,
    cost: 8000000,
    profitPercentage: 18.75,
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
    slug: 'airpods-pro-2',
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
    slug: 'ipad-air-11-m2',
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
    slug: 'reparacion-de-celulares',
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
  // Productos Style Hub
  {
    id: 'prod-7',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Camisa Oxford Formal',
    slug: 'camisa-oxford-formal',
    description: 'Camisa de algodón 100% corte slim fit. Ideal para oficina y eventos.',
    price: 280000,
    cost: 150000,
    profitPercentage: 86.67,
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
    slug: 'vestido-elegante-floral',
    description: 'Vestido midi con estampado floral, ideal para ocasiones especiales o uso diario.',
    price: 450000,
    comparePrice: 520000,
    stock: 25,
    sku: 'VEST-FLO-002',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop',
    ],
    category: 'Mujeres',
    subcategory: 'Vestidos',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['ropa', 'mujer', 'vestido'],
    isFeatured: true,
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'prod-9',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Jeans Denim Clásicos',
    slug: 'jeans-denim-clasicos',
    description: 'Jeans de corte recto con lavado medio. Durabilidad y estilo en una sola prenda.',
    price: 320000,
    comparePrice: 380000,
    stock: 40,
    sku: 'JEAN-DEN-003',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop',
    ],
    category: 'Hombres',
    subcategory: 'Pantalones',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['ropa', 'hombre', 'jeans'],
    isFeatured: false,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'prod-10',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Chaqueta de Cuero Sintético',
    slug: 'chaqueta-cuero-sintetico',
    description: 'Chaqueta estilo biker con acabados de alta calidad. Resistente y moderna.',
    price: 650000,
    comparePrice: 750000,
    stock: 15,
    sku: 'CHQ-CUE-004',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
    ],
    category: 'Mujeres',
    subcategory: 'Abrigos',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['ropa', 'mujer', 'chaqueta'],
    isFeatured: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'prod-11',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Zapatillas Urbanas Blancas',
    slug: 'zapatillas-urbanas-blancas',
    description: 'Zapatillas minimalistas y cómodas para el uso diario. Combinan con todo.',
    price: 250000,
    comparePrice: 320000,
    stock: 30,
    sku: 'ZAP-URB-005',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
    ],
    category: 'Calzados',
    subcategory: 'Zapatillas',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['calzado', 'unisex', 'urbano'],
    isFeatured: false,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: 'prod-12',
    sellerId: 'user-3',
    storeId: 'store-2',
    name: 'Bolso de Mano Elegante',
    slug: 'bolso-mano-elegante',
    description: 'Bolso de cuero con detalles dorados. Espacioso y sofisticado para la oficina o eventos.',
    price: 580000,
    stock: 10,
    sku: 'BOL-MAN-006',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
    ],
    category: 'Accesorios',
    subcategory: 'Bolsos',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['accesorio', 'mujer', 'bolso'],
    isFeatured: false,
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-12'),
  },

  // Productos TechHub
  {
    id: 'prod-13',
    sellerId: 'user-7',
    storeId: 'store-3',
    name: 'Laptop Gaming Alien',
    slug: 'laptop-gaming-alien',
    description: 'Potencia extrema para gaming. RTX 4090, i9 14th Gen, 64GB RAM.',
    price: 25000000,
    stock: 5,
    sku: 'GAM-ALI-009',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop'],
    category: 'Computadoras',
    subcategory: 'Gaming',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['gaming', 'laptop', 'premium'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-14',
    sellerId: 'user-7',
    storeId: 'store-3',
    name: 'VR Headset Pro',
    slug: 'vr-headset-pro',
    description: 'Realidad virtual inmersiva 8K con seguimiento ocular.',
    price: 4500000,
    stock: 10,
    sku: 'VR-PRO-X',
    images: ['https://images.unsplash.com/photo-1622979135225-d2ba269fb1bd?w=600&h=600&fit=crop'],
    category: 'Gadgets',
    subcategory: 'VR',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['vr', 'metaverse', 'tech'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Productos Gourmet Market
  {
    id: 'prod-15',
    sellerId: 'user-8',
    storeId: 'store-4',
    name: 'Vino Gran Reserva 2015',
    slug: 'vino-gran-reserva-2015',
    description: 'Vino tinto premiado, envejecido 24 meses en barrica de roble.',
    price: 350000,
    comparePrice: 420000,
    stock: 50,
    sku: 'VIN-RES-015',
    images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=600&fit=crop'],
    category: 'Vinos',
    subcategory: 'Tintos',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['vino', 'gourmet', 'alcohol'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-16',
    sellerId: 'user-8',
    storeId: 'store-4',
    name: 'Queso Parmigiano Reggiano',
    slug: 'queso-parmigiano-reggiano',
    description: 'Auténtico queso italiano, curado 30 meses. Precio por kg.',
    price: 280000,
    stock: 30,
    sku: 'CHE-PAR-REG',
    images: ['https://images.unsplash.com/photo-1621316560942-5db600cc5531?w=600&h=600&fit=crop'],
    category: 'Alimentos',
    subcategory: 'Quesos',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['queso', 'gourmet', 'italia'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Productos Supermercado Oscorp
  {
    id: 'prod-super-1',
    sellerId: 'user-9',
    storeId: 'store-5',
    name: 'Leche Entera 1L',
    slug: 'leche-entera-1l',
    description: 'Leche entera ultrapasteurizada de alta calidad.',
    price: 7500,
    stock: 200,
    sku: '7840001001',
    images: ['https://images.unsplash.com/photo-1563636619-e9153da1019d?w=600&h=600&fit=crop'],
    category: 'Lácteos',
    subcategory: 'Leches',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['supermercado', 'lacteo', 'leche'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-super-2',
    sellerId: 'user-9',
    storeId: 'store-5',
    name: 'Pan de Molde Blanco',
    slug: 'pan-de-molde-blanco',
    description: 'Pan de molde blanco, ideal para sanduiches y tostadas.',
    price: 12500,
    stock: 150,
    sku: '7840001002',
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop'],
    category: 'Panadería',
    subcategory: 'Panificados',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['supermercado', 'pan', 'fresco'],
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-super-3',
    sellerId: 'user-9',
    storeId: 'store-5',
    name: 'Agua Mineral 2L',
    slug: 'agua-mineral-2l',
    description: 'Agua mineral natural sin gas.',
    price: 3500,
    stock: 500,
    sku: '7840001003',
    images: ['https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=600&fit=crop'],
    category: 'Bebidas',
    subcategory: 'Aguas',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['supermercado', 'bebida', 'agua'],
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-super-4',
    sellerId: 'user-9',
    storeId: 'store-5',
    name: 'Arroz Premium 1kg',
    slug: 'arroz-premium-1kg',
    description: 'Arroz de grano largo fino, calidad premium.',
    price: 8200,
    stock: 300,
    sku: '7840001004',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop'],
    category: 'Almacén',
    subcategory: 'Arroz',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['supermercado', 'almacen', 'arroz'],
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-super-5',
    sellerId: 'user-9',
    storeId: 'store-5',
    name: 'Aceite de Girasol 900ml',
    slug: 'aceite-girasol-900ml',
    description: 'Aceite de girasol puro para cocina.',
    price: 14000,
    stock: 120,
    sku: '7840001005',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop'],
    category: 'Almacén',
    subcategory: 'Aceites',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['supermercado', 'almacen', 'aceite'],
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-super-6',
    sellerId: 'user-9',
    storeId: 'store-5',
    name: 'Detergente Líquido 1L',
    slug: 'detergente-liquido-1l',
    description: 'Detergente líquido concentrado para vajilla.',
    price: 9800,
    stock: 100,
    sku: '7840001006',
    images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=600&fit=crop'],
    category: 'Limpieza',
    subcategory: 'Lavavajillas',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    tags: ['supermercado', 'limpieza', 'hogar'],
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Asignar productos a tiendas
mockStores[0].products = mockProducts.filter(p => p.storeId === 'store-1');
mockStores[1].products = mockProducts.filter(p => p.storeId === 'store-2');
mockStores[2].products = mockProducts.filter(p => p.storeId === 'store-3');
mockStores[3].products = mockProducts.filter(p => p.storeId === 'store-4');

export const mockCourses: Course[] = [];
export const mockEnrollments: Enrollment[] = [];

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
  { id: 'notif-1', userId: 'user-4', title: 'Pedido entregado', message: 'Tu pedido ORD-2024-0001 ha sido entregado', type: 'success', isRead: false, actionUrl: '/app/pedidos/order-1', createdAt: '2024-02-15T16:30:00' },
  { id: 'notif-2', userId: 'user-4', title: 'Recarga aprobada', message: 'Tu recarga de ₲10.000.000 ha sido aprobada', type: 'success', isRead: true, actionUrl: '/app/wallet', createdAt: '2024-02-10T09:00:00' },
  { id: 'notif-4', userId: 'user-2', title: 'Nueva venta', message: 'Tienes una nueva venta: iPhone 15 Pro Max', type: 'success', isRead: false, actionUrl: '/vendedor/pedidos/order-1', createdAt: '2024-02-15T10:00:00' },
  { id: 'notif-5', userId: 'user-2', title: 'Solicitud de retiro', message: 'Tu solicitud de retiro está siendo procesada', type: 'info', isRead: true, actionUrl: '/vendedor/retiros', createdAt: '2024-02-20T14:00:00' },
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

export const mockReviews: Review[] = [
  {
    id: 'rev-1',
    userId: 'user-4',
    user: mockUsers.find(u => u.id === 'user-4'),
    productId: 'prod-1',
    rating: 5,
    comment: '¡Increíble producto! El iPhone 15 Pro Max superó mis expectativas. La cámara es profesional.',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'rev-2',
    userId: 'user-5',
    user: mockUsers.find(u => u.id === 'user-5'),
    storeId: 'store-1',
    rating: 5,
    comment: 'Excelente atención en Tecnología Plus. Me ayudaron a elegir la mejor laptop para mi trabajo.',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'rev-3',
    userId: 'user-6',
    user: mockUsers.find(u => u.id === 'user-6'),
    storeId: 'store-1',
    rating: 4,
    comment: 'Buena selección de productos, aunque el envío tardó un poco más de lo esperado. Altamente recomendado por su calidad.',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  }
];

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

export function getReviewsByStoreId(storeId: string): Review[] {
  return mockReviews.filter(r => r.storeId === storeId);
}

export function getReviewsByProductId(productId: string): Review[] {
  return mockReviews.filter(r => r.productId === productId);
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find(p => p.slug === slug);
}
