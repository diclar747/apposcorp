import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
    Banknote, Wallet, Receipt, X, Package, Barcode,
    Printer, History, Keyboard, User as UserIcon, Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/stores';
import { productsApi, walletApi } from '@/lib/api';
import { generateQRValue } from '@/lib/qr';
import { Loader2, CheckCircle } from 'lucide-react';
import { mockUsers } from '@/data/mockData';
import { formatCurrency, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export default function SellerPOS() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const sellerProfile = user?.sellerProfile;

    // Products from real API
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

    // Fetch products from real API (same source as Products page)
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

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Store info from sellerProfile
    const storeName = sellerProfile?.storeName || 'Mi Tienda';
    const storeAddress = sellerProfile?.address || '';
    const storePhone = sellerProfile?.phone || '';

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    // Barcode detection logic
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

    // Poll for wallet payment when showing QR in checkout
    useEffect(() => {
        if (!isCheckoutOpen || paymentMethod !== 'wallet' || cart.length === 0) {
            // Cleanup
            if (walletPollingRef.current) {
                clearInterval(walletPollingRef.current);
                walletPollingRef.current = null;
            }
            initialBalanceRef.current = null;
            setWalletPaymentDetected(false);
            return;
        }

        // Capture initial balance when QR is shown
        const startPolling = async () => {
            try {
                const wallet = await walletApi.getWallet();
                initialBalanceRef.current = wallet.balance;
            } catch {
                initialBalanceRef.current = null;
            }

            // Poll every 3 seconds for incoming transfer
            walletPollingRef.current = setInterval(async () => {
                try {
                    const wallet = await walletApi.getWallet();
                    const currentBalance = wallet.balance;
                    const initialBalance = initialBalanceRef.current;

                    if (initialBalance !== null && currentBalance > initialBalance) {
                        // Payment received! Balance increased
                        setWalletPaymentDetected(true);

                        // Stop polling
                        if (walletPollingRef.current) {
                            clearInterval(walletPollingRef.current);
                            walletPollingRef.current = null;
                        }

                        // Auto-complete the sale after a brief visual confirmation
                        setTimeout(() => {
                            const saleData = {
                                id: `V-${Math.floor(1000 + Math.random() * 9000)}`,
                                date: new Date(),
                                items: [...cart],
                                subtotal,
                                tax,
                                total,
                                paymentMethod: 'wallet' as const,
                                customerName
                            };
                            setLastSale(saleData);
                            setSalesHistory(prev => [saleData, ...prev].slice(0, 10));
                            setIsCheckoutOpen(false);
                            setCart([]);
                            setIsReceiptOpen(true);
                            setCustomerName('Consumidor Final');
                            setWalletPaymentDetected(false);
                            toast.success('¡Pago con Wallet recibido!');
                        }, 1500);
                    }
                } catch {
                    // Silently ignore polling errors
                }
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
    const tax = subtotal * 0.10; // IVA 10%
    const total = subtotal + tax;

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.images?.[0] || ''
            }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const handleCheckout = () => {
        setProcessing(true);
        setTimeout(() => {
            const saleData = {
                id: `V-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date(),
                items: [...cart],
                subtotal,
                tax,
                total,
                paymentMethod,
                customerName
            };
            setLastSale(saleData);
            setSalesHistory(prev => [saleData, ...prev].slice(0, 10));
            setProcessing(false);
            setIsCheckoutOpen(false);
            setCart([]);
            setIsReceiptOpen(true);
            setCustomerName('Consumidor Final');
            toast.success('Venta realizada con éxito');
        }, 1000);
    };

    if (!sellerProfile) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center p-8 bg-white rounded-3xl border border-gray-200 shadow-xl max-w-md">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-2 uppercase">Tienda no configurada</h2>
                    <p className="text-gray-500 mb-8">Debes completar el perfil de tu tienda para poder utilizar el sistema de Punto de Venta.</p>
                    <Button className="w-full h-12 bg-slate-900 font-bold" onClick={() => navigate('/vendedor/tienda')}>
                        CONFIGURAR TIENDA
                    </Button>
                </div>
            </div>
        );
    }

    if (isTrialExpired) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center p-12 bg-white rounded-[2rem] border-2 border-red-50 shadow-2xl max-w-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                    <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100">
                        <X className="w-12 h-12 text-red-500" />
                    </div>
                    <Badge className="bg-red-100 text-red-600 mb-4 hover:bg-red-100 border-0 font-black">DEMO FINALIZADA</Badge>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Periodo de Prueba Agotado</h2>
                    <p className="text-slate-500 mb-10 text-lg leading-relaxed">
                        Tu acceso gratuito de 3 días ha expirado. Para continuar utilizando el sistema de Punto de Venta Industrial y registrar tus ventas, por favor adquiere una suscripción.
                    </p>
                    <div className="space-y-4">
                        <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-xl shadow-blue-500/20">
                            ADQUIRIR SUSCRIPCIÓN AHORA
                        </Button>
                        <Button variant="ghost" className="w-full text-slate-400 font-bold">
                            HABLAR CON SOPORTE
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden">
            {/* Left Side - Products & History */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Punto de Venta
                            {!sellerProfile?.planActive && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black uppercase tracking-tighter">
                                    Trial: {daysLeft} días restantes
                                </Badge>
                            )}
                        </h1>
                        <p className="text-gray-500">{storeName} - Caja Principal</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-gray-200"
                            onClick={() => setIsCustomerModalOpen(true)}
                        >
                            <UserIcon className="w-4 h-4 mr-2 text-blue-600" />
                            {customerName}
                        </Button>
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Escaneé SKU o busque... (Esc)"
                                className="pl-9 bg-white border-gray-200 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <ScrollArea className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                        {isLoadingProducts ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center text-gray-400">
                                    <Package className="w-16 h-16 mx-auto mb-4 opacity-10 animate-pulse" />
                                    <p className="text-sm font-medium">Cargando productos...</p>
                                </div>
                            </div>
                        ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layoutId={product.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => addToCart(product)}
                                    className="group cursor-pointer bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-square rounded-lg bg-gray-100 mb-3 overflow-hidden relative">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-blue-600 p-1.5 rounded-full shadow-lg text-white">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 h-10">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="font-bold text-blue-600">{formatCurrency(product.price)}</p>
                                        <p className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase font-mono">{product.sku}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full py-20 text-center text-gray-400">
                                    <Barcode className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    {products.length === 0
                                        ? 'No tienes productos registrados. Agrega productos desde la sección Productos.'
                                        : 'No se encontraron productos'}
                                </div>
                            )}
                        </div>
                        )}
                    </ScrollArea>

                    {/* Sales History Area */}
                    <div className="h-56 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm shrink-0">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 tracking-wider uppercase">
                                <History className="w-3.5 h-3.5" />
                                Historial de Sesión
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5">Últimos 10 movimientos</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 text-gray-500 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Cliente</th>
                                        <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-right">Monto</th>
                                        <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-center">Pago</th>
                                        <th className="px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-right">Ticket</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {salesHistory.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-2 font-mono text-xs text-blue-600 font-medium">{sale.id}</td>
                                            <td className="px-4 py-2 text-gray-700">{sale.customerName}</td>
                                            <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(sale.total)}</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                    {sale.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    onClick={() => { setLastSale(sale); setIsReceiptOpen(true); }}
                                                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {salesHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-400 italic text-xs">
                                                No hay ventas registradas en esta sesión
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </ScrollArea>
                    </div>
                </div>
            </div>

            {/* Right Side - Cart */}
            <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 text-slate-900">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        <h2 className="font-bold uppercase tracking-wider text-sm">Resumen de Venta</h2>
                    </div>
                    <Badge className="bg-blue-600">
                        {cart.length} ITEMS
                    </Badge>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex gap-3 bg-white p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors shadow-sm"
                                >
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-50 border border-gray-100" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 line-clamp-2 h-8">{item.name}</p>
                                        <p className="text-xs text-blue-600 font-bold mt-1">{formatCurrency(item.price)}</p>
                                    </div>
                                    <div className="flex flex-col items-end justify-between">
                                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 hover:bg-white rounded shadow-sm transition-all"
                                            >
                                                <Minus className="w-3 h-3 text-gray-600" />
                                            </button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 hover:bg-white rounded shadow-sm transition-all"
                                            >
                                                <Plus className="w-3 h-3 text-gray-600" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {cart.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                    <Package className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="text-sm font-medium">Carrito Vacío</p>
                                <p className="text-xs mt-1">Escanee productos para comenzar</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Total Area */}
                <div className="p-6 bg-slate-900 text-white space-y-4 shadow-2xl">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-widest">
                            <span>IVA (10%)</span>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black pt-4 border-t border-slate-800 mt-2">
                            <span className="text-sm font-bold self-center text-blue-400 uppercase tracking-tighter">TOTAL</span>
                            <span className="text-blue-400">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-900/20 active:scale-95 transition-all uppercase"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        PAGAR AHORA (F2)
                    </Button>
                </div>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Finalizar Venta</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Monto a Cobrar</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(total)}</p>
                        </div>

                        <Tabs defaultValue="cash" onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-12">
                                <TabsTrigger value="cash" className="gap-2">
                                    <Banknote className="w-4 h-4" />
                                    Efectivo
                                </TabsTrigger>
                                <TabsTrigger value="card" className="gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Tarjeta
                                </TabsTrigger>
                                <TabsTrigger value="wallet" className="gap-2">
                                    <Wallet className="w-4 h-4" />
                                    Wallet
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="cash" className="mt-6">
                                <div className="space-y-4">
                                    <Label className="text-xs font-bold uppercase">Monto Recibido</Label>
                                    <Input type="number" placeholder="0" className="h-12 text-xl font-bold border-2 focus-visible:ring-blue-600" />
                                    <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100">
                                        <span className="text-sm font-bold text-blue-700">Cambio a devolver:</span>
                                        <span className="text-lg font-black text-blue-800">₲ 0</span>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="card" className="mt-6">
                                <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 text-center space-y-3">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                            <CreditCard className="w-6 h-6 text-blue-600" />
                                        </motion.div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600">Esperando comunicación con terminal...</p>
                                </div>
                            </TabsContent>
                            <TabsContent value="wallet" className="mt-6">
                                {walletPaymentDetected ? (
                                    <div className="p-8 border-2 border-green-200 rounded-2xl bg-green-50 text-center space-y-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle className="w-10 h-10 text-green-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-black text-green-800">¡Pago Recibido!</p>
                                            <p className="text-sm text-green-600">Generando comprobante...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 border-2 border-dashed rounded-2xl bg-blue-50/50 text-center space-y-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                                            <QRCodeSVG
                                                value={generateQRValue(user?.id || '', storeName, total)}
                                                size={200}
                                                level="L"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-slate-700">Escanee el código QR del cliente</p>
                                            <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>Esperando confirmación de pago...</span>
                                            </div>
                                            <div className="flex justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const data = generateQRValue(user?.id || '', storeName, total);
                                                        navigator.clipboard.writeText(data);
                                                        toast.success("Código copiado al portapapeles");
                                                    }}
                                                    className="gap-2 text-xs"
                                                >
                                                    <Copy className="w-3 h-3" /> Copiar Código
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                        <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="font-bold text-slate-400">CANCELAR</Button>
                        <Button onClick={handleCheckout} disabled={processing} className="bg-green-600 hover:bg-green-700 font-bold px-8">
                            {processing ? 'PROCESANDO...' : 'CONFIRMAR PAGO'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white border-0 shadow-2xl">
                    <div className="p-8 font-mono text-sm text-slate-800 bg-white" id="receipt-content">
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Receipt className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">{storeName}</h2>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Powered by Oscorp Systems</p>
                            <div className="border-b border-dashed border-slate-200 my-6" />
                            <p className="text-xs font-bold">RUC: 80012345-0</p>
                            <p className="text-xs">{storeAddress}</p>
                            <p className="text-xs">Tel: {storePhone}</p>
                        </div>

                        <div className="space-y-1 mb-6 text-xs border-b border-dashed border-slate-200 pb-4">
                            <div className="flex justify-between">
                                <span className="text-slate-400">FECHA:</span>
                                <span>{lastSale?.date?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">COMPROBANTE:</span>
                                <span className="font-bold">{lastSale?.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">CLIENTE:</span>
                                <span className="font-bold uppercase">{customerName}</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between font-black text-[10px] text-slate-400 uppercase tracking-widest pb-2 border-b">
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

                        <div className="space-y-2 border-t border-dashed border-slate-200 pt-6">
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

                        <div className="mt-10 text-center space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pago: {lastSale?.paymentMethod?.toUpperCase()}</p>
                            <div className="flex justify-center flex-col items-center gap-2">
                                <Barcode className="w-48 h-10 opacity-40" />
                                <p className="text-[9px] font-mono text-slate-400">*{lastSale?.id}*</p>
                            </div>
                            <p className="text-[11px] font-black uppercase text-slate-900 border-t border-dashed border-slate-200 pt-6">
                                ¡GRACIAS POR SU PREFERENCIA!
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 flex gap-3 border-t">
                        <Button variant="outline" className="flex-1 font-bold" onClick={() => setIsReceiptOpen(false)}>
                            CERRAR
                        </Button>
                        <Button className="flex-1 bg-slate-900 font-bold group" onClick={() => {
                            toast.info("Simulando impresión...");
                            setTimeout(() => setIsReceiptOpen(false), 1000);
                        }}>
                            <Printer className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                            IMPRIMIR
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Customer Selection Modal */}
            <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Búsqueda de Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Identificación / Nombre</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Nombre del cliente o CI..."
                                    className="pl-10 h-12 font-bold"
                                    value={customerName === 'Consumidor Final' ? '' : customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Escriba para ventas sin registro previo.</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                <UserIcon className="w-3 h-3" />
                                Clientes Frecuentes
                            </Label>
                            <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto pr-2">
                                <button
                                    onClick={() => { setCustomerName('Consumidor Final'); setIsCustomerModalOpen(false); }}
                                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Consumidor Final</p>
                                        <p className="text-xs text-slate-400">Venta rápida sin datos</p>
                                    </div>
                                </button>
                                {mockUsers.filter(u => u.role === 'client').slice(0, 5).map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            setCustomerName(`${u.firstName} ${u.lastName}`);
                                            setIsCustomerModalOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm border-2 border-white shadow-sm">
                                            {u.firstName[0]}{u.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{u.firstName} {u.lastName}</p>
                                            <p className="text-xs text-slate-500 font-mono italic">{u.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-12 font-black bg-blue-600 hover:bg-blue-700" onClick={() => setIsCustomerModalOpen(false)}>
                            ASIGNAR A VENTA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Keyboard Shortcuts Hint */}
            <div className="fixed bottom-6 left-[280px] flex items-center gap-4 text-[10px] text-white/90 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl z-50">
                <div className="flex items-center gap-1.5"><Keyboard className="w-3 h-3 text-blue-400" /><span className="font-black text-blue-400">F2</span> COBRAR</div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5"><Keyboard className="w-3 h-3 text-blue-400" /><span className="font-black text-blue-400">ESC</span> BUSCAR / LIMPIAR</div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5"><Barcode className="w-3 h-3 text-green-400" /> <span className="font-black text-green-400 uppercase">Escáner Activo</span></div>
            </div>
        </div>
    );
}
