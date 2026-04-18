import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, Clock, CheckCircle, History, Banknote, Loader2, XCircle } from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { walletApi } from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SellerWithdrawals() {
  const { user } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (user) {
          await fetchWallet(user.id);
        }
        // Load withdrawal transactions
        const txData = await walletApi.getTransactions({ limit: 50 });
        const withdrawalTxs = (txData || []).filter((t: any) => t.type === 'withdrawal');
        setWithdrawals(withdrawalTxs);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleWithdrawal = async () => {
    // Parse formatted string back to number
    const numericAmount = parseFloat(amount.replace(/\./g, ''));

    if (!numericAmount || numericAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (wallet && numericAmount > wallet.balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!user?.bankData) {
      toast.error('Debes registrar una cuenta bancaria en tu perfil antes de solicitar un retiro');
      return;
    }

    setIsSubmitting(true);

    try {
      await walletApi.withdraw(numericAmount, 'Retiro de ganancias');
      
      // WhatsApp message generation
      const storeName = user?.sellerProfile?.storeName || 'Mi Tienda';
      const userName = `${user?.firstName} ${user?.lastName}`;
      const bankInfo = `Banco: ${user.bankData.bankName}\nCuenta: ${user.bankData.accountNumber}\nTitular: ${user.bankData.holderName}\nDocumento: ${user.bankData.documentId}`;
      
      const message = `Hola Oscorp, solicito un retiro de ${formatCurrency(numericAmount)}.\n\n` +
                      `Tienda: ${storeName}\n` +
                      `Usuario: ${userName} (${user?.email})\n\n` +
                      `*Datos Bancarios*:\n${bankInfo}`;
      
      const whatsappNumber = '595975855585'; // Admin phone from the codebase
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      toast.success('Solicitud registrada. Abriendo WhatsApp para confirmar...');
      
      // Small delay before opening WhatsApp to allow the user to see the success message
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);

      setAmount('');
      // Refresh data
      if (user) await fetchWallet(user.id);
      const txData = await walletApi.getTransactions({ limit: 50 });
      const withdrawalTxs = (txData || []).filter((t: any) => t.type === 'withdrawal');
      setWithdrawals(withdrawalTxs);
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar retiro');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Retiros</h1>
        <p className="text-gray-500">Solicita retiros de tus ganancias</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Saldo disponible</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(wallet?.balance || 0)}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Retiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Monto a retirar</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold px-0.5">₲</span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(formatNumber(e.target.value))}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                className="pl-8 font-bold text-lg"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl transition-colors">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Cuenta bancaria registrada:</p>
            {user?.bankData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-700 dark:text-slate-200">{user.bankData.bankName}</span>
                    <span className="block text-sm text-slate-500 font-medium">{user.bankData.accountNumber}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200/50 dark:border-slate-700/50">
                   <p className="text-xs text-slate-400 font-medium">Titular: <span className="text-slate-600 dark:text-slate-300 font-bold">{user.bankData.holderName}</span></p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <XCircle className="w-5 h-5" />
                <p className="text-sm font-medium">No tienes cuenta bancaria registrada. Ve a tu perfil para agregarla.</p>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-green-600"
            onClick={handleWithdrawal}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Solicitar retiro
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de Retiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {withdrawals.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay retiros registrados</p>
            )}
            {withdrawals.map((withdrawal: any, index: number) => (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    withdrawal.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                    withdrawal.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    {withdrawal.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : withdrawal.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{withdrawal.description || 'Retiro'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(withdrawal.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(Math.abs(withdrawal.amount))}</p>
                  <Badge 
                    variant={withdrawal.status === 'completed' ? 'default' : 'secondary'}
                    className={withdrawal.status === 'completed' ? 'bg-green-600' : ''}
                  >
                    {withdrawal.status === 'completed' ? 'Completado' :
                     withdrawal.status === 'failed' ? 'Fallido' : 'Pendiente'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
