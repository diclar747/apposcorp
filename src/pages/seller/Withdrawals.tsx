import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Wallet, ArrowRight, Clock, CheckCircle, History, Banknote } from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Mock withdrawal history
const withdrawalHistory = [
  { id: 'W001', amount: 2500000, status: 'completed', date: new Date('2024-02-15'), method: 'Transferencia bancaria' },
  { id: 'W002', amount: 1800000, status: 'completed', date: new Date('2024-01-20'), method: 'Transferencia bancaria' },
  { id: 'W003', amount: 3200000, status: 'completed', date: new Date('2023-12-10'), method: 'Transferencia bancaria' },
];

export default function SellerWithdrawals() {
  const { user } = useAuthStore();
  const { wallet } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdrawal = async () => {
    const withdrawalAmount = parseInt(amount);
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    
    if (wallet && withdrawalAmount > wallet.balance) {
      toast.error('Saldo insuficiente');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Solicitud de retiro enviada');
    setAmount('');
    setIsSubmitting(false);
  };

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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₲</span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Cuenta bancaria registrada:</p>
            <div className="flex items-center gap-2 mt-2">
              <Banknote className="w-5 h-5 text-gray-400" />
              <span className="font-medium">{user?.bankData?.bankName}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{user?.bankData?.accountNumber}</p>
            <p className="text-sm text-gray-500">{user?.bankData?.holderName}</p>
          </div>
          
          <Button 
            className="w-full bg-green-600" 
            onClick={handleWithdrawal}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            {withdrawalHistory.map((withdrawal, index) => (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    withdrawal.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {withdrawal.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{withdrawal.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(withdrawal.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(withdrawal.amount)}</p>
                  <Badge variant={withdrawal.status === 'completed' ? 'default' : 'secondary'}>
                    {withdrawal.status === 'completed' ? 'Completado' : 'Pendiente'}
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
