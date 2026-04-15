import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Truck,
    MoreVertical,
    Edit2,
    Trash2,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { suppliersApi } from '@/lib/api';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Supplier {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    paymentTerms: string;
    notes: string;
}

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export default function Suppliers() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.sellerProfile && user.sellerProfile.plan) {
            const features = user.sellerProfile.plan.features || [];
            if (!features.some(f => f.toLowerCase().includes('proveedores'))) {
                toast.error('Tu plan no incluye gestión de proveedores');
                navigate('/vendedor');
            }
        }
    }, [user, navigate]);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        paymentTerms: 'contado',
        notes: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const data = await suppliersApi.getAll();
            setSuppliers(data);
        } catch (error) {
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingSupplier) {
                await suppliersApi.update(editingSupplier.id, formData);
            } else {
                await suppliersApi.create(formData);
            }

            toast.success(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado');
            setIsDialogOpen(false);
            setEditingSupplier(null);
            setFormData({
                name: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                taxId: '',
                paymentTerms: 'contado',
                notes: ''
            });
            fetchSuppliers();
        } catch (error) {
            toast.error('Error al guardar proveedor');
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contactName: supplier.contactName || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            taxId: supplier.taxId || '',
            paymentTerms: supplier.paymentTerms || 'contado',
            notes: supplier.notes || ''
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

        try {
            await suppliersApi.delete(id);
            toast.success('Proveedor eliminado');
            fetchSuppliers();
        } catch (error) {
            toast.error('Error al eliminar proveedor');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.taxId?.toLowerCase().includes(search.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona tus proveedores y sus condiciones comerciales.</p>
                </div>
                <Button onClick={() => {
                    setEditingSupplier(null);
                    setFormData({
                        name: '',
                        contactName: '',
                        email: '',
                        phone: '',
                        address: '',
                        taxId: '',
                        paymentTerms: 'contado',
                        notes: ''
                    });
                    setIsDialogOpen(true);
                }} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, RUC o contacto..."
                        className="pl-10 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>RUC / Tax ID</TableHead>
                            <TableHead>Forma de Pago</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Cargando proveedores...
                                </TableCell>
                            </TableRow>
                        ) : filteredSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {search ? 'No se encontraron proveedores para tu búsqueda.' : 'Aún no tienes proveedores registrados.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                                                <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {supplier.address || 'Sin dirección'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm font-medium">{supplier.contactName || '-'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {supplier.phone && <Phone className="w-3 h-3 text-gray-400" />}
                                                {supplier.email && <Mail className="w-3 h-3 text-gray-400" />}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {supplier.taxId || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 capitalize">
                                            {supplier.paymentTerms}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs space-y-1">
                                            {supplier.phone && <p>{supplier.phone}</p>}
                                            {supplier.email && <p className="text-gray-500">{supplier.email}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(supplier.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
                        <DialogDescription>
                            Completa la información del proveedor para el registro de compras.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Proveedor *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Distribuidora Central"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxId">RUC / Tax ID</Label>
                            <Input
                                id="taxId"
                                value={formData.taxId}
                                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                placeholder="Ej: 80001234-5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Nombre del Contacto</Label>
                            <Input
                                id="contactName"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                placeholder="Nombre de la persona"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentTerms">Forma de Pago</Label>
                            <Select
                                value={formData.paymentTerms}
                                onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contado">Contado</SelectItem>
                                    <SelectItem value="credito">Crédito</SelectItem>
                                    <SelectItem value="15 dias">15 días</SelectItem>
                                    <SelectItem value="30 dias">30 días</SelectItem>
                                    <SelectItem value="60 dias">60 días</SelectItem>
                                    <SelectItem value="90 dias">90 días</SelectItem>
                                    <SelectItem value="semanal">Semanal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+595 9xx xxx xxx"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="proveedor@email.com"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Av. Principal 123, Ciudad"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notes">Notas / Observaciones</Label>
                            <Input
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Instrucciones especiales de entrega o pago..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!formData.name} className="bg-green-600 hover:bg-green-700">
                            Guardar Proveedor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
