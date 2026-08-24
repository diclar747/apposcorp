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
  EyeOff,
  XCircle
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';
import { generateQRValue } from '@/lib/qr';
import { walletApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualCard } from '@/components/client/VirtualCard';
import { FinanceChart } from '@/components/client/FinanceChart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Calendar, Hash, Tag, Info, X } from 'lucide-react';

const quickActions = [
  { icon: ArrowUpRight, label: 'Enviar', href: '/app/wallet/transferir', color: 'bg-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-500/20' },
  { icon: ArrowDownLeft, label: 'Recibir', href: '/app/tarjeta', color: 'bg-green-500', bgColor: 'bg-green-100 dark:bg-green-500/20' },
  { icon: Wallet, label: 'Préstamos', href: '/app/creditos', color: 'bg-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-500/20' },
  { icon: QrCode, label: 'Cargar', href: '/app/wallet/recargar', color: 'bg-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-500/20' },
];

export default function ClientWallet() {
  const { user } = useAuthStore();
  const { wallet, transactions, fetchWallet, fetchTransactions } = useWalletStore();
  const [showBalance, setShowBalance] = useState(() => {
    const saved = localStorage.getItem('oscorp_show_balance');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    localStorage.setItem('oscorp_show_balance', JSON.stringify(showBalance));
  }, [showBalance]);
  const [showAll, setShowAll] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
      fetchTransactions(user.walletId);
    }
  }, [user, fetchWallet, fetchTransactions]);

  const handleCancelTransaction = async () => {
    const raw = selectedTransaction?.raw;
    if (!raw) return;

    try {
      setCanceling(true);
      if (raw.type === 'deposit') {
        await walletApi.cancelDeposit(raw.id);
      } else if (raw.type === 'withdrawal') {
        await walletApi.cancelWithdrawal(raw.id);
      } else {
        return;
      }
      toast.success('Movimiento cancelado');
      setSelectedTransaction(null);
      if (user) {
        fetchWallet(user.id);
        fetchTransactions(user.walletId);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar el movimiento');
    } finally {
      setCanceling(false);
    }
  };

  // Transform transactions for display
  const displayTransactions = (showAll ? transactions : transactions.slice(0, 10)).map(t => {
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
      raw: t // Keep original for details
    };
  });

  const filteredTransactions = displayTransactions.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  // Calculate stats - ONLY include completed transactions
  const totalIncome = transactions
    .filter(t => t.amount > 0 && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.amount < 0 && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="pt-6 pb-20 space-y-6 max-w-lg mx-auto px-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight">Billetera</h1>
          <p className="text-sm text-muted-foreground/60 font-medium italic">Oscorp Premium Digital</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10"
          onClick={() => setShowBalance(!showBalance)}
        >
          {showBalance ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
        </Button>
      </div>

      <div className="flex flex-col mb-2">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-bold mb-1">Balance Disponible</p>
        <p className="text-3xl font-black tracking-tighter">
          {showBalance ? (wallet ? formatCurrency(wallet.balance) : '₲ 0') : '*********'}
        </p>
      </div>

      {/* Virtual Card */}
      <div className="relative">
        <VirtualCard
          balance={showBalance ? (wallet?.balance || 0) : 0}
          cardNumber={user?.virtualCard?.cardNumber || 'OSC-0000-0000'}
          cardHolder={`${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`}
          expiryDate="12/28"
          cvv="***"
          qrValue={generateQRValue(user?.id || '', user?.firstName || 'Usuario')}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-premium p-5 rounded-[2rem] border border-white/5 shadow-xl">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-bold">Ingresos</p>
          <p className="text-lg font-black text-emerald-500 font-mono tracking-tight">+₲ {totalIncome.toLocaleString()}</p>
        </div>
        <div className="glass-premium p-5 rounded-[2rem] border border-white/5 shadow-xl">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-bold">Egresos</p>
          <p className="text-lg font-black text-rose-500 font-mono tracking-tight">-₲ {totalExpense.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-premium p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={action.label} to={action.href}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-3 group"
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg group-hover:scale-110 group-active:scale-95',
                  action.bgColor,
                  'border border-white/5'
                )}>
                  <action.icon className={cn('w-6 h-6', action.color.replace('bg-', 'text-').replace('500', '600'))} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Finance Chart */}
      <div className="px-4 w-full min-w-0 overflow-hidden">
        <FinanceChart
          transactions={transactions.filter((t) => t.status === 'completed')}
          type="area"
          title="Estadísticas"
        />
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-black text-sm uppercase tracking-[0.2em] text-muted-foreground/50">Movimientos</h2>
          <div className="flex gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            {[
              { value: 'all', label: 'Todo' },
              { value: 'income', label: 'Ingresos' },
              { value: 'expense', label: 'Gastos' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={cn(
                  'px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300',
                  activeTab === tab.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTransaction(transaction)}
                className="glass-premium p-4 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all group cursor-pointer active:scale-[0.98]"
              >
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg',
                  transaction.status === 'failed'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : transaction.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                )}>
                  {transaction.status === 'failed' ? (
                    <XCircle className="w-6 h-6" />
                  ) : transaction.type === 'income' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate uppercase tracking-tight">{transaction.description}</p>
                    {transaction.status === 'pending' && (
                      <Badge variant="secondary" className="text-[8px] uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20">
                        PENDIENTE
                      </Badge>
                    )}
                    {transaction.status === 'failed' && (
                      <Badge variant="destructive" className="text-[8px] uppercase tracking-widest bg-rose-500/10 text-rose-500 border-rose-500/20">
                        RECHAZADO
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-widest">{transaction.date}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    'font-black text-sm font-mono',
                    transaction.status === 'failed'
                      ? 'text-muted-foreground/40 line-through'
                      : transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {transaction.type === 'income' ? '+' : '-'} ₲ {transaction.amount.toLocaleString()}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
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

        <Button 
          variant="ghost" 
          className="w-full mt-4 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground group"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Ver menos' : 'Historial completo'}
          <ChevronRight className={cn("w-4 h-4 ml-2 transition-transform", showAll ? "rotate-90" : "group-hover:translate-x-1")} />
        </Button>
      </div>

      {/* My Card Link */}
      <Link to="/app/tarjeta">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-premium p-5 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-2xl group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <QrCode className="w-7 h-7 text-purple-500" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight">Mi Tarjeta QR</p>
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest mt-1">Recibe cobros al instante</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </motion.div>
      </Link>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-white/10 glass-premium-dark shadow-2xl">
          {selectedTransaction && (
            <div className="relative px-6 pt-8 pb-10 space-y-8">
              <DialogHeader className="mb-0">
                  <DialogTitle className="text-2xl font-black text-center uppercase tracking-tight">Detalle de Operación</DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground font-medium italic">Comprobante Digital Oscorp</DialogDescription>
                </DialogHeader>

                {/* Header Info */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className={cn(
                    "w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl",
                    selectedTransaction.type === 'income' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  )}>
                    {selectedTransaction.type === 'income' ? <ArrowDownLeft className="w-10 h-10" /> : <ArrowUpRight className="w-10 h-10" />}
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-3xl font-black font-mono tracking-tighter",
                      selectedTransaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {selectedTransaction.type === 'income' ? '+' : '-'} ₲ {selectedTransaction.amount.toLocaleString()}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "mt-2 uppercase tracking-widest text-[10px] font-black px-4 py-1 rounded-full",
                        selectedTransaction.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        selectedTransaction.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}
                    >
                      {selectedTransaction.status === 'completed' ? 'Completado' : 
                       selectedTransaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                    </Badge>
                  </div>
                </div>

                {/* Detail Grid */}
                <div className="glass-premium p-6 rounded-[2rem] border border-white/5 space-y-5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground/60">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Concepto</span>
                    </div>
                    <span className="text-xs font-bold text-foreground text-right max-w-[180px]">{selectedTransaction.description}</span>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground/60">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Fecha</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{selectedTransaction.date}</span>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground/60">
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Categoría</span>
                    </div>
                    <span className="text-xs font-bold text-foreground uppercase tracking-widest text-[10px]">
                      {selectedTransaction.category === 'store' ? 'Tienda / Compra' : 'Billetera / Transferencia'}
                    </span>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground/60">
                        <Hash className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">ID Operación</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/60 font-bold break-all ml-4 text-right">{selectedTransaction.id}</span>
                  </div>
                </div>

                {selectedTransaction.status === 'pending' && ['deposit', 'withdrawal'].includes(selectedTransaction.raw?.type) && (
                  <Button
                    variant="outline"
                    disabled={canceling}
                    onClick={handleCancelTransaction}
                    className="w-full h-12 rounded-2xl border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 font-bold gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {canceling ? 'Cancelando...' : 'Cancelar movimiento'}
                  </Button>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

