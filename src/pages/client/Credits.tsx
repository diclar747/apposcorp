import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockCredits } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  active: { label: 'Activo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function ClientCredits() {
  const { user } = useAuthStore();
  const userCredits = mockCredits.filter(c => c.userId === user?.id);
  
  const activeCredits = userCredits.filter(c => c.status === 'active');
  const pendingCredits = userCredits.filter(c => c.status === 'pending');
  const completedCredits = userCredits.filter(c => c.status === 'completed');

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Mis Créditos</h1>
        <p className="text-sm text-gray-500">Gestiona tus préstamos</p>
      </div>

      {/* Quick Action */}
      <div className="px-4">
        <Link to="/app/creditos/solicitar">
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Solicitar nuevo crédito</p>
                    <p className="text-sm text-white/80">Obtén hasta ₲ 10.000.000</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{activeCredits.length}</p>
            <p className="text-xs text-gray-500">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{pendingCredits.length}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{completedCredits.length}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Credits List */}
      <div className="px-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Historial de créditos</h2>
        
        {userCredits.map((credit, index) => {
          const status = statusConfig[credit.status];
          const StatusIcon = status.icon;
          const paidInstallments = credit.payments.length;
          const progress = (paidInstallments / credit.installments) * 100;
          
          return (
            <motion.div
              key={credit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{credit.concept}</p>
                      <p className="text-sm text-gray-500">Solicitado el {formatDate(credit.createdAt)}</p>
                    </div>
                    <Badge className={`${status.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Monto</p>
                      <p className="font-bold">{formatCurrency(credit.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total a pagar</p>
                      <p className="font-bold">{formatCurrency(credit.totalToPay)}</p>
                    </div>
                  </div>

                  {credit.status === 'active' && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Progreso de pago</span>
                        <span className="font-medium">{paidInstallments}/{credit.installments} cuotas</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">Próxima cuota</span>
                        <span className="font-medium">{formatCurrency(credit.installmentAmount)}</span>
                      </div>
                    </div>
                  )}

                  {credit.status === 'active' && (
                    <Button className="w-full mt-3" variant="outline">
                      Pagar cuota
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {userCredits.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tienes créditos</h3>
          <p className="text-gray-500 mb-4">Solicita tu primer crédito</p>
          <Link to="/app/creditos/solicitar">
            <Button>Solicitar crédito</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
