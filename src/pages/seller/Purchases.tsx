import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    FileText,
    Calendar as CalendarIcon,
    Truck,
    Package,
    X,
    Save,
    ChevronRight,
    ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productsApi, suppliersApi, purchasesApi } from '@/lib/api';
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
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock: number;
}

interface Supplier {
    id: string;
    name: string;
}

interface PurchaseItem {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

interface Purchase {
    id: string;
    invoiceName: string;
    invoiceNumber: string;
    purchaseDate: string;
    totalAmount: number;
    supplier: { name: string };
    items: any[];
}

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export default function Purchases() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.sellerProfile && user.sellerProfile.planActive) {
            const plan = user.sellerProfile.plan;
            const tier = plan?.tier?.toLowerCase() || 'basic';
            const features = plan?.features || [];
            const isComercial = !user.sellerProfile.planId;
            const isStandardOrBetter = tier === 'standard' || tier === 'premium' || isComercial;

            if (!features.some(f => f.toLowerCase().includes('compras')) && !isStandardOrBetter) {
                toast.error('Tu plan no incluye gestión de compras');
                navigate('/vendedor');
            }
        }
    }, [user, navigate]);

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        supplierId: '',
        invoiceName: '',
        invoiceNumber: '',
        purchaseDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });
    const [selectedItems, setSelectedItems] = useState<PurchaseItem[]>([]);

    // Product Selection State
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [purchasesData, productsData, suppliersData] = await Promise.all([
                purchasesApi.getAll(),
                productsApi.getAll(),
                suppliersApi.getAll()
            ]);

            setPurchases(purchasesData);
            setProducts(productsData);
            setSuppliers(suppliersData);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const addItem = (product: Product) => {
        const existing = selectedItems.find(item => item.productId === product.id);
        if (existing) {
            toast.info('El producto ya está en la lista');
            return;
        }
        setSelectedItems([...selectedItems, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitCost: product.cost || 0,
            totalCost: product.cost || 0
        }]);
        setSearchTerm('');
    };

    const removeItem = (productId: string) => {
        setSelectedItems(selectedItems.filter(item => item.productId !== productId));
    };

    const updateItem = (productId: string, field: string, value: number) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.productId === productId) {
                const newItem = { ...item, [field]: value };
                newItem.totalCost = newItem.quantity * newItem.unitCost;
                return newItem;
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const handleSave = async () => {
        if (!formData.supplierId || !formData.invoiceNumber || selectedItems.length === 0) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        try {
            await purchasesApi.create({
                ...formData,
                items: selectedItems
            });

            toast.success('Compra registrada correctamente');
            setIsDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Error al registrar compra');
        }
    };

    const resetForm = () => {
        setFormData({
            supplierId: '',
            invoiceName: '',
            invoiceNumber: '',
            purchaseDate: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
        setSelectedItems([]);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compras / Entradas</h2>
                    <p className="text-gray-500 dark:text-gray-400">Registra las compras a proveedores para aumentar tu stock.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Compra
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Factura / Nombre</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Productos</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Cargando compras...
                                </TableCell>
                            </TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No se han registrado compras aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            purchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(purchase.purchaseDate), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{purchase.invoiceNumber}</p>
                                            <p className="text-xs text-gray-500">{purchase.invoiceName || 'Sin nombre'}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{purchase.supplier.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {purchase.items?.length || 0} ítems
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-bold text-green-600">
                                        ₲ {purchase.totalAmount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Ver Detalle</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Compra</DialogTitle>
                        <DialogDescription>
                            Ingresa los datos de la factura y agrega los productos comprados para actualizar el inventario.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Proveedor *</Label>
                            <Select
                                value={formData.supplierId}
                                onValueChange={(val) => setFormData({ ...formData, supplierId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nro. de Factura *</Label>
                            <Input
                                placeholder="001-001-0000001"
                                value={formData.invoiceNumber}
                                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha de Compra</Label>
                            <Input
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Nombre de la Factura (Opcional)</Label>
                            <Input
                                placeholder="Ej: Insumos de Oficina"
                                value={formData.invoiceName}
                                onChange={(e) => setFormData({ ...formData, invoiceName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Input
                                placeholder="Observaciones..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                Productos en la Compra
                            </h3>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar producto..."
                                    className="pl-10 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 mt-1 border border-gray-100 dark:border-slate-800 rounded-lg shadow-lg z-50">
                                        {filteredProducts.map(p => (
                                            <button
                                                key={p.id}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                onClick={() => addItem(p)}
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{p.name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.stock}</p>
                                                </div>
                                                <Plus className="w-4 h-4 text-blue-500" />
                                            </button>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-500">No se encontraron productos.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="min-h-[200px] bg-gray-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-gray-200 dark:border-slate-800 p-2">
                            {selectedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                                    <p>Agrega productos a la compra para actualizar el inventario.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="w-24">Cant.</TableHead>
                                            <TableHead className="w-32">Costo Unit.</TableHead>
                                            <TableHead className="w-32">Total</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedItems.map((item) => (
                                            <TableRow key={item.productId}>
                                                <TableCell>
                                                    <p className="font-medium text-sm">{item.productName}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className="h-8"
                                                        value={item.unitCost}
                                                        onChange={(e) => updateItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    ₲ {item.totalCost.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                        onClick={() => removeItem(item.productId)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <div className="mt-4 flex flex-col items-end gap-2">
                            <div className="flex items-center gap-4 text-gray-500">
                                <span>Subtotal Items:</span>
                                <span className="font-medium">{selectedItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xl font-bold text-gray-900 dark:text-white">
                                <span>Total Compra:</span>
                                <span className="text-green-600">₲ {calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Finalizar Registro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
