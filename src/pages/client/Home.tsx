import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ShoppingCart,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Check,
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
import { toast } from 'sonner';

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

export default function ClientHome() {
  const { user } = useAuthStore();
  const { wallet, transactions, fetchWallet, fetchTransactions } = useWalletStore();
  const { addItem, isInCart } = useCartStore();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
      fetchTransactions(user.walletId);
    }
  }, [user, fetchWallet, fetchTransactions]);

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

  // Recent transactions for display
  const recentTransactions = transactions.slice(0, 5).map((t: any) => ({
    id: t.id,
    type: t.amount > 0 ? 'income' : 'expense',
    description: t.description,
    amount: Math.abs(t.amount),
    date: new Date(t.createdAt).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' }),
  }));

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

  return (
    <div className="pt-6 pb-28 max-w-lg mx-auto px-4 space-y-8">
      {/* Greeting Section */}
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold mb-1">Bienvenido,</p>
        <h1 className="text-2xl font-black tracking-tight">{user?.firstName || 'Usuario'}</h1>
      </div>

      {/* Virtual Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <VirtualCard
          balance={wallet?.balance || 0}
          cardNumber={user?.virtualCard?.cardNumber || 'OSC-0000-0000'}
          cardHolder={`${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`}
          expiryDate="12/28"
          cvv="***"
          qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <QuickActions />
      </motion.div>

      {/* Transactions Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">Movimientos</h3>
        <Link to="/app/wallet">
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 rounded-full h-8">
            Ver todo
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {recentTransactions.length === 0 && (
          <div className="glass-premium p-8 text-center rounded-[2rem] border border-white/5">
            <p className="text-xs text-muted-foreground/60 font-medium italic">No hay movimientos recientes</p>
          </div>
        )}
        {recentTransactions.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-premium p-4 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all group"
          >
            <div className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg',
              t.type === 'income'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            )}>
              {t.type === 'income' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate uppercase tracking-tight">{t.description}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-widest">{t.date}</p>
            </div>
            <p className={cn(
              'font-black text-sm font-mono',
              t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {t.type === 'income' ? '+' : '-'}₲ {t.amount.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Statistics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FinanceChart
          data={buildMonthlyData(transactions)}
          type="area"
          title="Estadísticas"
        />
      </motion.div>

      {/* Featured Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Products Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">Productos Destacados</h3>
          <Link to="/app/tiendas">
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 rounded-full h-8">
              Explorar
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
        {loadingProducts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay productos disponibles</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <Link key={product.id} to={`/app/producto/${product.slug || product.id}`}>
                <motion.div
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-premium overflow-hidden rounded-[2rem] border border-white/5 shadow-xl group"
                >
                  <div className="h-32 bg-slate-900/50 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">{product.category || 'Oscorp Store'}</p>
                    <p className="text-sm font-bold line-clamp-1 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{product.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-blue-500 font-black font-mono text-sm tracking-tighter">
                        {formatCurrency(product.price)}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg',
                          isInCart(product.id)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/5 text-muted-foreground hover:bg-blue-600 hover:text-white'
                        )}
                      >
                        {isInCart(product.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* QR Payment Modal */}
      <QRPayment
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        userId={user?.id || 'guest'}
        userName={`${user?.firstName || 'Usuario'} ${user?.lastName || ''}`}
        balance={wallet?.balance}
      />
    </div>
  );
}
