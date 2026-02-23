import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, Package, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Upload, X, ImagePlus, Link2 } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { productsApi, suppliersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { compressImage } from '@/lib/imageUtils';
import type { Product, ProductType, ProductVisibility } from '@/types';

const MAX_PRODUCT_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PRODUCT_CATEGORIES = [
  'Tecnología',
  'Ropa y Accesorios',
  'Hogar y Muebles',
  'Alimentos y Bebidas',
  'Salud y Belleza',
  'Deportes y Fitness',
  'Juguetes y Hobbies',
  'Libros y Papelería',
  'Automotriz',
  'Servicios',
  'Otros'
];

export default function SellerProducts() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'online' | 'local'>('all');

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      if (user?.sellerProfile?.id) {
        const data = await productsApi.getAll({ sellerId: user.sellerProfile.id });
        setProducts(data);
      }
    } catch (error) {
      toast.error('Error al cargar productos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [user?.id]);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
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
    images: [],
    supplierId: null
  });

  // Image management state
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }
    const currentImages = formData.images || [];
    if (currentImages.length >= MAX_PRODUCT_IMAGES) {
      toast.error(`Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto`);
      return;
    }
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 800, 800, 0.8);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), compressed] }));
    } catch {
      toast.error('Error al procesar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) {
      toast.error('Ingresa una URL válida (https://...)');
      return;
    }
    const currentImages = formData.images || [];
    if (currentImages.length >= MAX_PRODUCT_IMAGES) {
      toast.error(`Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto`);
      return;
    }
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
    setImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all' || product.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  const handleOpenModal = (product?: Product) => {
    setImageUrl('');
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
        images: [],
        supplierId: null
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
        await productsApi.create({
          ...formData,
          sellerId: user?.sellerProfile?.id,
          storeId: user?.sellerProfile?.id || 'store-generic'
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
        console.error(error);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await productsApi.update(id, { status: newStatus });
      toast.info(`Producto ${newStatus === 'active' ? 'activado' : 'desactivado'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Productos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus productos y servicios</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
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
              <Button variant={visibilityFilter === 'all' ? 'default' : 'outline'} onClick={() => setVisibilityFilter('all')} size="sm">Todos</Button>
              <Button variant={visibilityFilter === 'online' ? 'default' : 'outline'} onClick={() => setVisibilityFilter('online')} size="sm">En línea</Button>
              <Button variant={visibilityFilter === 'local' ? 'default' : 'outline'} onClick={() => setVisibilityFilter('local')} size="sm">Local</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-gray-400">Producto</TableHead>
                  <TableHead className="dark:text-gray-400">Precio</TableHead>
                  <TableHead className="dark:text-gray-400">Stock</TableHead>
                  <TableHead className="dark:text-gray-400">Proveedor</TableHead>
                  <TableHead className="dark:text-gray-400">Visibilidad</TableHead>
                  <TableHead className="dark:text-gray-400">Estado</TableHead>
                  <TableHead className="text-right dark:text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
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
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium dark:text-white">{formatCurrency(product.price)}</p>
                        {product.comparePrice && (
                          <p className="text-sm text-gray-400 line-through dark:text-gray-500">{formatCurrency(product.comparePrice)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${product.stock < 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-300'}`}>
                        {product.stock} unidades
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.supplier?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.visibility === 'online' ? 'default' : 'secondary'}>
                        {product.visibility === 'online' ? 'En línea' : product.visibility === 'local' ? 'Local' : 'Ambos'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.status === 'active'}
                          onCheckedChange={() => handleToggleStatus(product.id)}
                        />
                        <span className="text-sm dark:text-gray-400">{product.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                          <DropdownMenuItem onClick={() => handleOpenModal(product)} className="dark:text-gray-300 dark:hover:bg-slate-800"><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:hover:bg-slate-800" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
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

      {/* Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Completa los datos del producto. Los cálculos financieros se realizan automáticamente.
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

            {/* Image Management Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 dark:text-gray-300">
                <ImagePlus className="w-4 h-4" />
                Imágenes del Producto ({(formData.images || []).length}/{MAX_PRODUCT_IMAGES})
              </Label>

              {/* Image previews */}
              {(formData.images || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(formData.images || []).map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                      <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[9px] text-center py-0.5">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area */}
              {(formData.images || []).length < MAX_PRODUCT_IMAGES && (
                <div className="space-y-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(f => handleImageFile(f));
                      e.target.value = '';
                    }}
                  />
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      files.forEach(f => handleImageFile(f));
                    }}
                    className="border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-600 rounded-lg p-4 text-center cursor-pointer transition-colors"
                  >
                    {uploadingImage ? (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        Procesando imagen...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Arrastra imágenes aquí o haz clic para seleccionar</span>
                      </div>
                    )}
                  </div>

                  {/* URL input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                        placeholder="Pegar URL de imagen (https://...)"
                        className="pl-8 text-sm h-9"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleAddImageUrl}>
                      Agregar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-2">
              <Label>Proveedor (Opcional)</Label>
              <Select
                value={formData.supplierId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, supplierId: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 dark:text-white">
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
                  <Label htmlFor="price" className="text-green-600 dark:text-green-400 font-bold">Precio Total (Venta)</Label>
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
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                * Ingresa Costo y % para obtener Precio, o Costo y Precio para obtener %.
              </p>
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
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveProduct}>
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
