import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, QrCode, ChevronRight, MoreHorizontal, Eye, EyeOff
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';
import { generateQRValue } from '@/lib/qr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualCard } from '@/components/client/VirtualCard';
import { FinanceChart } from '@/components/client/FinanceChart';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { AccessDenied } from '@/components/ingenio/AccessDenied';

const quickActions = [
  { icon: ArrowUpRight, label: 'Enviar', href: '/ingenio/wallet/transferir', color: 'bg-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-500/20' },
  { icon: ArrowDownLeft, label: 'Recibir', href: '/ingenio/tarjeta', color: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20' },
  { icon: Wallet, label: 'Préstamos', href: '/ingenio/creditos', color: 'bg-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-500/20' },
  { icon: QrCode, label: 'Cargar', href: '/ingenio/escanear', color: 'bg-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-500/20' },
];

export default function IngenioWallet() {
  const { user } = useAuthStore();
  const { wallet, transactions, fetchWallet, fetchTransactions } = useWalletStore();
  const { status } = useIngenioSubscription();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

  if (status !== 'ACTIVE') {
    return <AccessDenied status={status} />;
  }

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
      fetchTransactions(user.walletId);
    }
  }, [user, fetchWallet, fetchTransactions]);

  const recentTransactions = transactions.slice(0, 10).map(t => {
    const isIncome = t.amount > 0;
    return {
      id: t.id,
      type: isIncome ? 'income' : 'expense',
      category: 'wallet',
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

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="pt-2 pb-20 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Billetera Estudiantil</h1>
          <p className="text-sm text-slate-500 font-medium">Gestiona el pago de tus cursos e inversiones</p>
        </div>
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setShowBalance(!showBalance)}>
          {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </div>

      <div className="relative">
        <VirtualCard
          balance={showBalance ? (wallet?.balance || 0) : 0}
          cardNumber={user?.virtualCard?.cardNumber || 'OSC-0000-0000'}
          cardHolder={`${user?.firstName || 'ESTUDIANTE'} ${user?.lastName || 'INGENIO'}`}
          expiryDate="12/30"
          cvv="***"
          qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1 font-bold">Ingresos</p>
          <p className="text-xl font-bold text-emerald-500 tracking-tight">+₲ {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1 font-bold">Gastos / Compras</p>
          <p className="text-xl font-bold text-rose-500 tracking-tight">-₲ {totalExpense.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={action.label} to={action.href}>
              <motion.div whileHover={{y:-2}} className="flex flex-col items-center gap-2 group">
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md', action.bgColor)}>
                  <action.icon className={cn('w-6 h-6', action.color.replace('bg-', 'text-').replace('500', '600'))} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <FinanceChart transactions={transactions} type="area" title="Evolución de mi Saldo" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-900 dark:text-white">Últimos Movimientos</h2>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            {[{ value: 'all', label: 'Todo' }, { value: 'income', label: 'Ingresos' }, { value: 'expense', label: 'Gastos' }].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={cn('px-4 py-1.5 text-xs font-bold rounded-full transition-all', activeTab === tab.value ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {filteredTransactions.map((transaction, index) => (
              <motion.div key={transaction.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-all group"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', transaction.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500')}>
                  {transaction.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{transaction.description}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{transaction.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('font-bold text-sm', transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                    {transaction.type === 'income' ? '+' : '-'} ₲{transaction.amount.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <MoreHorizontal className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No hay transacciones recientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
