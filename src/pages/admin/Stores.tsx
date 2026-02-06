import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, Store, MapPin, Phone, Star, CheckCircle, XCircle, Loader2, Camera, Facebook, Instagram } from 'lucide-react';
import { usersApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';

interface StoreData {
  id: string; // User ID
  sellerId: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  productCount: number;
  // Added fields
  firstName: string;
  lastName: string;
  whatsappNumber: string;
  facebook: string;
  instagram: string;
}

export default function AdminStores() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [viewingStore, setViewingStore] = useState<StoreData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // For edit mode

  // New Store Form State
  const [formData, setFormData] = useState({
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

  const fetchStores = async () => {
    try {
      setLoading(true);
      const allUsers = await usersApi.getAll();
      const sellers = allUsers.filter((u: any) => u.role === 'seller');

      const formattedSellers = sellers.map((u: any) => ({
        id: u.id,
        sellerId: u.id,
        name: u.sellerProfile?.storeName || `${u.firstName}'s Store`,
        description: u.sellerProfile?.description || '',
        logo: u.sellerProfile?.logo || '',
        banner: u.sellerProfile?.banner || '',
        address: u.sellerProfile?.address || u.address || '',
        phone: u.sellerProfile?.phone || u.phone || '',
        email: u.sellerProfile?.email || u.email || '',
        isActive: u.isActive,
        productCount: u.sellerProfile?.products?.length || 0,
        // New fields
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        whatsappNumber: u.sellerProfile?.whatsappNumber || '',
        facebook: u.sellerProfile?.socialLinks?.facebook || '',
        instagram: u.sellerProfile?.socialLinks?.instagram || ''
      }));

      setStores(formattedSellers);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar tiendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreateStore = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.storeName) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setCreating(true);
    try {
      let userId = editingId;

      if (!userId) {
        // 1. Create User (Only if not editing)
        const registerRes: any = await authApi.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password || '123456', // Default password if not provided
          phone: formData.phone,
          address: formData.address,
          role: 'seller'
        });
        userId = registerRes.user.id;
      }

      // 2. Update Seller Profile
      await usersApi.updateSellerProfileById(userId as string, {
        storeName: formData.storeName,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        logo: formData.logo,
        banner: formData.banner,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram
        }
      });

      toast.success(editingId ? 'Tienda actualizada con éxito' : 'Tienda creada con éxito');
      setIsCreateOpen(false);
      resetForm();
      fetchStores();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al guardar tienda');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', password: '', phone: '',
      storeName: '', description: '', address: '', whatsappNumber: '',
      logo: '', banner: '', facebook: '', instagram: ''
    });
    setEditingId(null);
  };

  const handleEditClick = (store: StoreData) => {
    setEditingId(store.id);
    setFormData({
      firstName: store.firstName,
      lastName: store.lastName,
      email: store.email,
      password: '', // Can't retrieve password
      phone: store.phone,
      storeName: store.name,
      description: store.description,
      address: store.address,
      whatsappNumber: store.whatsappNumber,
      logo: store.logo,
      banner: store.banner,
      facebook: store.facebook,
      instagram: store.instagram
    });
    setIsCreateOpen(true);
  };

  const handleToggleStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      await usersApi.updateStatus(storeId, !currentStatus);
      toast.success(currentStatus ? 'Tienda desactivada' : 'Tienda activada');
      fetchStores();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleDeleteClick = (storeId: string) => {
    setStoreToDelete(storeId);
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;

    try {
      await usersApi.delete(storeToDelete);
      toast.success('Tienda eliminada con éxito');
      fetchStores();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar tienda');
    } finally {
      setStoreToDelete(null);
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && store.isActive) ||
      (filterStatus === 'inactive' && !store.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading && stores.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tiendas</h1>
          <p className="text-gray-500">Gestiona las tiendas del marketplace</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tienda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Tienda' : 'Crear Nueva Tienda'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column: User Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Datos del Vendedor (Usuario)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email (Login) *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contraseña {editingId && '(Dejar en blanco para mantener)'} *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Sin cambios" : "Mínimo 6 caracteres"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono Personal</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09xx..."
                  />
                </div>
              </div>

              {/* Right Column: Store Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Perfil de la Tienda</h3>
                <div className="space-y-2">
                  <Label>Nombre de Tienda *</Label>
                  <Input
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="Mi Gran Tienda"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo (URL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://..."
                    />
                    {formData.logo && <img src={formData.logo} alt="Preview" className="w-10 h-10 rounded object-cover border" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner (URL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.banner}
                      onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                      placeholder="https://..."
                    />
                    {formData.banner && <img src={formData.banner} alt="Preview" className="w-16 h-10 rounded object-cover border" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción corta de la tienda..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WhatsApp (Tienda)</Label>
                    <Input
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      placeholder="09xx..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle 123..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook (Link)</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input
                        className="pl-9"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="facebook.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram (@usr)</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input
                        className="pl-9"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="@usuario"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateStore} disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Guardar Cambios' : 'Crear Tienda Completa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar tiendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Activas
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                size="sm"
              >
                Inactivas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store, index) => {
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-blue-50/50 border-blue-100">
                {/* Banner */}
                <div className="h-32 bg-gray-200 relative group">
                  {store.banner ? (
                    <img src={store.banner} alt={store.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white backdrop-blur-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingStore(store)}>Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(store)}>Editar tienda</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => handleDeleteClick(store.id)}>Eliminar tienda</DropdownMenuItem>
                        <DropdownMenuItem
                          className={store.isActive ? "text-orange-600" : "text-green-600"}
                          onClick={() => handleToggleStatus(store.id, store.isActive)}
                        >
                          {store.isActive ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Logo and Name */}
                  <div className="flex items-start gap-3 -mt-8 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-md p-1 border border-gray-100">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                          <Store className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="pt-8">
                      <h3 className="font-semibold text-gray-900 leading-tight">{store.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>4.8</span>
                        <span>• {store.productCount} prods</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">{store.description || 'Sin descripción'}</p>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="truncate">{store.address || 'Sin dirección'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span>{store.phone || 'Sin teléfono'}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">ID: {store.id.substring(0, 8)}...</span>
                    </div>
                    <Badge variant={store.isActive ? 'default' : 'secondary'} className={store.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {store.isActive ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Activa</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inactiva</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron tiendas</h3>
          <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro absolutamente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta tienda permanentemente? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStore} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingStore} onOpenChange={(open) => !open && setViewingStore(null)}>
        {viewingStore && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de {viewingStore.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Cover & Logo */}
              <div className="h-40 bg-gray-200 rounded-lg relative overflow-hidden">
                {viewingStore.banner ? (
                  <img src={viewingStore.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
                )}
                <div className="absolute -bottom-6 left-6">
                  <div className="w-24 h-24 bg-white rounded-lg p-1 shadow-lg">
                    {viewingStore.logo ? (
                      <img src={viewingStore.logo} alt="Logo" className="w-full h-full rounded-md object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                        <Store className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Información Principal</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Store className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{viewingStore.name}</p>
                        <p className="text-sm text-gray-500">{viewingStore.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{viewingStore.address || 'No especificada'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${viewingStore.isActive ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm text-gray-700">{viewingStore.isActive ? 'Tienda Activa' : 'Tienda Inactiva'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Contacto y Redes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{viewingStore.phone} (Móvil)</span>
                        {viewingStore.whatsappNumber && <span className="text-xs text-gray-500">{viewingStore.whatsappNumber} (WhatsApp)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 break-all">{viewingStore.email}</span>
                    </div>
                    {(viewingStore.facebook || viewingStore.instagram) && (
                      <div className="flex gap-3 mt-2">
                        {viewingStore.facebook && (
                          <a href={viewingStore.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                        {viewingStore.instagram && (
                          <a href={viewingStore.instagram.startsWith('http') ? viewingStore.instagram : `https://instagram.com/${viewingStore.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors">
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">Datos del Propietario</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nombre:</span>
                    <span className="ml-2 text-gray-900">{viewingStore.firstName} {viewingStore.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ID Usuario:</span>
                    <span className="ml-2 text-gray-900 font-mono text-xs">{viewingStore.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setViewingStore(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
