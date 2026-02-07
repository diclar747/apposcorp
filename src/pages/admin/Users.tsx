import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, User, Mail, Phone, Shield, Store, UserCircle, CheckCircle, XCircle, Pencil, Save } from 'lucide-react';
import { cn, getRoleName, getRoleColor, formatDate } from '@/lib/utils';
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
  DropdownMenuSeparator
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
import { usersApi } from '@/lib/api';

// Types
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'client' | 'seller' | 'superadmin';
  isActive: boolean;
  ingenioAccess: boolean;
  avatar: string;
  createdAt: string;
  permissions?: any;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'seller' | 'superadmin'>('all');
  const { isAuthenticated } = useAuthStore();

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Actions State
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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
      role: user.role
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona los usuarios del sistema</p>
        </div>
        <Button className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios por nombre o email..."
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
              >
                Todos
              </Button>
              <Button
                variant={filterRole === 'client' ? 'default' : 'outline'}
                onClick={() => setFilterRole('client')}
                size="sm"
              >
                Clientes
              </Button>
              <Button
                variant={filterRole === 'seller' ? 'default' : 'outline'}
                onClick={() => setFilterRole('seller')}
                size="sm"
              >
                Vendedores
              </Button>
              <Button
                variant={filterRole === 'superadmin' ? 'default' : 'outline'}
                onClick={() => setFilterRole('superadmin')}
                size="sm"
              >
                Admins
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
                  <TableHead>Contacto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ingenio</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            {user.phone || 'Sin teléfono'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(getRoleColor(user.role))}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {getRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.ingenioAccess ? (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
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
        <DialogContent className="sm:max-w-[500px]">
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

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editFormData.role} onValueChange={(val) => setEditFormData({ ...editFormData, role: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
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
          <DialogContent className="sm:max-w-[600px]">
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
                  <h3 className="text-xl font-bold text-gray-900">{viewingUser.firstName} {viewingUser.lastName}</h3>
                  <p className="text-gray-500">{viewingUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={cn(getRoleColor(viewingUser.role))}>{getRoleName(viewingUser.role)}</Badge>
                    <Badge variant={viewingUser.isActive ? 'default' : 'secondary'}>{viewingUser.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">Teléfono</Label>
                  <p className="font-medium text-gray-900 mt-1">{viewingUser.phone || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">Fecha Registro</Label>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(viewingUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">ID Usuario</Label>
                  <p className="font-mono text-xs text-gray-700 mt-1">{viewingUser.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">Acceso Ingenio</Label>
                  <p className="font-medium mt-1">
                    {viewingUser.ingenioAccess ? <span className="text-purple-600 font-bold">Autorizado</span> : <span className="text-gray-400">Sin acceso</span>}
                  </p>
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron usuarios</h3>
          <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}
