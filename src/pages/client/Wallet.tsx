import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';
import { generateQRValue } from '@/lib/qr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualCard } from '@/components/client/VirtualCard';
import { FinanceChart } from '@/components/client/FinanceChart';

const quickActions = [
  { icon: ArrowUpRight, label: 'Enviar', href: '/app/wallet/transferir', color: 'bg-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
  { icon: ArrowDownLeft, label: 'Recibir', href: '/app/tarjeta', color: 'bg-green-500', bgColor: 'bg-green-100 dark:bg-green-500/20' },
  { icon: Wallet, label: 'Préstamos', href: '/app/creditos', color: 'bg-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-500/20' },
  { icon: QrCode, label: 'Cargar', href: '/app/escanear', color: 'bg-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-500/20' },
];

export default function ClientWallet() {
  const { user } = useAuthStore();
  const { wallet, transactions, fetchWallet, fetchTransactions } = useWalletStore();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
      fetchTransactions(user.walletId);
    }
  }, [user, fetchWallet, fetchTransactions]);

  // Transform transactions for display
  const recentTransactions = transactions.slice(0, 10).map(t => {
    const isIncome = t.amount > 0;
    const categoryMap: Record<string, string> = {
      purchase: 'store',
      sale: 'store',
      deposit: 'wallet',
      withdrawal: 'wallet',
      transfer_in: 'wallet',
      transfer_out: 'wallet',
    };
    return {
      id: t.id,
      type: isIncome ? 'income' : 'expense',
      category: categoryMap[t.type] || 'wallet',
      amount: Math.abs(t.amount),
      description: t.description,
      date: new Date(t.createdAt).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      status: t.status as 'completed' | 'pending' | 'failed',
    };
  });

  const filteredTransactions = recentTransactions.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  // Calculate stats
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mi Billetera</p>
            <h1 className="text-2xl font-bold">Billetera</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Virtual Card */}
      <div className="px-4">
        <VirtualCard
          balance={showBalance ? (wallet?.balance || 0) : 0}
          cardNumber={user?.virtualCard?.cardNumber || 'OSC000000'}
          cardHolder={`${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`}
          expiryDate="12/28"
          cvv="***"
          qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
        />
      </div>

      {/* Quick Stats */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="premium-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
          <p className="text-lg font-bold text-emerald-500">+₲ {totalIncome.toLocaleString()}</p>
        </div>
        <div className="premium-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Egresos</p>
          <p className="text-lg font-bold text-rose-500">-₲ {totalExpense.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="premium-card p-4">
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.label} to={action.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
                    action.bgColor
                  )}>
                    <action.icon className={cn('w-6 h-6', action.color.replace('bg-', 'text-').replace('500', '600'))} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Finance Chart */}
      <div className="px-4">
        <FinanceChart
          transactions={transactions}
          type="area"
          title="Estadísticas"
        />
      </div>

      {/* Transactions */}
      <div className="px-4">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Movimientos</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'income', label: 'Ingresos' },
              { value: 'expense', label: 'Egresos' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  activeTab === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                className="transaction-item group cursor-pointer"
              >
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                  transaction.type === 'income'
                    ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                )}>
                  {transaction.type === 'income' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{transaction.description}</p>
                    {transaction.status === 'pending' && (
                      <Badge variant="secondary" className="text-[10px]">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{transaction.date}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    'font-semibold text-sm',
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {transaction.type === 'income' ? '+' : '-'} ₲ {transaction.amount.toLocaleString()}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <MoreHorizontal className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No hay transacciones</p>
          </div>
        )}

        {/* View All */}
        <Link to="/app/wallet">
          <Button variant="ghost" className="w-full mt-4 text-primary">
            Ver historial completo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* My Card Link */}
      <div className="px-4">
        <Link to="/app/tarjeta">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="premium-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Mi Tarjeta QR</p>
                <p className="text-sm text-muted-foreground">Recibe pagos instantáneos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}

