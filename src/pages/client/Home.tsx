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
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VirtualCardCompact } from '@/components/client/VirtualCard';
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
    <div className="min-h-screen pb-28">
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Greeting */}
        <div>
          <p className="text-xs text-muted-foreground">Bienvenido,</p>
          <h1 className="font-semibold">{user?.firstName || 'Usuario'}</h1>
        </div>

        {/* Virtual Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <VirtualCardCompact
            balance={wallet?.balance || 0}
            onShowQR={() => setShowQR(true)}
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

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Transacciones</h3>
            <Link to="/app/wallet">
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todo
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            {recentTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay transacciones recientes</p>
            )}
            {recentTransactions.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  t.type === 'income'
                    ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  {t.type === 'income' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
                <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.type === 'income' ? '+' : '-'}₲ {t.amount.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Productos Destacados</h3>
            <Link to="/app/tiendas">
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todo
                <ArrowRight className="w-4 h-4 ml-1" />
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
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <Link key={product.id} to={`/app/producto/${product.slug || product.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="premium-card overflow-hidden"
                  >
                    <div className="h-28 bg-muted relative">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-primary font-bold">
                          {formatCurrency(product.price)}
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isInCart(product.id)
                              ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {isInCart(product.id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
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
      </div>

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
