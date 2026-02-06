import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, MoreHorizontal, User, Mail, Phone, Shield, Store as StoreIcon, UserCircle,
  CheckCircle, XCircle, Pencil, Wallet, CreditCard, ShoppingBag, Eye, Trash2, Loader2,
  Users as UsersIcon, MapPin, Star
} from 'lucide-react';
import { cn, getRoleName, getRoleColor, formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { usersApi, authApi } from '@/lib/api';

// Types
interface WalletData {
  id: string;
  balance: number;
  currency: string;
  totalIn: number;
  totalOut: number;
}

interface SellerProfileData {
  id: string;
  storeName: string;
  storeSlug: string;
  description: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  isVerified: boolean;
  planActive: boolean;
  planExpiryDate: string | null;
  commissionRate: number;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  socialLinks: any;
  products?: any[];
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  role: 'client' | 'seller' | 'superadmin';
  isActive: boolean;
  ingenioAccess: boolean;
  avatar: string;
  createdAt: string;
  wallet?: WalletData;
  sellerProfile?: SellerProfileData;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');

  // Client search/filter
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Seller search/filter
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Actions State
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);

  // Create Store for Seller state
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [storeTargetSeller, setStoreTargetSeller] = useState<UserData | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    storeName: '',
    description: '',
    address: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    logo: '',
    banner: '',
    facebook: '',
    instagram: ''
  });

  // Create New Seller + Store state
  const [isCreateSellerOpen, setIsCreateSellerOpen] = useState(false);
  const [creatingSeller, setCreatingSeller] = useState(false);
  const [newSellerForm, setNewSellerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    storeName: '',
    description: '',
    address: '',
    whatsappNumber: '',
    logo: '',
    banner: '',
    facebook: '',
    instagram: ''
  });

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

  // Derived data
  const clients = users.filter(u => u.role === 'client');
  const sellers = users.filter(u => u.role === 'seller');

  const filteredClients = clients.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      user.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(clientSearch.toLowerCase()));
    const matchesStatus = clientStatusFilter === 'all' ||
      (clientStatusFilter === 'active' && user.isActive) ||
      (clientStatusFilter === 'inactive' && !user.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredSellers = sellers.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(sellerSearch.toLowerCase()) ||
      user.lastName.toLowerCase().includes(sellerSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(sellerSearch.toLowerCase()) ||
      (user.sellerProfile?.storeName && user.sellerProfile.storeName.toLowerCase().includes(sellerSearch.toLowerCase()));
    const matchesStatus = sellerStatusFilter === 'all' ||
      (sellerStatusFilter === 'active' && user.isActive) ||
      (sellerStatusFilter === 'inactive' && !user.isActive) ||
      (sellerStatusFilter === 'verified' && user.sellerProfile?.isVerified) ||
      (sellerStatusFilter === 'unverified' && !user.sellerProfile?.isVerified);
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter(u => u.isActive).length;
  const totalSellers = sellers.length;
  const activeSellers = sellers.filter(u => u.isActive).length;
  const verifiedSellers = sellers.filter(u => u.sellerProfile?.isVerified).length;
  const sellersWithStore = sellers.filter(u => u.sellerProfile?.storeName).length;

  // Handlers
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
      const token = localStorage.getItem('oscorp-token');
      const response = await fetch(`/api/users/${userId}/ingenio`, {
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
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('oscorp-token');
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      if (response.ok) {
        toast.success('Usuario actualizado correctamente');
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error('Error al actualizar usuario');
      }
    } catch (error) {
      toast.error('Error al actualizar usuario');
    } finally {
      setIsSaving(false);
    }
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

  // Store assignment for existing seller
  const handleAssignStore = (seller: UserData) => {
    setStoreTargetSeller(seller);
    setStoreFormData({
      storeName: seller.sellerProfile?.storeName || `${seller.firstName}'s Store`,
      description: seller.sellerProfile?.description || '',
      address: seller.sellerProfile?.address || seller.address || '',
      phone: seller.sellerProfile?.phone || seller.phone || '',
      whatsappNumber: seller.sellerProfile?.whatsappNumber || '',
      email: seller.sellerProfile?.email || seller.email || '',
      logo: seller.sellerProfile?.logo || '',
      banner: '',
      facebook: seller.sellerProfile?.socialLinks?.facebook || '',
      instagram: seller.sellerProfile?.socialLinks?.instagram || ''
    });
    setIsCreateStoreOpen(true);
  };

  const handleSaveStore = async () => {
    if (!storeTargetSeller) return;
    if (!storeFormData.storeName) {
      toast.error('El nombre de la tienda es obligatorio');
      return;
    }
    setCreatingStore(true);
    try {
      await usersApi.updateSellerProfileById(storeTargetSeller.id, {
        storeName: storeFormData.storeName,
        description: storeFormData.description,
        address: storeFormData.address,
        phone: storeFormData.phone,
        whatsappNumber: storeFormData.whatsappNumber,
        email: storeFormData.email,
        logo: storeFormData.logo,
        banner: storeFormData.banner,
        socialLinks: {
          facebook: storeFormData.facebook,
          instagram: storeFormData.instagram
        }
      });
      toast.success(storeTargetSeller.sellerProfile ? 'Tienda actualizada' : 'Tienda asignada al vendedor');
      setIsCreateStoreOpen(false);
      setStoreTargetSeller(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar tienda');
    } finally {
      setCreatingStore(false);
    }
  };

  // Create new seller with store
  const handleCreateSeller = async () => {
    if (!newSellerForm.firstName || !newSellerForm.lastName || !newSellerForm.email || !newSellerForm.storeName) {
      toast.error('Completa los campos obligatorios: nombre, apellido, email y nombre de tienda');
      return;
    }
    setCreatingSeller(true);
    try {
      // 1. Register user as seller
      const registerRes: any = await authApi.register({
        firstName: newSellerForm.firstName,
        lastName: newSellerForm.lastName,
        email: newSellerForm.email,
        password: newSellerForm.password || '123456',
        phone: newSellerForm.phone,
        address: newSellerForm.address,
        role: 'seller'
      });

      const userId = registerRes.user.id;

      // 2. Create/update seller profile with store
      await usersApi.updateSellerProfileById(userId, {
        storeName: newSellerForm.storeName,
        description: newSellerForm.description,
        address: newSellerForm.address,
        phone: newSellerForm.phone,
        whatsappNumber: newSellerForm.whatsappNumber,
        email: newSellerForm.email,
        logo: newSellerForm.logo,
        banner: newSellerForm.banner,
        socialLinks: {
          facebook: newSellerForm.facebook,
          instagram: newSellerForm.instagram
        }
      });

      toast.success('Vendedor creado y tienda asignada exitosamente');
      setIsCreateSellerOpen(false);
      setNewSellerForm({
        firstName: '', lastName: '', email: '', password: '', phone: '',
        storeName: '', description: '', address: '', whatsappNumber: '',
        logo: '', banner: '', facebook: '', instagram: ''
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear vendedor');
    } finally {
      setCreatingSeller(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
        <p className="text-gray-500 dark:text-gray-400">Gestiona los usuarios de la plataforma: clientes de billetera y vendedores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalClients}</p>
                <p className="text-xs text-gray-500">Clientes Billetera</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeClients}</p>
                <p className="text-xs text-gray-500">Clientes Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <StoreIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSellers}</p>
                <p className="text-xs text-gray-500">Vendedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{verifiedSellers}</p>
                <p className="text-xs text-gray-500">Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="clients" className="gap-2">
            <Wallet className="w-4 h-4" />
            Clientes ({totalClients})
          </TabsTrigger>
          <TabsTrigger value="sellers" className="gap-2">
            <StoreIcon className="w-4 h-4" />
            Vendedores ({totalSellers})
          </TabsTrigger>
        </TabsList>

        {/* ============ CLIENTS TAB ============ */}
        <TabsContent value="clients" className="space-y-4">
          {/* Client Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar clientes por nombre, email o teléfono..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant={clientStatusFilter === 'all' ? 'default' : 'outline'} onClick={() => setClientStatusFilter('all')} size="sm">Todos</Button>
                  <Button variant={clientStatusFilter === 'active' ? 'default' : 'outline'} onClick={() => setClientStatusFilter('active')} size="sm">Activos</Button>
                  <Button variant={clientStatusFilter === 'inactive' ? 'default' : 'outline'} onClick={() => setClientStatusFilter('inactive')} size="sm">Inactivos</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Billetera</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ingenio</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((user, index) => (
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
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="w-3.5 h-3.5" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="w-3.5 h-3.5" />
                              {user.phone || 'Sin teléfono'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.wallet ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(user.wallet.balance)}
                              </p>
                              <div className="flex gap-2 text-xs">
                                <span className="text-green-600">+{formatCurrency(user.wallet.totalIn)}</span>
                                <span className="text-red-500">-{formatCurrency(user.wallet.totalOut)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin billetera</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : ''}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.ingenioAccess ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                              <CheckCircle className="w-3 h-3 mr-1" /> Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400">
                              <XCircle className="w-3 h-3 mr-1" /> Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingUser(user)}>
                                <Eye className="w-4 h-4 mr-2" /> Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Pencil className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleIngenio(user.id, user.ingenioAccess)}>
                                {user.ingenioAccess ? 'Desactivar Ingenio' : 'Activar Ingenio'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className={user.isActive ? "text-orange-600" : "text-green-600"}
                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                              >
                                {user.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => setUserToDelete(user)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron clientes</h3>
              <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
            </div>
          )}
        </TabsContent>

        {/* ============ SELLERS TAB ============ */}
        <TabsContent value="sellers" className="space-y-4">
          {/* Seller Filters + Create Button */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar vendedores por nombre, email o tienda..."
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant={sellerStatusFilter === 'all' ? 'default' : 'outline'} onClick={() => setSellerStatusFilter('all')} size="sm">Todos</Button>
                  <Button variant={sellerStatusFilter === 'active' ? 'default' : 'outline'} onClick={() => setSellerStatusFilter('active')} size="sm">Activos</Button>
                  <Button variant={sellerStatusFilter === 'verified' ? 'default' : 'outline'} onClick={() => setSellerStatusFilter('verified')} size="sm">Verificados</Button>
                  <Button variant={sellerStatusFilter === 'unverified' ? 'default' : 'outline'} onClick={() => setSellerStatusFilter('unverified')} size="sm">Sin Verificar</Button>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={() => setIsCreateSellerOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Vendedor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sellers Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.map((user, index) => (
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
                              <AvatarImage src={user.sellerProfile?.logo || user.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.sellerProfile?.storeName ? (
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                <StoreIcon className="w-3.5 h-3.5 text-purple-500" />
                                {user.sellerProfile.storeName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {user.sellerProfile.isVerified ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] px-1.5 py-0">
                                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Verificada
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400 text-[10px] px-1.5 py-0">
                                    Sin verificar
                                  </Badge>
                                )}
                                {user.sellerProfile.rating > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {user.sellerProfile.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400 italic">Sin tienda</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => handleAssignStore(user)}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Asignar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.sellerProfile?.totalSales || 0} ventas
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(user.sellerProfile?.totalRevenue || 0)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.sellerProfile?.planActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                              <CheckCircle className="w-3 h-3 mr-1" /> Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400">
                              <XCircle className="w-3 h-3 mr-1" /> Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : ''}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingUser(user)}>
                                <Eye className="w-4 h-4 mr-2" /> Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Pencil className="w-4 h-4 mr-2" /> Editar usuario
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignStore(user)}>
                                <StoreIcon className="w-4 h-4 mr-2" />
                                {user.sellerProfile?.storeName ? 'Editar tienda' : 'Asignar tienda'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={user.isActive ? "text-orange-600" : "text-green-600"}
                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                              >
                                {user.isActive ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => setUserToDelete(user)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {filteredSellers.length === 0 && (
            <div className="text-center py-12">
              <StoreIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron vendedores</h3>
              <p className="text-gray-500">Intenta con otros filtros o crea un nuevo vendedor</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============ DIALOGS ============ */}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifique los datos personales y el rol del usuario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editFormData.firstName} onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={editFormData.lastName} onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editFormData.role} onValueChange={(val) => setEditFormData({ ...editFormData, role: val })}>
                <SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger>
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
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Perfil de Usuario</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 text-xl border-4 border-white shadow-lg">
                  <AvatarImage src={viewingUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {viewingUser.firstName[0]}{viewingUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{viewingUser.firstName} {viewingUser.lastName}</h3>
                  <p className="text-gray-500">{viewingUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={cn(getRoleColor(viewingUser.role))}>{getRoleName(viewingUser.role)}</Badge>
                    <Badge variant={viewingUser.isActive ? 'default' : 'secondary'}>{viewingUser.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">Teléfono</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{viewingUser.phone || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">Fecha Registro</Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{formatDate(viewingUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">ID Usuario</Label>
                  <p className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">{viewingUser.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wider">Acceso Ingenio</Label>
                  <p className="font-medium mt-1">
                    {viewingUser.ingenioAccess ? <span className="text-purple-600 font-bold">Autorizado</span> : <span className="text-gray-400">Sin acceso</span>}
                  </p>
                </div>
              </div>

              {/* Wallet Info for clients */}
              {viewingUser.wallet && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" /> Billetera
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Balance</Label>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(viewingUser.wallet.balance)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Total Entradas</Label>
                      <p className="font-medium text-green-600 mt-1">{formatCurrency(viewingUser.wallet.totalIn)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Total Salidas</Label>
                      <p className="font-medium text-red-600 mt-1">{formatCurrency(viewingUser.wallet.totalOut)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Profile Info */}
              {viewingUser.role === 'seller' && viewingUser.sellerProfile && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-purple-600" /> Tienda: {viewingUser.sellerProfile.storeName}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Descripción</Label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{viewingUser.sellerProfile.description || 'Sin descripción'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Dirección</Label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{viewingUser.sellerProfile.address || 'Sin dirección'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Ventas Totales</Label>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{viewingUser.sellerProfile.totalSales} ventas</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Ingresos Totales</Label>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(viewingUser.sellerProfile.totalRevenue)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Comisión</Label>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{viewingUser.sellerProfile.commissionRate}%</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs uppercase tracking-wider">Productos</Label>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{viewingUser.sellerProfile.products?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}
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
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign/Edit Store Dialog */}
      <Dialog open={isCreateStoreOpen} onOpenChange={(open) => { if (!open) { setIsCreateStoreOpen(false); setStoreTargetSeller(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {storeTargetSeller?.sellerProfile?.storeName ? 'Editar Tienda' : 'Asignar Tienda'}
              {storeTargetSeller && ` - ${storeTargetSeller.firstName} ${storeTargetSeller.lastName}`}
            </DialogTitle>
            <DialogDescription>
              {storeTargetSeller?.sellerProfile?.storeName
                ? 'Modifica los datos de la tienda del vendedor.'
                : 'Crea y asigna una tienda a este vendedor.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de Tienda *</Label>
              <Input
                value={storeFormData.storeName}
                onChange={(e) => setStoreFormData({ ...storeFormData, storeName: e.target.value })}
                placeholder="Mi Gran Tienda"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={storeFormData.description}
                onChange={(e) => setStoreFormData({ ...storeFormData, description: e.target.value })}
                placeholder="Descripción de la tienda..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={storeFormData.address}
                  onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })}
                  placeholder="Calle 123..."
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={storeFormData.phone}
                  onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })}
                  placeholder="09xx..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={storeFormData.whatsappNumber}
                  onChange={(e) => setStoreFormData({ ...storeFormData, whatsappNumber: e.target.value })}
                  placeholder="09xx..."
                />
              </div>
              <div className="space-y-2">
                <Label>Email de Tienda</Label>
                <Input
                  value={storeFormData.email}
                  onChange={(e) => setStoreFormData({ ...storeFormData, email: e.target.value })}
                  placeholder="tienda@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={storeFormData.logo}
                    onChange={(e) => setStoreFormData({ ...storeFormData, logo: e.target.value })}
                    placeholder="https://..."
                  />
                  {storeFormData.logo && <img src={storeFormData.logo} alt="Logo" className="w-10 h-10 rounded object-cover border" />}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Banner (URL)</Label>
                <Input
                  value={storeFormData.banner}
                  onChange={(e) => setStoreFormData({ ...storeFormData, banner: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={storeFormData.facebook}
                  onChange={(e) => setStoreFormData({ ...storeFormData, facebook: e.target.value })}
                  placeholder="facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={storeFormData.instagram}
                  onChange={(e) => setStoreFormData({ ...storeFormData, instagram: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateStoreOpen(false); setStoreTargetSeller(null); }}>Cancelar</Button>
            <Button onClick={handleSaveStore} disabled={creatingStore}>
              {creatingStore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {storeTargetSeller?.sellerProfile?.storeName ? 'Guardar Cambios' : 'Crear Tienda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Seller + Store Dialog */}
      <Dialog open={isCreateSellerOpen} onOpenChange={setIsCreateSellerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Vendedor con Tienda</DialogTitle>
            <DialogDescription>
              Crea un usuario vendedor y asígnale una tienda directamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left: Seller user data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Datos del Vendedor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={newSellerForm.firstName}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, firstName: e.target.value })}
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Input
                    value={newSellerForm.lastName}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, lastName: e.target.value })}
                    placeholder="Pérez"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email (Login) *</Label>
                <Input
                  type="email"
                  value={newSellerForm.email}
                  onChange={(e) => setNewSellerForm({ ...newSellerForm, email: e.target.value })}
                  placeholder="vendedor@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={newSellerForm.password}
                  onChange={(e) => setNewSellerForm({ ...newSellerForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres (default: 123456)"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newSellerForm.phone}
                  onChange={(e) => setNewSellerForm({ ...newSellerForm, phone: e.target.value })}
                  placeholder="09xx..."
                />
              </div>
            </div>

            {/* Right: Store data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Datos de la Tienda</h3>
              <div className="space-y-2">
                <Label>Nombre de Tienda *</Label>
                <Input
                  value={newSellerForm.storeName}
                  onChange={(e) => setNewSellerForm({ ...newSellerForm, storeName: e.target.value })}
                  placeholder="Mi Gran Tienda"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={newSellerForm.description}
                  onChange={(e) => setNewSellerForm({ ...newSellerForm, description: e.target.value })}
                  placeholder="Descripción de la tienda..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo (URL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSellerForm.logo}
                      onChange={(e) => setNewSellerForm({ ...newSellerForm, logo: e.target.value })}
                      placeholder="https://..."
                    />
                    {newSellerForm.logo && <img src={newSellerForm.logo} alt="Preview" className="w-10 h-10 rounded object-cover border" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Banner (URL)</Label>
                  <Input
                    value={newSellerForm.banner}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, banner: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={newSellerForm.whatsappNumber}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, whatsappNumber: e.target.value })}
                    placeholder="09xx..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={newSellerForm.address}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, address: e.target.value })}
                    placeholder="Calle 123..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input
                    value={newSellerForm.facebook}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, facebook: e.target.value })}
                    placeholder="facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input
                    value={newSellerForm.instagram}
                    onChange={(e) => setNewSellerForm({ ...newSellerForm, instagram: e.target.value })}
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSellerOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSeller} disabled={creatingSeller}>
              {creatingSeller && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Vendedor + Tienda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
