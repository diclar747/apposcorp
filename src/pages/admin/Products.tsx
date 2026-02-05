import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, Package, Edit, Trash2, Eye } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Product, ProductType, ProductVisibility } from '@/types';
import { useAuthStore } from '@/stores';

export default function AdminProducts() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'out_of_stock'>('all');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getAll(); // Admin fetches ALL products
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    cost: 0,
    profitPercentage: 0,
    stock: 0,
    category: '',
    type: 'physical',
    visibility: 'both',
    status: 'active',
    images: []
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: 0,
        cost: 0,
        profitPercentage: 0,
        stock: 0,
        category: '',
        type: 'physical',
        visibility: 'both',
        status: 'active',
        images: ['https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=600&h=600&fit=crop']
      });
    }
    setIsModalOpen(true);
  };

  const handleCalculatePrice = (cost: number, margin: number) => {
    const price = cost * (1 + margin / 100);
    setFormData(prev => ({ ...prev, cost, profitPercentage: margin, price: Math.round(price) }));
  };

  const handleCalculateMargin = (cost: number, price: number) => {
    if (cost === 0) return;
    const margin = ((price - cost) / cost) * 100;
    setFormData(prev => ({ ...prev, cost, price, profitPercentage: Math.round(margin * 100) / 100 }));
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.sku || !formData.category) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
        toast.success('Producto actualizado correctamente');
      } else {
        // Admin needs to provide a sellerId if they are creating it. 
        // For now, we assume they are creating for themselves (if they have a seller profile) or we might need a "Select Seller" field later.
        // If user is superadmin but has no seller profile, this might fail on backend depending on logic.
        // Let's try passing the user's ID as sellerId for now, or fallback to a system default if needed.

        await productsApi.create({
          ...formData,
          sellerId: user?.id, // Will be handled by backend to prefer sellerProfile or direct ID
          storeId: 'admin-store' // Placeholder
        });
        toast.success('Producto creado correctamente');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Error al guardar el producto');
      console.error(error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await productsApi.delete(id);
        toast.success('Producto eliminado');
        fetchProducts();
      } catch (error) {
        toast.error('Error al eliminar el producto');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500">Gestiona todos los productos del marketplace</p>
        </div>
        <Button className="bg-blue-600" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} size="sm">Todos</Button>
              <Button variant={statusFilter === 'active' ? 'default' : 'outline'} onClick={() => setStatusFilter('active')} size="sm">Activos</Button>
              <Button variant={statusFilter === 'out_of_stock' ? 'default' : 'outline'} onClick={() => setStatusFilter('out_of_stock')} size="sm">Sin stock</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => {
                  // Adapt to what API returns. The API likely returns seller with store include.
                  // Checking api types: Product has optional 'seller' with 'store'
                  const storeName = (product as any).seller?.store?.name || (product as any).seller?.user?.firstName || 'Desconocido';

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{storeName}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                          {product.comparePrice && (
                            <p className="text-sm text-gray-400 line-through">{formatCurrency(product.comparePrice)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${product.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stock} unidades
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'active' ? 'default' : product.status === 'out_of_stock' ? 'destructive' : 'secondary'}>
                          {product.status === 'active' ? 'Activo' : product.status === 'out_of_stock' ? 'Sin stock' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(product)}><Eye className="w-4 h-4 mr-2" /> Ver/Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenModal(product)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
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

      {/* Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              Completa los datos del producto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: iPhone 15 Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">Código / SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ej: IPH-15P-256"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las características principales..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ej: Tecnología"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Inicial</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Gestión Financiera
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo (Compra)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      handleCalculatePrice(cost, formData.profitPercentage || 0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profit">Ganancia (%)</Label>
                  <Input
                    id="profit"
                    type="number"
                    value={formData.profitPercentage}
                    onChange={(e) => {
                      const margin = parseFloat(e.target.value) || 0;
                      handleCalculatePrice(formData.cost || 0, margin);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-green-600 font-bold">Precio Total (Venta)</Label>
                  <Input
                    id="price"
                    type="number"
                    className="border-green-200 focus-visible:ring-green-500 font-bold"
                    value={formData.price}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      handleCalculateMargin(formData.cost || 0, price);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibilidad</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: ProductVisibility) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Solo Online</SelectItem>
                    <SelectItem value="local">Solo POS / Local</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Producto</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Producto Físico</SelectItem>
                    <SelectItem value="service">Servicio</SelectItem>
                    <SelectItem value="digital">Producto Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveProduct}>
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
