import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  BookOpen, 
  ArrowRight, 
  TrendingUp,
  Star,
  Bell,
  Search
} from 'lucide-react';
import { useAuthStore, useWalletStore, useNotificationStore } from '@/stores';
import { mockProducts, mockCourses, mockOrders } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualCardCompact } from '@/components/client/VirtualCard';
import { QuickActions } from '@/components/client/QuickActions';
import { TransactionList, mockTransactions } from '@/components/client/TransactionList';
import { FinanceChart, CategoryChart } from '@/components/client/FinanceChart';
import { QRPayment } from '@/components/client/QRPayment';

// Chart data
const weeklyData = [
  { name: 'Oct', value: 450000 },
  { name: 'Nov', value: 520000 },
  { name: 'Dec', value: 380000 },
  { name: 'Jan', value: 610000 },
  { name: 'Feb', value: 720000 },
  { name: 'Mar', value: 850000 },
];

const categoryData = [
  { name: 'Transaction', value: 45 },
  { name: 'Food', value: 25 },
  { name: 'Transfer', value: 15 },
  { name: 'Shopping', value: 10 },
  { name: 'Travel', value: 5 },
];

export default function ClientHome() {
  const { user } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
      fetchNotifications(user.id);
    }
  }, [user, fetchWallet, fetchNotifications]);

  const featuredProducts = mockProducts.filter(p => p.isFeatured).slice(0, 4);
  const featuredCourses = mockCourses.filter(c => c.isFeatured).slice(0, 2);
  const userOrders = mockOrders.filter(o => o.buyerId === user?.id).slice(0, 3);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <h1 className="font-semibold">{user?.firstName || 'User'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Virtual Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <VirtualCardCompact 
            balance={wallet?.balance || 8545000}
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
          <TransactionList 
            transactions={mockTransactions}
            title="Transaction"
            showViewAll={true}
          />
        </motion.div>

        {/* Statistics Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FinanceChart 
            data={weeklyData}
            type="area"
            title="Statistics"
          />
        </motion.div>

        {/* Category Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CategoryChart data={categoryData} />
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Transaction History</h3>
            <Link to="/app/wallet">
              <Button variant="ghost" size="sm" className="text-primary">
                See All
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {mockTransactions.slice(0, 3).map((t, i) => (
              <div key={t.id} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                </div>
                <p className={t.type === 'income' ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                  {t.type === 'income' ? '+' : '-'}₲ {t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Featured Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Featured Products</h3>
            <Link to="/app/tienda">
              <Button variant="ghost" size="sm" className="text-primary">
                See All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.map((product, index) => (
              <Link key={product.id} to={`/app/producto/${product.id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="premium-card overflow-hidden"
                >
                  <div className="h-28 bg-muted relative">
                    {product.images[0] ? (
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
                    <p className="text-primary font-bold mt-1">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Featured Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recommended Courses</h3>
            <Link to="/app/cursos">
              <Button variant="ghost" size="sm" className="text-primary">
                See All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {featuredCourses.map((course) => (
              <Link key={course.id} to={`/app/cursos/${course.id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="premium-card p-3 flex gap-3"
                >
                  <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    {course.coverImage ? (
                      <img 
                        src={course.coverImage} 
                        alt={course.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{course.title}</p>
                    <p className="text-sm text-muted-foreground">{course.instructorName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{course.rating}</span>
                    </div>
                    <p className="font-bold text-primary mt-1">{formatCurrency(course.price)}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* QR Payment Modal */}
      <QRPayment 
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        userId={user?.id || 'guest'}
        userName={`${user?.firstName || 'User'} ${user?.lastName || ''}`}
        balance={wallet?.balance}
      />
    </div>
  );
}
