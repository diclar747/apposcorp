// ============================================
// TIPOS BASE - Oscorp Platform
// ============================================

export type UserRole = 'client' | 'seller' | 'superadmin';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'wallet' | 'cash' | 'card' | 'transfer';
export type ProductType = 'physical' | 'service' | 'digital';
export type ProductVisibility = 'online' | 'local' | 'both';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CreditStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
export type TransactionType = 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'purchase' | 'sale' | 'withdrawal' | 'deposit' | 'commission' | 'credit' | 'fee';
export type FinancialType = 'income' | 'expense' | 'asset' | 'liability';

// ============================================
// USUARIO
// ============================================

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  walletId: string;
  cardQR: VirtualCard;
  bankData?: BankData;
  sellerProfile?: SellerProfile;
  ingenioAccess: boolean;
  reviews?: Review[];
}

export interface BankData {
  bankName: string;
  accountNumber: string;
  accountType: 'savings' | 'checking';
  holderName: string;
  documentId: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

export interface BusinessHours {
  monday: { open: string; close: string; isOpen: boolean };
  tuesday: { open: string; close: string; isOpen: boolean };
  wednesday: { open: string; close: string; isOpen: boolean };
  thursday: { open: string; close: string; isOpen: boolean };
  friday: { open: string; close: string; isOpen: boolean };
  saturday: { open: string; close: string; isOpen: boolean };
  sunday: { open: string; close: string; isOpen: boolean };
}

// ============================================
// VENDEDOR Y TIENDA
// ============================================

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  description: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  businessHours: BusinessHours;
  socialLinks: SocialLinks;
  whatsappNumber: string;
  isVerified: boolean;
  planActive: boolean;
  planExpiryDate?: Date;
  commissionRate: number;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
}

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  address: string;
  phone: string;
  email: string;
  businessHours: BusinessHours;
  socialLinks: SocialLinks;
  whatsappNumber: string;
  isActive: boolean;
  isOnline: boolean;
  category: string; // classification
  products: Product[];
  reviews?: Review[];
  isVerified?: boolean;
  rating?: number;
}

export interface Supplier {
  id: string;
  sellerId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  quantity: number;
  reason?: string;
  reference?: string;
  supplierId?: string;
  cost?: number; // Unit cost
  createdAt: Date;
}

// ============================================
// PRODUCTOS
// ============================================

export interface Product {
  id: string;
  sellerId: string;
  storeId: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  cost?: number;
  profitPercentage?: number;
  comparePrice?: number;
  stock: number;
  sku: string;
  images: string[];
  category: string;
  subcategory?: string;
  type: ProductType;
  visibility: ProductVisibility;
  status: 'active' | 'inactive' | 'out_of_stock';
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  stockMovements?: StockMovement[];
  supplierId?: string | null;
  supplier?: Supplier;
  weight?: number;
  dimensions?: Dimensions;
  tags: string[];
  isFeatured: boolean;
  reviews?: Review[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

// ============================================
// RESEÑAS Y CALIFICACIONES
// ============================================

export interface Review {
  id: string;
  userId: string;
  user?: Partial<User>;
  productId?: string;
  storeId?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BILLETERA Y TARJETA
// ============================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended';
  dailyLimit: number;
  monthlyLimit: number;
  totalIn: number;
  totalOut: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualCard {
  id: string;
  userId: string;
  walletId: string;
  cardNumber: string;
  qrCode: string;
  qrData: string;
  design: CardDesign;
  isActive: boolean;
  createdAt: Date;
}

export type CardDesign = 'gradient-blue' | 'gradient-purple' | 'gradient-dark' | 'minimal';

// ============================================
// TRANSACCIONES
// ============================================

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  relatedUserId?: string;
  relatedOrderId?: string;
  relatedCreditId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PEDIDOS
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: Address;
  deliveryNotes?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingHistory: TrackingEvent[];
  commissionAmount: number;
  sellerEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  variant?: string;
}

export interface Address {
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
}

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  description: string;
  timestamp: Date;
  location?: string;
}

// ============================================
// CURSOS
// ============================================

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverImage?: string;
  previewVideo?: string;
  instructorId: string;
  instructorName: string;
  category: string;
  level: CourseLevel;
  price: number;
  comparePrice?: number;
  duration: number;
  modules: Module[];
  resources: Resource[];
  isPublished: boolean;
  isFeatured: boolean;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources: Resource[];
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'link';
  url: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedModules: string[];
  completedLessons: string[];
  totalTimeSpent: number;
  lastAccessedAt: Date;
  completedAt?: Date;
  certificateIssued: boolean;
  createdAt: Date;
}

// ============================================
// CRÉDITOS
// ============================================

export interface Credit {
  id: string;
  userId: string;
  amount: number;
  concept: string;
  installments: number;
  installmentAmount: number;
  totalToPay: number;
  interestRate: number;
  status: CreditStatus;
  documents: CreditDocument[];
  paymentSchedule: PaymentScheduleItem[];
  payments: CreditPayment[];
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditDocument {
  id: string;
  type: 'id_front' | 'id_back' | 'proof_income' | 'other';
  url: string;
  uploadedAt: Date;
}

export interface PaymentScheduleItem {
  id: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
}

export interface CreditPayment {
  id: string;
  creditId: string;
  installmentId: string;
  amount: number;
  paidAt: Date;
  paymentMethod: string;
}

// ============================================
// FINANZAS (INGENIO MILLONARIO)
// ============================================

export interface FinancialCategory {
  id: string;
  userId: string;
  name: string;
  type: FinancialType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface FinancialRecord {
  id: string;
  userId: string;
  categoryId: string;
  type: FinancialType;
  amount: number;
  description: string;
  date: Date;
  isRecurring: boolean;
  recurrencePattern?: string;
  attachments?: string[];
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  month: number;
  year: number;
  incomeGoal: number;
  expenseLimit: number;
  categoryLimits: CategoryLimit[];
  createdAt: Date;
}

export interface CategoryLimit {
  categoryId: string;
  limit: number;
}

// ============================================
// NOTIFICACIONES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  campaignId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'campaign';
  isRead: boolean;
  imageUrl?: string;
  actionUrl?: string;
  clickedAt?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  targetRole: string;
  status: 'draft' | 'sent';
  sentAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    sent: number;
    read: number;
    clicked: number;
    readRate: number;
    clickRate: number;
  };
}

// ============================================
// CARRITO
// ============================================

export interface CartItem {
  product: Product;
  quantity: number;
}

// ============================================
// FILTROS Y UTILIDADES
// ============================================

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: ProductType;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}
