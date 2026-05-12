import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  ShoppingCart,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Package,
  GraduationCap,
  Clock,
  Sparkles,
  ChevronRight,
  CreditCard,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore, useWalletStore, useCartStore } from '@/stores';
import { productsApi } from '@/lib/api';
import { generateQRValue } from '@/lib/qr';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VirtualCard } from '@/components/client/VirtualCard';
import { QuickActions } from '@/components/client/QuickActions';
import { FinanceChart } from '@/components/client/FinanceChart';
import { QRPayment } from '@/components/client/QRPayment';
import { useClientStats } from '@/hooks/useClientStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export default function ClientHome() {
  const { user, hasRole, setActiveRole, addRole, isLoading: isAuthLoading } = useAuthStore();
  const { transactions, fetchTransactions } = useWalletStore();
  const { data: stats, isLoading: isLoadingStats, isError } = useClientStats();
  const { addItem, isInCart } = useCartStore();
  const navigate = useNavigate();
  
  const [showQR, setShowQR] = useState(false);
  const [showIngenioAlert, setShowIngenioAlert] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions(user.walletId || '');
    }
  }, [user, fetchTransactions]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productsApi.getAll();
        setProducts(data.slice(0, 4));
      } catch {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart(product.id)) {
      navigate('/app/carrito');
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleIngenioNavigation = async (label?: string) => {
    if (hasRole(['ingenio'])) {
      setActiveRole('ingenio');
      // Usamos window.location.href para asegurar un refresco completo del contexto
      window.location.href = '/ingenio';
      return;
    }
    setShowIngenioAlert(true);
  };

  const handleRegisterIngenio = async () => {
    const success = await addRole('ingenio');
    if (success) {
      toast.success('¡Registro exitoso! Bienvenido a Ingenio Millonario.');
      setShowIngenioAlert(false);
      setActiveRole('ingenio');
      window.location.href = '/ingenio';
    }
  };

  // Build monthly chart data from real transactions
  const buildMonthlyData = (txs: any[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const data: { name: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      let income = 0;
      let expense = 0;

      txs.forEach((t: any) => {
        const txDate = new Date(t.createdAt);
        if (txDate.getMonth() === monthIdx && txDate.getFullYear() === year) {
          if (t.amount > 0) income += t.amount;
          else expense += Math.abs(t.amount);
        }
      });

      data.push({ name: months[monthIdx], income, expense });
    }
    return data;
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-black">Error de conexión</h2>
        <p className="text-muted-foreground text-sm">No pudimos sincronizar tus datos reales.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">Reintentar</Button>
      </div>
    );
  }

  const LoadingSkeleton = () => (
    <div className="pt-6 pb-28 max-w-lg mx-auto px-4 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-56 w-full rounded-[2.5rem]" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
      </div>
      <Skeleton className="h-48 w-full rounded-[2rem]" />
    </div>
  );

  if (isLoadingStats) return <LoadingSkeleton />;

  return (
    <div className="pt-6 pb-28 max-w-lg mx-auto px-4 space-y-8">
      {/* Greeting Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.3em] font-black mb-1">Tu Resumen de hoy</p>
          <h1 className="text-2xl font-black tracking-tight tracking-tighter">¡Hola, {user?.firstName}!</h1>
        </div>
      </div>

      {/* Virtual Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <VirtualCard
          balance={stats?.finances?.balance || 0}
          cardNumber={user?.virtualCard?.cardNumber || 'OSC-0000-0000'}
          cardHolder={`${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`}
          expiryDate="12/28"
          cvv="***"
          qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
        />
      </motion.div>

      {/* Quick Actions */}
      <QuickActions onAction={handleIngenioNavigation} />

      {/* Orders & Credits Summary */}
      <section className="grid grid-cols-2 gap-4">
        <div className="glass-premium p-5 rounded-[2rem] border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Tus Pedidos</span>
          </div>
          {stats?.orders?.lastOrder ? (
            <div>
              <p className="text-xs font-black truncate">{stats.orders.lastOrder.orderNumber}</p>
              <Badge variant="outline" className="text-[8px] h-4 mt-1 bg-emerald-50 border-emerald-100 text-emerald-700 uppercase font-black">
                {stats.orders.lastOrder.status}
              </Badge>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic font-medium">Sin pedidos aún</p>
          )}
        </div>

        <div className="glass-premium p-5 rounded-[2rem] border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Créditos</span>
          </div>
          {stats?.finances?.lastCredit ? (
            <div>
              <p className="text-xs font-black truncate">{formatCurrency(stats.finances.lastCredit.amount)}</p>
              <Badge variant="outline" className="text-[8px] h-4 mt-1 bg-blue-50 border-blue-100 text-blue-700 uppercase font-black">
                {stats.finances.lastCredit.status}
              </Badge>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic font-medium">Sin créditos activos</p>
          )}
        </div>
      </section>

      {/* Transactions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">Movimientos Recientes</h3>
          <Link to="/app/wallet">
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 h-8">Ver todo</Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="glass-premium p-10 text-center rounded-[2.5rem] border border-dashed border-white/10">
              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest italic">Nada por aquí aún</p>
            </div>
          ) : (
            transactions.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-premium p-4 rounded-[1.8rem] border border-white/5 flex items-center gap-4 group"
              >
                <div className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg',
                  t.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                  t.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                )}>
                  {t.status === 'failed' ? <XCircle className="w-5 h-5" /> : t.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[11px] truncate uppercase tracking-tight">{t.description}</p>
                    {t.status === 'pending' && (
                      <Badge variant="secondary" className="text-[8px] h-4 uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20 px-1 py-0">
                        PENDIENTE
                      </Badge>
                    )}
                    {t.status === 'failed' && (
                      <Badge variant="destructive" className="text-[8px] h-4 uppercase tracking-widest bg-rose-500/10 text-rose-500 border-rose-500/20 px-1 py-0">
                        RECHAZADO
                      </Badge>
                    )}
                  </div>
                  <p className="text-[8px] text-muted-foreground/60 font-black uppercase tracking-widest mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('es-PY')}
                  </p>
                </div>
                <p className={cn(
                  'font-black text-xs font-mono',
                  t.status === 'failed' ? 'text-muted-foreground/40 line-through' :
                  t.amount > 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">Para Ti</h3>
          <Link to="/app/tiendas">
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 h-8">
              Tiendas <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
        
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-4">
             <Skeleton className="h-48 rounded-3xl" />
             <Skeleton className="h-48 rounded-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/app/producto/${product.slug || product.id}`}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="glass-premium overflow-hidden rounded-[1.8rem] border border-white/5 group shadow-xl"
                >
                  <div className="h-28 bg-slate-900/50 relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ShoppingBag className="w-8 h-8" /></div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 line-clamp-1">{product.category}</p>
                    <p className="text-[11px] font-bold line-clamp-1 tracking-tight">{product.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-indigo-500 font-extrabold text-[11px]">{formatCurrency(product.price)}</span>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5">
                           <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                        </div>
                      </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* QR Payment Modal */}
      <QRPayment
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        userId={user?.id || 'guest'}
        userName={`${user?.firstName || 'Usuario'} ${user?.lastName || ''}`}
        balance={stats?.finances?.balance}
      />

      <AlertDialog open={showIngenioAlert} onOpenChange={setShowIngenioAlert}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full mx-auto rounded-xl sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quieres registrarte en Ingenio Millonario?</AlertDialogTitle>
            <AlertDialogDescription>
              Ingenio Millonario es una academia exclusiva donde aprenderás sobre finanzas, e-commerce y desarrollo personal con profesores de alto nivel.
              <br /><br />
              Al aceptar, se activará tu acceso a Ingenio Millonario utilizando tu misma cuenta de Oscorp, sin necesidad de crear una nueva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAuthLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleRegisterIngenio(); }} disabled={isAuthLoading}>
              {isAuthLoading ? 'Registrando...' : 'Sí, registrarme'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
