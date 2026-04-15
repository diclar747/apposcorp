import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, Wallet, Receipt, X, Package, Barcode,
  Printer, History, Keyboard, User as UserIcon, Copy,
  ChevronUp, ChevronDown as ChevronDownIcon, Users, Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/stores';
import { productsApi, walletApi, customersApi, managementApi, ordersApi } from '@/lib/api';
import { generateQRValue } from '@/lib/qr';
import { Loader2, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types';

// ─── Beep Sound (supermarket scanner) ───────────────────────────────
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* ignore on unsupported browsers */ }
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

export default function SellerPOS() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const sellerProfile = user?.sellerProfile;

  // Products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [processing, setProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [walletPaymentDetected, setWalletPaymentDetected] = useState(false);
  const walletPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialBalanceRef = useRef<number | null>(null);

  // Sale type & customer for crédito
  const [saleType, setSaleType] = useState<'contado' | 'credito'>('contado');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [posCategoryId, setPosCategoryId] = useState<string | null>(null);

  // Mobile cart drawer
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState<number | string>('');
  const [showInsufficientError, setShowInsufficientError] = useState(false);
  // Sales history toggle (mobile)
  const [showHistory, setShowHistory] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!sellerProfile?.id) return;
      try {
        setIsLoadingProducts(true);
        const data = await productsApi.getAll({ sellerId: sellerProfile.id });
        setProducts(data);
      } catch (error) {
        console.error('Error fetching POS products:', error);
        toast.error('Error al cargar productos');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [sellerProfile?.id]);

  // Plan Restriction Check
  useEffect(() => {
    if (user && user.sellerProfile && user.sellerProfile.plan) {
      const features = user.sellerProfile.plan.features || [];
      const hasPOS = features.some(f => f.toLowerCase().includes('pos'));
      if (!hasPOS) {
        toast.error('Tu plan no incluye acceso al Punto de Venta (POS)');
        navigate('/vendedor');
      }
    }
  }, [user, navigate]);

  // Fetch customers for crédito sales + POS category for Gestión integration
  useEffect(() => {
    customersApi.getAll().then(setCustomers).catch(() => {});
    managementApi.seedCategories().catch(() => {});
    managementApi.getCategories().then((cats: any[]) => {
      const posCat = cats.find((c: any) => c.name === 'Ventas POS' && c.type === 'income');
      if (posCat) setPosCategoryId(posCat.id);
    }).catch(() => {});
  }, []);

  // Trial Logic
  const isTrialExpired = useMemo(() => {
    if (!sellerProfile) return false;
    if (sellerProfile.planActive) return false;
    if (!sellerProfile.planExpiryDate) return false;
    return new Date() > new Date(sellerProfile.planExpiryDate);
  }, [sellerProfile]);

  const daysLeft = useMemo(() => {
    if (!sellerProfile?.planExpiryDate) return 0;
    const diff = new Date(sellerProfile.planExpiryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [sellerProfile]);

  const storeName = sellerProfile?.storeName || 'Mi Tienda';
  const storeAddress = sellerProfile?.address || '';
  const storePhone = sellerProfile?.phone || '';

  // Filter
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Barcode auto-detect
  useEffect(() => {
    const exactMatch = products.find(p => p.sku.toLowerCase() === searchTerm.toLowerCase());
    if (exactMatch && searchTerm.length > 2) {
      addToCart(exactMatch);
      setSearchTerm('');
      toast.success(`Producto añadido: ${exactMatch.name}`);
    }
  }, [searchTerm, products]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) setIsCheckoutOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchTerm('');
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Wallet payment polling
  useEffect(() => {
    if (!isCheckoutOpen || paymentMethod !== 'wallet' || cart.length === 0) {
      if (walletPollingRef.current) {
        clearInterval(walletPollingRef.current);
        walletPollingRef.current = null;
      }
      initialBalanceRef.current = null;
      setWalletPaymentDetected(false);
      return;
    }

    const startPolling = async () => {
      try {
        const wallet = await walletApi.getWallet();
        initialBalanceRef.current = wallet.balance;
      } catch {
        initialBalanceRef.current = null;
      }

      walletPollingRef.current = setInterval(async () => {
        try {
          const wallet = await walletApi.getWallet();
          if (initialBalanceRef.current !== null && wallet.balance > initialBalanceRef.current) {
            setWalletPaymentDetected(true);
            if (walletPollingRef.current) {
              clearInterval(walletPollingRef.current);
              walletPollingRef.current = null;
            }
            setTimeout(() => {
              const saleData = {
                id: `V-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date(),
                items: [...cart],
                subtotal, tax, total,
                paymentMethod: 'wallet' as const,
                customerName: saleType === 'credito' && selectedCustomer ? selectedCustomer.fullName : customerName,
                saleType,
                customer: saleType === 'credito' ? selectedCustomer : null,
              };
              setLastSale(saleData);
              setSalesHistory(prev => [saleData, ...prev].slice(0, 10));
              setIsCheckoutOpen(false);
              setCart([]);
              setMobileCartOpen(false);
              setIsReceiptOpen(true);
              setCustomerName('Consumidor Final');
              setSaleType('contado');
              setSelectedCustomer(null);
              setWalletPaymentDetected(false);
              toast.success('¡Pago con Wallet recibido!');

              // Register in Gestión as income movement
              if (posCategoryId) {
                managementApi.createMovement({
                  categoryId: posCategoryId,
                  type: 'income',
                  amount: total,
                  description: `Venta POS (Wallet) ${saleData.id} - ${saleData.customerName}`,
                  voucherNumber: saleData.id,
                  reference: saleData.id,
                }).catch(() => {});
              }
            }, 1500);
          }
        } catch { /* silent */ }
      }, 3000);
    };

    startPolling();
    return () => {
      if (walletPollingRef.current) {
        clearInterval(walletPollingRef.current);
        walletPollingRef.current = null;
      }
    };
  }, [isCheckoutOpen, paymentMethod, cart.length > 0]);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Stock máximo alcanzado para ${product.name} (${product.stock} disp.)`);
          return prev;
        }
        playBeep();
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stock <= 0) {
        toast.error('Producto sin stock disponible');
        return prev;
      }
      playBeep();
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0] || '',
        stock: product.stock // Keep track of stock in cart item for easier validation
      }];
    });
  }, []);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        
        if (delta > 0 && newQty > item.stock) {
           toast.error(`No hay más stock disponible (${item.stock} total)`);
           return item;
        }
        
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    // Validate Cash amount if method is cash
    if (paymentMethod === 'cash') {
      const received = Number(String(amountReceived).replace(/\./g, ''));
      if (amountReceived === '' || received < total) {
        setShowInsufficientError(true);
        toast.error('Monto insuficiente');
        return;
      }
    }
    setShowInsufficientError(false);
    setProcessing(true);
    try {
      const saleData = {
        id: `V-${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0')}`,
        date: new Date(),
        items: [...cart],
        subtotal, tax, total,
        paymentMethod,
        customerName: saleType === 'credito' && selectedCustomer ? selectedCustomer.fullName : customerName,
        saleType,
        customer: saleType === 'credito' ? selectedCustomer : null,
      };

      // 1. Create real order to update Dashboard sales & earnings
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total,
        paymentMethod: paymentMethod,
        customerName: saleData.customerName,
        status: 'delivered', // Match OrderStatus enum
        paymentStatus: 'paid', // POS sales are paid immediately
        isPosSale: true,
        deliveryType: 'presencial',
        sellerId: sellerProfile?.id
      };
      
      const createdOrder = await ordersApi.create(orderData);

      // 2. Update local state only (Backend already updated DB stock)
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          setProducts(prev => prev.map(p => 
            p.id === item.id ? { ...p, stock: newStock } : p
          ));
        }
      }

      // 3. Register in Gestión as income movement
      if (posCategoryId) {
        await managementApi.createMovement({
          categoryId: posCategoryId,
          type: 'income',
          amount: total,
          description: `Venta POS ${saleData.id} - ${saleData.customerName}`,
          voucherNumber: saleData.id,
          reference: createdOrder.id || saleData.id,
        });
      }

      // 3. Finalize UI
      setLastSale(saleData);
      setSalesHistory(prev => [saleData, ...prev].slice(0, 10));
      setIsCheckoutOpen(false);
      setCart([]);
      setMobileCartOpen(false);
      setIsReceiptOpen(true);
      setCustomerName('Consumidor Final');
      setSaleType('contado');
      setSelectedCustomer(null);
      setAmountReceived('');
      toast.success('Venta realizada y stock actualizado');
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Guard: No store ──────────────────────────────────────────────
  if (!sellerProfile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center p-8 bg-card rounded-3xl border shadow-xl max-w-md">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter mb-2 uppercase">Tienda no configurada</h2>
          <p className="text-muted-foreground mb-8">Debes completar el perfil de tu tienda para poder utilizar el sistema de Punto de Venta.</p>
          <Button className="w-full h-12 font-bold" onClick={() => navigate('/vendedor/tienda')}>
            CONFIGURAR TIENDA
          </Button>
        </div>
      </div>
    );
  }

  // ─── Guard: Trial expired ─────────────────────────────────────────
  if (isTrialExpired) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center p-8 sm:p-12 bg-card rounded-[2rem] border-2 border-red-100 dark:border-red-500/20 shadow-2xl max-w-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <X className="w-12 h-12 text-red-500" />
          </div>
          <Badge className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 mb-4 hover:bg-red-100 border-0 font-black">DEMO FINALIZADA</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter mb-4 uppercase">Periodo de Prueba Agotado</h2>
          <p className="text-muted-foreground mb-10 text-base sm:text-lg leading-relaxed">
            Tu acceso gratuito ha expirado. Para continuar utilizando el POS, adquiere una suscripción.
          </p>
          <div className="space-y-4">
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-xl shadow-blue-500/20">
              ADQUIRIR SUSCRIPCIÓN
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground font-bold">
              HABLAR CON SOPORTE
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Cart items list (shared between desktop & mobile) ────────────
  const CartItemsList = () => (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {cart.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex gap-3 bg-card p-2.5 rounded-xl border hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
          >
            {item.image ? (
              <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground line-clamp-1">{item.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex flex-col items-end justify-between gap-1">
              <div className="flex items-center gap-1.5 bg-muted rounded-lg p-0.5">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-background rounded transition-all">
                  <Minus className="w-3 h-3 text-muted-foreground" />
                </button>
                <span className="text-xs font-bold w-5 text-center text-foreground">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, 1)} 
                  className="p-1 hover:bg-background rounded transition-all disabled:opacity-20"
                  disabled={item.quantity >= item.stock}
                >
                  <Plus className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {cart.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed">
            <Package className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-sm font-medium">Carrito Vacío</p>
          <p className="text-xs mt-1">Seleccione productos para comenzar</p>
        </div>
      )}
    </div>
  );

  // ─── Totals + Pay button (shared) ────────────────────────────────
  const TotalsSection = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn(
      "bg-slate-900 dark:bg-slate-800 text-white",
      compact ? "p-4 space-y-3" : "p-5 space-y-4"
    )}>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-widest">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-widest">
          <span>IVA (10%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-xl font-black pt-3 border-t border-slate-700 mt-1">
          <span className="text-sm font-bold self-center text-blue-400 uppercase tracking-tighter">TOTAL</span>
          <span className="text-blue-400">{formatCurrency(total)}</span>
        </div>
      </div>
      <Button
        className="w-full h-12 sm:h-14 text-base sm:text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-900/30 active:scale-[0.98] transition-all uppercase"
        disabled={cart.length === 0}
        onClick={() => { setMobileCartOpen(false); setIsCheckoutOpen(true); }}
      >
        <CreditCard className="w-5 h-5 mr-2" />
        COBRAR <span className="hidden sm:inline ml-1">(F2)</span>
      </Button>
    </div>
  );

  // ─── Main Layout ──────────────────────────────────────────────────
  return (
    <div className="-m-4 lg:-m-6 flex flex-col h-[calc(100dvh-4rem)]">

      {/* ═══ Top Bar ═══ */}
      <div className="shrink-0 px-3 sm:px-4 lg:px-6 py-3 border-b bg-card flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 truncate">
            <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">POS</span>
            {!sellerProfile?.planActive && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-black uppercase shrink-0">
                Trial: {daysLeft}d
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">{storeName}</p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => setIsCustomerModalOpen(true)}>
          <UserIcon className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
          <span className="max-w-[100px] truncate">{customerName}</span>
        </Button>

        <div className="relative w-full sm:w-64 lg:w-80 order-last sm:order-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar o escanear SKU..."
            className="pl-9 h-9 text-sm bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0 hidden lg:flex"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-3.5 h-3.5 mr-1.5" />
          Historial
        </Button>
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* ── Products Grid ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-10 animate-pulse" />
                  <p className="text-sm font-medium">Cargando productos...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
                {filteredProducts.map((product) => {
                  const inCart = cart.find(c => c.id === product.id);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(product)}
                      className={cn(
                        "group cursor-pointer bg-card p-2 sm:p-3 rounded-xl border transition-all active:ring-2 active:ring-blue-500",
                        inCart
                          ? "border-blue-400 dark:border-blue-500/50 ring-1 ring-blue-200 dark:ring-blue-500/20"
                          : "hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md"
                      )}
                    >
                      <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden relative">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Hover plus icon */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors" />
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-blue-600 p-1 rounded-full shadow-lg text-white">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        {/* In cart badge */}
                        {inCart && (
                          <div className="absolute top-1.5 left-1.5">
                            <div className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow">
                              {inCart.quantity}
                            </div>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-2 leading-tight min-h-[2rem] sm:min-h-[2.5rem]">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">{formatCurrency(product.price)}</p>
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] font-black uppercase text-slate-500">{product.stock} <span className="text-[8px] opacity-70">DISP.</span></p>
                            <p className="text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded font-mono hidden sm:block mt-0.5">{product.sku}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-20 text-center text-muted-foreground">
                    <Barcode className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-sm">
                      {products.length === 0
                        ? 'No tienes productos. Agrega desde la sección Productos.'
                        : 'No se encontraron productos'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sales History (desktop, toggled) ── */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 200, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="hidden lg:block shrink-0 border-t bg-card overflow-hidden"
              >
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      <History className="w-3.5 h-3.5" />
                      Historial de Sesión
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5">{salesHistory.length} ventas</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">ID</th>
                          <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Cliente</th>
                          <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-right">Monto</th>
                          <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-center">Tipo</th>
                          <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-center">Pago</th>
                          <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-right">Ticket</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {salesHistory.map((sale) => (
                          <tr key={sale.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-4 py-2 font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">{sale.id}</td>
                            <td className="px-4 py-2 text-foreground text-xs">{sale.customerName}</td>
                            <td className="px-4 py-2 text-right font-bold text-foreground text-xs">{formatCurrency(sale.total)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                sale.saleType === 'credito'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                              )}>
                                {sale.saleType === 'credito' ? 'Crédito' : 'Contado'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => { setLastSale(sale); setIsReceiptOpen(true); }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded text-blue-600 dark:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {salesHistory.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic text-xs">
                              No hay ventas en esta sesión
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Cart Sidebar (desktop only) ── */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-col border-l bg-card shrink-0">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-foreground" />
              <h2 className="font-bold uppercase tracking-wider text-xs text-foreground">Resumen</h2>
            </div>
            <Badge className="bg-blue-600 text-white">{itemCount} items</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <CartItemsList />
          </div>
          <TotalsSection />
        </div>
      </div>

      {/* ═══ Mobile: Floating Cart Bar ═══ */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
          <div
            className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-2xl shadow-black/30 cursor-pointer"
            onClick={() => setMobileCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total a cobrar</p>
                <p className="text-lg font-black text-blue-400">{formatCurrency(total)}</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs h-10 px-5"
              onClick={(e) => { e.stopPropagation(); setMobileCartOpen(false); setIsCheckoutOpen(true); }}
            >
              COBRAR
            </Button>
          </div>
        </div>
      )}

      {/* ═══ Mobile: Cart Drawer ═══ */}
      <AnimatePresence>
        {mobileCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-background rounded-t-2xl max-h-[85dvh] flex flex-col shadow-2xl"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2" onClick={() => setMobileCartOpen(false)}>
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-foreground" />
                  <h2 className="font-bold text-foreground">Carrito</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">{itemCount}</Badge>
                  <button onClick={() => setMobileCartOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <CartItemsList />
              </div>

              {/* Totals + Pay */}
              <TotalsSection compact />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Desktop: Keyboard Shortcuts ═══ */}
      <div className="hidden lg:flex fixed bottom-4 left-1/2 -translate-x-1/2 items-center gap-4 text-[10px] text-white/90 bg-slate-900/90 dark:bg-slate-700/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl z-30">
        <div className="flex items-center gap-1.5"><Keyboard className="w-3 h-3 text-blue-400" /><span className="font-black text-blue-400">F2</span> COBRAR</div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5"><Keyboard className="w-3 h-3 text-blue-400" /><span className="font-black text-blue-400">ESC</span> BUSCAR</div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5"><Barcode className="w-3 h-3 text-green-400" /><span className="font-black text-green-400">ESCÁNER ACTIVO</span></div>
      </div>

      {/* ═══ Checkout Dialog ═══ */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Venta</DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="text-center py-5 bg-muted rounded-2xl border">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Monto a Cobrar</p>
              <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Tipo de Venta</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setSaleType('contado'); setSelectedCustomer(null); }}
                  className={cn(
                    'py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center',
                    saleType === 'contado'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : 'border-muted bg-background text-muted-foreground hover:border-gray-300'
                  )}
                >
                  <Banknote className="w-4 h-4 mr-1.5" />
                  Contado
                </button>
                <div className="relative group">
                  <button
                    disabled={!user?.sellerProfile?.plan?.features?.some(f => f.toLowerCase().includes('clientes'))}
                    onClick={() => setSaleType('credito')}
                    className={cn(
                      'w-full py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center',
                      saleType === 'credito'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : 'border-muted bg-background text-muted-foreground hover:border-gray-300',
                      !user?.sellerProfile?.plan?.features?.some(f => f.toLowerCase().includes('clientes')) && 'opacity-50 cursor-not-allowed grayscale'
                    )}
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Crédito
                  </button>
                  {!user?.sellerProfile?.plan?.features?.some(f => f.toLowerCase().includes('clientes')) && (
                    <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[9px] text-amber-600 font-bold uppercase whitespace-nowrap">Requiere Gestión de Clientes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {saleType === 'credito' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Cliente</Label>
                  {customers.length > 0 ? (
                    <Select
                      value={selectedCustomer?.id || ''}
                      onValueChange={(id) => setSelectedCustomer(customers.find((c: any) => c.id === id) || null)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              {c.fullName} {c.ruc ? `(${c.ruc})` : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                      No tienes clientes registrados.{' '}
                      <button onClick={() => navigate('/vendedor/clientes')} className="underline font-bold">
                        Registrar cliente
                      </button>
                    </div>
                  )}
                </div>
              )}
            <Tabs defaultValue="cash" onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-11">
                <TabsTrigger value="cash" className="gap-1.5 text-xs">
                  <Banknote className="w-4 h-4" />
                  <span className="hidden sm:inline">Efectivo</span>
                  <span className="sm:hidden">Cash</span>
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4" />
                  Tarjeta
                </TabsTrigger>
                <TabsTrigger value="wallet" className="gap-1.5 text-xs">
                  <Wallet className="w-4 h-4" />
                  Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cash" className="mt-4">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase">Monto Recibido</Label>
                  <Input 
                    type="text" 
                    value={amountReceived}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      if (rawValue === '') {
                        setAmountReceived('');
                        return;
                      }
                      const formatted = new Intl.NumberFormat('de-DE').format(Number(rawValue));
                      setAmountReceived(formatted);
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="0" 
                    className="h-12 text-xl font-bold border-2 focus-visible:ring-blue-600" 
                  />
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-500/20">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Cambio:</span>
                    <span className="text-lg font-black text-blue-800 dark:text-blue-200">
                      {(() => {
                        const received = Number(String(amountReceived).replace(/\./g, ''));
                        return formatCurrency(received > total ? received - total : 0);
                      })()}
                    </span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="card" className="mt-4">
                <div className="p-6 border-2 border-dashed rounded-2xl bg-muted/50 text-center space-y-3">
                  <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">Esperando comunicación con terminal...</p>
                </div>
              </TabsContent>
              <TabsContent value="wallet" className="mt-4">
                {walletPaymentDetected ? (
                  <div className="p-6 border-2 border-green-200 dark:border-green-500/30 rounded-2xl bg-green-50 dark:bg-green-500/10 text-center space-y-3">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-lg font-black text-green-800 dark:text-green-300">¡Pago Recibido!</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Generando comprobante...</p>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 text-center space-y-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                      <QRCodeSVG
                        value={generateQRValue(user?.id || '', storeName, total)}
                        size={160}
                        level="L"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        marginSize={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground">Escanee el QR para pagar</p>
                      <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Esperando pago...</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(generateQRValue(user?.id || '', storeName, total));
                        toast.success("Código copiado");
                      }} className="gap-2 text-xs">
                        <Copy className="w-3 h-3" /> Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="font-bold text-muted-foreground">CANCELAR</Button>
            <Button 
              onClick={handleCheckout} 
              disabled={
                processing || 
                (saleType === 'credito' && !selectedCustomer)
              } 
              className={cn(
                "font-bold px-6 transition-all bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> PROCESANDO...
                </span>
              ) : 'CONFIRMAR PAGO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[350px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl flex flex-col rounded-[1.5rem]">
          <div className="overflow-y-auto flex-1 max-h-[75dvh]">
            <div className="p-6 font-mono text-sm text-slate-800 dark:text-slate-100" id="receipt-content">
              <div className="text-center mb-5">
                <Receipt className="w-8 h-8 text-slate-900 dark:text-slate-100 mx-auto mb-2 opacity-20" />
                <h2 className="text-xl font-black uppercase tracking-tighter mb-0.5">{storeName}</h2>
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] mb-3">Oscorp POS System</p>
                <div className="space-y-0.5 text-[10px] text-slate-500 font-bold uppercase">
                  <p>RUC: 80012345-0</p>
                  <p className="truncate px-2">{storeAddress}</p>
                  <p>TEL: {storePhone}</p>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-3 my-4 grid grid-cols-2 gap-y-1 text-[10px] font-bold">
                <div className="text-slate-400 uppercase">Fecha</div>
                <div className="text-right">{lastSale?.date?.toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-slate-400 uppercase">Nro</div>
                <div className="text-right">{lastSale?.id}</div>
                <div className="text-slate-400 uppercase">Venta</div>
                <div className="text-right uppercase">{lastSale?.saleType === 'credito' ? 'CRÉDITO' : 'CONTADO'}</div>
                <div className="text-slate-400 uppercase">Cliente</div>
                <div className="text-right uppercase truncate">{lastSale?.customerName || customerName}</div>
              </div>
                 {lastSale?.customer?.ruc && (
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase">RUC CLIENTE</span>
                    <span className="text-right">{lastSale?.customer?.ruc}</span>
                  </div>
                )}

              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-black text-[10px] text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="w-1/2">CONCEPTO</span>
                  <span className="w-1/4 text-center">CANT</span>
                  <span className="w-1/4 text-right">TOTAL</span>
                </div>
                {lastSale?.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs leading-tight">
                    <span className="w-1/2 font-bold uppercase">{item.name}</span>
                    <span className="w-1/4 text-center">x{item.quantity}</span>
                    <span className="w-1/4 text-right font-black">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-dashed border-slate-200 dark:border-slate-700 pt-5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">SUBTOTAL</span>
                  <span>{formatCurrency(lastSale?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">IVA (10%)</span>
                  <span>{formatCurrency(lastSale?.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-2 tracking-tighter">
                  <span>TOTAL</span>
                  <span>{formatCurrency(lastSale?.total || 0)}</span>
                </div>
              </div>

              <div className="mt-8 text-center space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pago: {lastSale?.paymentMethod?.toUpperCase()}</p>
                <div className="flex justify-center flex-col items-center gap-1">
                  <div className="w-48 h-10 border-2 border-black/10 dark:border-white/10 flex items-center justify-center p-1 rounded">
                    <Barcode className="w-full h-full opacity-60" />
                  </div>
                  <p className="text-[9px] font-mono text-slate-400">*{lastSale?.id}*</p>
                </div>
                <p className="text-[11px] font-black uppercase border-t border-dashed border-slate-200 dark:border-slate-700 pt-5 text-slate-500">
                  ¡GRACIAS POR SU PREFERENCIA!
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-slate-900 grid grid-cols-2 gap-3 border-t print:hidden">
            <Button 
              variant="outline" 
              className="h-12 font-bold border-2 hover:bg-slate-100 dark:hover:bg-slate-800" 
              onClick={() => {
                setIsReceiptOpen(false);
                setAmountReceived('');
              }}
            >
              <X className="w-4 h-4 mr-2" />
              CERRAR
            </Button>
            <Button 
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20" 
              onClick={() => {
                const el = document.getElementById('receipt-content');
                if (!el) return;
                const printWindow = window.open('', '_blank', 'width=400,height=700');
                if (!printWindow) { toast.error('Permite ventanas emergentes para imprimir'); return; }
                printWindow.document.write(`<!DOCTYPE html><html><head><title>Comprobante</title><style>
                  @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; } }
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; padding: 15px; max-width: 300px; margin: 0 auto; line-height: 1.2; }
                  .text-center { text-align: center; } .font-bold { font-weight: bold; } .font-black { font-weight: 900; }
                  .text-xl { font-size: 18px; } .text-xs { font-size: 11px; } .text-\\[10px\\] { font-size: 10px; } .text-\\[9px\\] { font-size: 9px; } .text-\\[11px\\] { font-size: 11px; }
                  .uppercase { text-transform: uppercase; } .mb-1 { margin-bottom: 4px; } .mb-4 { margin-bottom: 12px; } .mb-5 { margin-bottom: 16px; } .mb-6 { margin-bottom: 20px; }
                  .mt-8 { margin-top: 25px; } .pt-2 { padding-top: 8px; } .pt-5 { padding-top: 15px; } .pb-4 { padding-bottom: 12px; }
                  .border-dashed { border-style: dashed; } .border-b { border-bottom: 1px dashed #000; }
                  .border-t { border-top: 1px dashed #000; } .my-5 { margin-top: 15px; margin-bottom: 15px; }
                  .flex { display: flex; } .justify-between { justify-content: space-between; }
                  .space-y-1 > * + * { margin-top: 4px; } .space-y-2 > * + * { margin-top: 8px; } .space-y-3 > * + * { margin-top: 10px; }
                  .text-slate-400 { color: #000; } .tracking-tighter { letter-spacing: -0.05em; } .tracking-widest { letter-spacing: 0.1em; }
                  .w-1\\/2 { width: 50%; } .w-1\\/4 { width: 25%; } .text-right { text-align: right; }
                  svg, .print\\:hidden, button { display: none !important; }
                  .barcode { width: 140px; height: 30px; margin: 0 auto; opacity: 1; border: 1px solid #000; position: relative; }
                  .barcode::after { content: '|| ||| || ||| || ||'; display: flex; align-items: center; justify-content: center; height: 100%; font-size: 20px; font-family: sans-serif; }
                </style></head><body>`);
                printWindow.document.write(el.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              IMPRIMIR TICKET
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Customer Modal ═══ */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Nombre del Cliente</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre del cliente o CI..."
                  className="pl-10 h-12 font-bold"
                  value={customerName === 'Consumidor Final' ? '' : customerName}
                  onChange={(e) => setCustomerName(e.target.value || 'Consumidor Final')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Rápido</Label>
              <button
                onClick={() => { setCustomerName('Consumidor Final'); setIsCustomerModalOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all text-left w-full group"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Consumidor Final</p>
                  <p className="text-xs text-muted-foreground">Venta rápida sin datos</p>
                </div>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 font-black bg-blue-600 hover:bg-blue-700" onClick={() => setIsCustomerModalOpen(false)}>
              ASIGNAR A VENTA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
