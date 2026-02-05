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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';

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
  const token = localStorage.getItem('oscorp-token');

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleToggleIngenio = async (userId: string, currentAccess: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/ingenio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hasAccess: !currentAccess })
      });

      if (response.ok) {
        toast.success(`Acceso a Ingenio ${!currentAccess ? 'concedido' : 'revocado'}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Error al actualizar acceso a Ingenio');
    }
  };

  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
    setEditRole(user.role);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: editRole })
      });

      if (response.ok) {
        toast.success('Usuario actualizado correctamente');
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
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
                            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                            <DropdownMenuItem>Ver transacciones</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleIngenio(user.id, user.ingenioAccess)}>
                              {user.ingenioAccess ? 'Desactivar Ingenio' : 'Activar Ingenio'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={user.isActive ? "text-red-600" : "text-green-600"}
                              onClick={() => handleToggleStatus(user.id, user.isActive)}
                            >
                              {user.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifique los permisos y el rol del usuario {editingUser?.firstName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={`${editingUser?.firstName} ${editingUser?.lastName}`}
                disabled
                className="col-span-3 bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <div className="col-span-3">
                <Select value={editRole} onValueChange={setEditRole}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
