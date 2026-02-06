import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ingenioApi } from '@/lib/api';

interface SubscriptionData {
  id: string;
  totalAmount: number;
  amountPaid: number;
  installments: number;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  activatedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    ingenioAccess: boolean;
  };
  payments: {
    id: string;
    amount: number;
    paymentNumber: number;
    paidAt: string;
  }[];
}

export default function AdminIngenioSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingSub, setViewingSub] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await ingenioApi.getAllSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await ingenioApi.activateSubscription(id);
      toast.success('Acceso activado correctamente');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Error al activar acceso');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await ingenioApi.cancelSubscription(id);
      toast.success('Suscripción cancelada');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Error al cancelar suscripción');
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    completed: subscriptions.filter((s) => s.status === 'completed').length,
    partial: subscriptions.filter((s) => s.status === 'partial').length,
    totalRevenue: subscriptions.reduce((sum, s) => sum + s.amountPaid, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-none"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700 border-none"><Clock className="w-3 h-3 mr-1" />Parcial</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700 border-none"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-none"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando suscripciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ingenio Millonario</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Gestiona las suscripciones del programa</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Suscripciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.partial}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">En Cuotas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recaudado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'completed', label: 'Completados' },
                { value: 'partial', label: 'Parciales' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'cancelled', label: 'Cancelados' },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={filterStatus === filter.value ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(filter.value)}
                  size="sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-800">
                  <TableHead className="dark:text-gray-400">Usuario</TableHead>
                  <TableHead className="dark:text-gray-400">Estado</TableHead>
                  <TableHead className="dark:text-gray-400">Pagos</TableHead>
                  <TableHead className="dark:text-gray-400">Progreso</TableHead>
                  <TableHead className="dark:text-gray-400">Acceso</TableHead>
                  <TableHead className="dark:text-gray-400">Fecha</TableHead>
                  <TableHead className="text-right dark:text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron suscripciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub, index) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={sub.user.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                              {sub.user.firstName[0]}{sub.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {sub.user.firstName} {sub.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sub.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(sub.amountPaid)}
                          </span>
                          <span className="text-gray-400"> / {formatCurrency(sub.totalAmount)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(sub.amountPaid / sub.totalAmount) * 100}
                            className="h-1.5 w-16"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {sub.payments.length}/{sub.installments}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.user.ingenioAccess ? (
                          <Badge className="bg-purple-100 text-purple-700 border-none text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(sub.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="dark:text-gray-400">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                            <DropdownMenuItem
                              onClick={() => setViewingSub(sub)}
                              className="cursor-pointer dark:text-gray-300"
                            >
                              Ver detalle
                            </DropdownMenuItem>
                            {!sub.user.ingenioAccess && sub.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleActivate(sub.id)}
                                  className="text-green-600 cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activar Acceso
                                </DropdownMenuItem>
                              </>
                            )}
                            {sub.status !== 'cancelled' && sub.status !== 'completed' && (
                              <DropdownMenuItem
                                onClick={() => handleCancel(sub.id)}
                                className="text-red-600 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar Suscripción
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewingSub} onOpenChange={(open) => !open && setViewingSub(null)}>
        {viewingSub && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalle de Suscripción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={viewingSub.user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    {viewingSub.user.firstName[0]}{viewingSub.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {viewingSub.user.firstName} {viewingSub.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{viewingSub.user.email}</p>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Estado</p>
                  <div className="mt-1">{getStatusBadge(viewingSub.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Cuotas</p>
                  <p className="font-medium dark:text-white mt-1">{viewingSub.installments} cuotas</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total</p>
                  <p className="font-medium dark:text-white mt-1">{formatCurrency(viewingSub.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Pagado</p>
                  <p className="font-medium text-green-600 mt-1">{formatCurrency(viewingSub.amountPaid)}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Progreso de pago</span>
                  <span className="font-medium dark:text-white">
                    {((viewingSub.amountPaid / viewingSub.totalAmount) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(viewingSub.amountPaid / viewingSub.totalAmount) * 100} className="h-2" />
              </div>

              {/* Payment History */}
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-2">Historial de Pagos</p>
                <div className="space-y-2">
                  {viewingSub.payments.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin pagos registrados</p>
                  ) : (
                    viewingSub.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium dark:text-white">
                              Cuota {payment.paymentNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(payment.paidAt)}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {!viewingSub.user.ingenioAccess && viewingSub.status !== 'cancelled' && (
                  <Button
                    onClick={() => {
                      handleActivate(viewingSub.id);
                      setViewingSub(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activar Acceso
                  </Button>
                )}
                {viewingSub.status !== 'cancelled' && viewingSub.status !== 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleCancel(viewingSub.id);
                      setViewingSub(null);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
