import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, UserPlus, Loader2, Filter, MoreHorizontal, User, Mail, Phone, Shield, Store, UserCircle, CheckCircle, XCircle, Pencil, Save, BookOpen, Check } from 'lucide-react';
import { cn, getRoleName, getRoleColor, formatDate, getAccountStatusInfo, generateReportPDF } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { usersApi, plansApi, coursesApi, ingenioApi, authApi } from '@/lib/api';
import type { SubscriptionPlan, BillingCycle, Course, UserCourse } from '@/types';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

// Types
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string[];
  isActive: boolean;
  ingenioAccess: boolean;
  ingenioInstallmentsPaid?: number;
  ingenioTotalInstallments?: number;
  avatar: string;
  createdAt: string;
  permissions?: any;
  sellerProfile?: {
    planActive: boolean;
    plan?: {
      name: string;
    };
  };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'seller' | 'superadmin' | 'ingenio'>('all');
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const { isAuthenticated } = useAuthStore();

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', roles: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);

  // Actions State
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);

  // Plan Assignment State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<UserData | null>(null);

  // Modal state for creation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client' as any
  });

  const [planFormData, setPlanFormData] = useState({
    planId: '',
    billingCycle: 'monthly' as BillingCycle,
    customCommission: '' as number | string,
    isCommissionBased: false
  });
  
  // Individual Course Management State
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [selectedUserForCourses, setSelectedUserForCourses] = useState<UserData | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [userCoursesIds, setUserCoursesIds] = useState<string[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const exportToPDF = () => {
    const statsHtml = `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">TOTAL USUARIOS</div>
          <div class="stat-value">${users.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">CLIENTES</div>
          <div class="stat-value">${users.filter(u => u.roles.includes('client')).length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">VENDEDORES</div>
          <div class="stat-value">${users.filter(u => u.roles.includes('seller')).length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">INGENIO</div>
          <div class="stat-value">${users.filter(u => u.ingenioAccess).length}</div>
        </div>
      </div>
    `;

    const rows = filteredUsers.map(u => {
      const statusInfo = getAccountStatusInfo(u.isActive);
      const statusClass = u.isActive ? 'badge-green' : 'badge-red';

      return `
        <tr>
          <td>${u.firstName} ${u.lastName}</td>
          <td>${u.email}</td>
          <td>${u.roles?.map(r => getRoleName(r)).join(', ') || '-'}</td>
          <td><span class="badge ${statusClass}">${statusInfo.label}</span></td>
          <td>${u.ingenioAccess ? '<span class="badge badge-blue">SÍ</span>' : '<span class="badge badge-gray">NO</span>'}</td>
          <td>${new Date(u.createdAt).toLocaleDateString('es-PY')}</td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Estado</th>
            <th>Ingenio</th>
            <th>Registro</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    generateReportPDF('Reporte de Usuarios', statsHtml, tableHtml);
    toast.success('Reporte de usuarios generado correctamente');
  };

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await plansApi.getAll();
      setAvailablePlans(data);
    } catch (error) {
      // Use mock data if API fails (similar to Plans.tsx)
      console.error('Error fetching plans', error);
      setAvailablePlans([
        { id: '1', name: 'Plan Básico', tier: 'basic', isCommissionBased: false } as any,
        { id: '2', name: 'Plan Estándar', tier: 'standard', isCommissionBased: false } as any,
        { id: '3', name: 'Plan Comercial', tier: 'commercial', isCommissionBased: false } as any,
      ]);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await usersApi.updateStatus(userId, !currentStatus);
      toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleToggleIngenio = async (userId: string, currentAccess: boolean) => {
    try {
      await usersApi.updateIngenio(userId, !currentAccess);
      
      // Sincronización: Si revocamos acceso, revocamos también la suscripción activa
      if (currentAccess) {
        try {
          const allSubs = await ingenioApi.getAllSubscriptions();
          const userSub = allSubs.find((s: any) => s.userId === userId && s.status !== 'REVOKED');
          if (userSub) {
            await ingenioApi.revokeSubscription(userSub.id);
          }
        } catch (e) {
          console.error("Error al sincronizar revocación:", e);
        }
      } else {
        // Sincronización: Si otorgamos acceso, buscamos una suscripción revocada para reactivarla
        try {
          const allSubs = await ingenioApi.getAllSubscriptions();
          const userSub = allSubs.find((s: any) => s.userId === userId && s.status === 'REVOKED');
          if (userSub) {
            await ingenioApi.approveSubscription(userSub.id, 0);
          }
        } catch (e) {
          console.error("Error al sincronizar activación:", e);
        }
      }

      toast.success(`Acceso a Ingenio ${!currentAccess ? 'concedido' : 'revocado'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Error al actualizar acceso a Ingenio');
    }
  };

  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: user.roles || []
    });
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersApi.delete(userToDelete.id);
      toast.success('Usuario eliminado permanentemente');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await usersApi.update(editingUser.id, editFormData);
      toast.success('Usuario actualizado correctamente');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Error al actualizar usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPlanModal = (user: UserData) => {
    setSelectedUserForPlan(user);
    // Initialize form with defaults or current plan if available
    setPlanFormData({
      planId: '',
      billingCycle: 'monthly',
      customCommission: '',
      isCommissionBased: false
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlanAssignment = async () => {
    if (!selectedUserForPlan) return;
    try {
      const payload = {
        ...planFormData,
        customCommission: planFormData.customCommission === '' ? 0 : Number(planFormData.customCommission)
      };
      await usersApi.assignPlan(selectedUserForPlan.id, payload);
      toast.success(`Plan asignado a ${selectedUserForPlan.firstName}`);
      setIsPlanModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Error al asignar el plan');
    }
  };
  
  const handleOpenCoursesModal = async (user: UserData) => {
    setSelectedUserForCourses(user);
    setIsCoursesModalOpen(true);
    setIsLoadingCourses(true);
    try {
      // Fetch all courses
      const courses = await coursesApi.getAll(true);
      setAllCourses(courses);
      
      // Fetch user specific details to get their current courses
      const userDetails = await usersApi.getById(user.id);
      // Assuming backend returns userCourses in the user details
      // Wait, let's verify if getById includes userCourses.
      // In prisma/schema.prisma: User has userCourses.
      // In server/src/routes/users.ts: getById doesn't include userCourses yet. 
      // I should update the backend to include them or fetch them separately.
      // Let's assume for now it will be added or fetched via another way.
      // Actually, I'll update getById in users.ts next.
      
      const enrolledIds = userDetails.userCourses?.map((uc: any) => uc.courseId) || [];
      setUserCoursesIds(enrolledIds);
    } catch (error) {
      toast.error('Error al cargar cursos del usuario');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleToggleCourseAccess = async (courseId: string, isEnrolled: boolean) => {
    if (!selectedUserForCourses) return;
    
    try {
      if (isEnrolled) {
        await usersApi.removeCourse(selectedUserForCourses.id, courseId);
        setUserCoursesIds(prev => prev.filter(id => id !== courseId));
        toast.success('Acceso revocado');
      } else {
        await usersApi.assignCourse(selectedUserForCourses.id, courseId);
        setUserCoursesIds(prev => [...prev, courseId]);
        toast.success('Acceso concedido');
      }
      fetchUsers(); // Update stats in table
    } catch (error) {
      toast.error('Error al actualizar acceso');
    }
  };

  const handleCreateUser = async () => {
    if (!createData.email || !createData.password || !createData.firstName || !createData.lastName) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        ...createData,
        roles: [createData.role]
      });
      toast.success('Usuario creado correctamente');
      setIsCreateModalOpen(false);
      setCreateData({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'client' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.roles?.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return Shield;
      case 'seller': return Store;
      default: return UserCircle;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona los usuarios del sistema</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToPDF} className="flex-1 sm:flex-none">
            Exportar
          </Button>
          <Button className="bg-blue-600 flex-1 sm:flex-none" onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={createData.firstName} onChange={e => setCreateData({ ...createData, firstName: e.target.value })} placeholder="Ej: Juan" />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input value={createData.lastName} onChange={e => setCreateData({ ...createData, lastName: e.target.value })} placeholder="Ej: Pérez" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={createData.email} onChange={e => setCreateData({ ...createData, email: e.target.value })} placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>Contraseña *</Label>
              <Input type="password" value={createData.password} onChange={e => setCreateData({ ...createData, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={createData.phone} onChange={e => setCreateData({ ...createData, phone: e.target.value })} placeholder="0981..." />
              </div>
              <div className="space-y-2">
                <Label>Rol Inicial</Label>
                <Select value={createData.role} onValueChange={(val: any) => setCreateData({ ...createData, role: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="seller">Vendedor</SelectItem>
                    <SelectItem value="ingenio">Ingenio Millonario</SelectItem>
                    <SelectItem value="superadmin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterRole === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterRole('all')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Todos
              </Button>
              <Button
                variant={filterRole === 'client' ? 'default' : 'outline'}
                onClick={() => setFilterRole('client')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Clientes
              </Button>
              <Button
                variant={filterRole === 'seller' ? 'default' : 'outline'}
                onClick={() => setFilterRole('seller')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Vendedores
              </Button>
              <Button
                variant={filterRole === 'superadmin' ? 'default' : 'outline'}
                onClick={() => setFilterRole('superadmin')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Admins
              </Button>
              <Button
                variant={filterRole === 'ingenio' ? 'default' : 'outline'}
                onClick={() => setFilterRole('ingenio')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Ingenio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Ingenio</TableHead>
                  <TableHead className="hidden xl:table-cell">Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => {
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 shrink-0" />
                            {user.phone || 'Sin teléfono'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1 flex-wrap">
                            {user.roles?.map(role => {
                              const RIcon = getRoleIcon(role);
                              return (
                                <Badge key={role} className={cn(getRoleColor(role), "text-xs")}>
                                  <RIcon className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="hidden sm:inline">{getRoleName(role)}</span>
                                  <span className="sm:hidden">{getRoleName(role).substring(0, 4)}</span>
                                </Badge>
                              );
                            })}
                          </div>
                          {user.roles?.includes('seller') && user.sellerProfile?.planActive && (
                            <Badge variant="outline" className="text-[10px] w-fit border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 font-bold uppercase tracking-wider">
                              Plan: {user.sellerProfile.plan?.name || 'Cargando...'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={`${getAccountStatusInfo(user.isActive).bgColor} ${getAccountStatusInfo(user.isActive).color} border-0 text-xs`}>
                          {getAccountStatusInfo(user.isActive).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.ingenioAccess ? (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none text-xs">
                            <CheckCircle className="w-3 h-3 mr-1 shrink-0" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 text-xs">
                            <XCircle className="w-3 h-3 mr-1 shrink-0" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingUser(user)}>Ver perfil</DropdownMenuItem>
                            <DropdownMenuItem>Ver transacciones</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleIngenio(user.id, user.ingenioAccess)}>
                              {user.ingenioAccess ? 'Desactivar Ingenio' : 'Activar Ingenio'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={user.isActive ? "text-orange-600" : "text-green-600"}
                              onClick={() => handleToggleStatus(user.id, user.isActive)}
                            >
                              {user.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Eliminar Usuario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los datos personales y el rol del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold">Roles del Usuario</Label>
              <div className="grid grid-cols-1 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                {[
                  { id: 'client', label: 'Cliente (Wallet Oscorp)', icon: UserCircle },
                  { id: 'seller', label: 'Vendedor (Comerciante)', icon: Store },
                  { id: 'ingenio', label: 'Estudiante (Ingenio Millonario)', icon: BookOpen },
                  { id: 'superadmin', label: 'Administrador (Super)', icon: Shield },
                ].map((role) => (
                  <div key={role.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`role-${role.id}`}
                      checked={editFormData.roles.includes(role.id)}
                      onCheckedChange={(checked) => {
                        const newRoles = checked 
                          ? [...editFormData.roles, role.id]
                          : editFormData.roles.filter(r => r !== role.id);
                        setEditFormData({ ...editFormData, roles: newRoles });
                      }}
                    />
                    <label 
                      htmlFor={`role-${role.id}`}
                      className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <role.icon className="w-4 h-4 text-slate-500" />
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Profile Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        {viewingUser && (
          <DialogContent className="sm:max-w-[600px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Perfil de Usuario</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 text-xl border-4 border-white shadow-lg">
                  <AvatarImage src={viewingUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {viewingUser.firstName[0]}{viewingUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{viewingUser.firstName} {viewingUser.lastName}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{viewingUser.email}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {viewingUser.roles?.map(role => (
                      <Badge key={role} className={cn(getRoleColor(role))}>{getRoleName(role)}</Badge>
                    ))}
                    <Badge variant={viewingUser.isActive ? 'default' : 'secondary'}>{viewingUser.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div>
                  <Label className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Teléfono</Label>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{viewingUser.phone || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Fecha Registro</Label>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{formatDate(viewingUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">ID Usuario</Label>
                  <p className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">{viewingUser.id}</p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">Gestión Ingenio Millonario</Label>
                    <Badge variant={viewingUser.ingenioAccess ? "default" : "secondary"} className={viewingUser.ingenioAccess ? "bg-purple-100 text-purple-700" : ""}>
                      {viewingUser.ingenioAccess ? "Acceso Activo" : "Sin Acceso"}
                    </Badge>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={cn(
                          "flex-1 font-bold",
                          viewingUser.ingenioAccess 
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" 
                            : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                        )}
                        variant={viewingUser.ingenioAccess ? "outline" : "default"}
                        onClick={async () => {
                          const newStatus = !viewingUser.ingenioAccess;
                          await usersApi.updateIngenio(viewingUser.id, newStatus, viewingUser.ingenioInstallmentsPaid, viewingUser.ingenioTotalInstallments);
                          setViewingUser({ ...viewingUser, ingenioAccess: newStatus });
                          fetchUsers();
                          toast.success(newStatus ? "Acceso concedido" : "Acceso revocado");
                        }}
                      >
                        {viewingUser.ingenioAccess ? "Revocar Acceso" : "Conceder Acceso"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingUser(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro absolutamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Assignment Dialog */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-[450px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Plan de Suscripción</DialogTitle>
            <DialogDescription>
              Asigna un plan de beneficios a <strong>{selectedUserForPlan?.firstName} {selectedUserForPlan?.lastName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Modelo de Cobro</Label>
                  <p className="text-[10px] text-gray-500">¿Deseas usar un modelo basado en comisiones?</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="userIsCommission" className="text-xs">Por Comisión</Label>
                  <input
                    type="checkbox"
                    id="userIsCommission"
                    checked={planFormData.isCommissionBased}
                    onChange={(e) => setPlanFormData({ ...planFormData, isCommissionBased: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </div>
              </div>

              {!planFormData.isCommissionBased ? (
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="planSelect">Seleccionar Plan</Label>
                    <Select value={planFormData.planId} onValueChange={(val) => setPlanFormData({ ...planFormData, planId: val })}>
                      <SelectTrigger id="planSelect">
                        <SelectValue placeholder="Elegir un plan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cycleSelect">Ciclo de Facturación</Label>
                    <Select value={planFormData.billingCycle} onValueChange={(val: any) => setPlanFormData({ ...planFormData, billingCycle: val })}>
                      <SelectTrigger id="cycleSelect">
                        <SelectValue placeholder="Elegir ciclo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral (3 meses)</SelectItem>
                        <SelectItem value="semi_annual">Semestral (6 meses)</SelectItem>
                        <SelectItem value="annual">Anual (12 meses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="customComm">Porcentaje de Comisión</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="customComm"
                        type="number"
                        min="0"
                        max="100"
                        value={planFormData.customCommission}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setPlanFormData({ ...planFormData, customCommission: '' });
                            return;
                          }
                          let val = Number(valStr);
                          if (val < 0) val = 0;
                          if (val > 100) val = 100;
                          setPlanFormData({ ...planFormData, customCommission: val });
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="Ej: 5"
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">% sobre cada venta final.</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-800/30">
                    Al usar comisiones no se cobrará cargo fijo. Perfecto para nuevos comercios.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePlanAssignment} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Individual Course Management Dialog */}
      <Dialog open={isCoursesModalOpen} onOpenChange={setIsCoursesModalOpen}>
        <DialogContent className="sm:max-w-[550px] w-[calc(100%-2rem)] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Gestionar Cursos Individuales</DialogTitle>
            <DialogDescription>
              Habilita o deshabilita el acceso a cursos específicos para <strong>{selectedUserForCourses?.firstName} {selectedUserForCourses?.lastName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCourses ? (
            <div className="py-20 text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              Cargando cursos...
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6 py-4">
                {/* IM E1 Section */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    Cursos IM E1
                  </h3>
                  <div className="space-y-2">
                    {allCourses.filter(c => c.category === 'IM E1').length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No hay cursos en esta categoría</p>
                    ) : (
                      allCourses.filter(c => c.category === 'IM E1').map(course => {
                        const isEnrolled = userCoursesIds.includes(course.id);
                        return (
                          <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium dark:text-white">{course.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{course.shortDescription}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnrolled}
                              onCheckedChange={() => handleToggleCourseAccess(course.id, isEnrolled)}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* IM E2 Section */}
                <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                  <h3 className="font-bold text-sm text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                    Cursos IM E2
                  </h3>
                  <div className="space-y-2">
                    {allCourses.filter(c => c.category === 'IM E2').length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No hay cursos en esta categoría</p>
                    ) : (
                      allCourses.filter(c => c.category === 'IM E2').map(course => {
                        const isEnrolled = userCoursesIds.includes(course.id);
                        return (
                          <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium dark:text-white">{course.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{course.shortDescription}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnrolled}
                              onCheckedChange={() => handleToggleCourseAccess(course.id, isEnrolled)}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                {/* Other categories */}
                {allCourses.filter(c => c.category !== 'IM E1' && c.category !== 'IM E2').length > 0 && (
                  <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                    <h3 className="font-bold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">Otros Cursos</h3>
                    <div className="space-y-2">
                      {allCourses.filter(c => c.category !== 'IM E1' && c.category !== 'IM E2').map(course => {
                        const isEnrolled = userCoursesIds.includes(course.id);
                        return (
                          <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm opacity-60">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-900/30 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium dark:text-white">{course.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{course.category}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnrolled}
                              onCheckedChange={() => handleToggleCourseAccess(course.id, isEnrolled)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button onClick={() => setIsCoursesModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {
        filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No se encontraron usuarios</h3>
            <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
          </div>
        )
      }
    </div >
  );
}
