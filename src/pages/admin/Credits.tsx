import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Eye, Loader2, FileText, User, Image } from 'lucide-react';
import { creditsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
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
  DialogTrigger,
} from '@/components/ui/dialog';

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
];

const docTypeLabels: Record<string, string> = {
  id_front: 'Cedula - Frente',
  id_back: 'Cedula - Dorso',
  proof_income: 'Comprobante de ingresos',
  other: 'Otro documento',
};

export default function AdminCredits() {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      const data = await creditsApi.getAllAdmin();
      setCredits(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar creditos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleApprove = async (creditId: string) => {
    try {
      setActionLoading(creditId);
      await creditsApi.approve(creditId);
      toast.success('Credito aprobado exitosamente');
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar credito');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (creditId: string) => {
    try {
      setActionLoading(creditId);
      await creditsApi.reject(creditId);
      toast.success('Credito rechazado');
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar credito');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCredits = credits.filter(credit => {
    const user = credit.user;
    const matchesSearch = !searchTerm ||
      user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      rejected: 'bg-red-100 text-red-700',
      defaulted: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      active: 'Activo',
      completed: 'Completado',
      rejected: 'Rechazado',
      defaulted: 'En mora',
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creditos</h1>
          <p className="text-gray-500">Gestiona las solicitudes de credito</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{credits.filter(c => c.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-green-600">{credits.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-gray-600">{credits.filter(c => c.status === 'completed').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(credits.reduce((sum, c) => sum + c.amount, 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((status) => (
                <Button
                  key={status.value}
                  variant={statusFilter === status.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status.value)}
                  size="sm"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cuotas</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {credits.length === 0 ? 'No hay solicitudes de credito' : 'No se encontraron resultados'}
                    </TableCell>
                  </TableRow>
                )}
                {filteredCredits.map((credit, index) => {
                  const user = credit.user;
                  const paidInstallments = credit.payments?.length || 0;
                  const progress = credit.installments > 0 ? (paidInstallments / credit.installments) * 100 : 0;
                  const docCount = credit.documents?.length || 0;

                  return (
                    <motion.tr
                      key={credit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium block">{user?.firstName} {user?.lastName}</span>
                            <span className="text-xs text-gray-500">{user?.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{credit.concept}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(credit.amount)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(credit.totalToPay)} total</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm">{credit.installments} cuotas</span>
                          {credit.status === 'active' && (
                            <div className="w-20 mt-1">
                              <Progress value={progress} className="h-1.5" />
                              <p className="text-xs text-gray-500">{paidInstallments}/{credit.installments}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{docCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(credit.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDate(credit.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalle del Credito</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5">
                              {/* User Info */}
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Datos del Cliente
                                </h3>
                                <div className="flex items-start gap-4">
                                  {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-14 h-14 rounded-full" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-blue-200 flex items-center justify-center">
                                      <User className="w-7 h-7 text-blue-600" />
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
                                    <div>
                                      <p className="text-xs text-gray-500">Nombre</p>
                                      <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Email</p>
                                      <p className="font-medium text-sm">{user?.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Telefono</p>
                                      <p className="font-medium text-sm">{user?.phone || 'No registrado'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Ciudad</p>
                                      <p className="font-medium text-sm">{user?.city || 'No registrado'}</p>
                                    </div>
                                    {user?.address && (
                                      <div className="col-span-2">
                                        <p className="text-xs text-gray-500">Direccion</p>
                                        <p className="font-medium text-sm">{user.address}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Credit Info */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Concepto</p>
                                  <p className="font-medium text-sm">{credit.concept}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Monto</p>
                                  <p className="font-medium text-sm">{formatCurrency(credit.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Interes</p>
                                  <p className="font-medium text-sm">{credit.interestRate}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Total a pagar</p>
                                  <p className="font-medium text-sm">{formatCurrency(credit.totalToPay)}</p>
                                </div>
                              </div>

                              {/* Documents */}
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Image className="w-4 h-4" />
                                  Documentos del Cliente
                                </h3>
                                {credit.documents && credit.documents.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    {credit.documents.map((doc: any) => (
                                      <div key={doc.id} className="border rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-700 mb-2">
                                          {docTypeLabels[doc.type] || doc.type}
                                        </p>
                                        {doc.url && (doc.url.startsWith('data:image') || doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                                          <img
                                            src={doc.url}
                                            alt={docTypeLabels[doc.type] || doc.type}
                                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setPreviewImage(doc.url)}
                                          />
                                        ) : (
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 text-sm underline"
                                          >
                                            Ver documento
                                          </a>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                          Subido: {formatDate(doc.uploadedAt)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">Sin documentos adjuntos</p>
                                )}
                              </div>

                              {/* Payment Schedule */}
                              {credit.paymentSchedule && credit.paymentSchedule.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 mb-2">Plan de Pagos</p>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {credit.paymentSchedule.map((installment: any) => (
                                      <div key={installment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div>
                                          <p className="font-medium text-sm">Cuota {installment.installmentNumber}</p>
                                          <p className="text-xs text-gray-500">Vence: {formatDate(installment.dueDate)}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium text-sm">{formatCurrency(installment.amount)}</p>
                                          <Badge variant={installment.status === 'paid' ? 'default' : installment.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                                            {installment.status === 'paid' ? 'Pagada' : installment.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              {credit.status === 'pending' && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(credit.id)}
                                    disabled={actionLoading === credit.id}
                                  >
                                    {actionLoading === credit.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Aprobar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleReject(credit.id)}
                                    disabled={actionLoading === credit.id}
                                  >
                                    {actionLoading === credit.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                      <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista previa del documento</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Documento" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
