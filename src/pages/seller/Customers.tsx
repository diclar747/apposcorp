import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Users,
    MoreVertical,
    Edit2,
    Trash2,
    Phone,
    MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customersApi } from '@/lib/api';
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
import { toast } from 'sonner';

interface Customer {
    id: string;
    fullName: string;
    address: string;
    phone: string;
    ruc: string;
    city: string;
    notes: string;
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        ruc: '',
        phone: '',
        city: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await customersApi.getAll();
            setCustomers(data);
        } catch (error) {
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingCustomer) {
                await customersApi.update(editingCustomer.id, formData);
            } else {
                await customersApi.create(formData);
            }

            toast.success(editingCustomer ? 'Cliente actualizado' : 'Cliente creado');
            setIsDialogOpen(false);
            setEditingCustomer(null);
            setFormData({ fullName: '', ruc: '', phone: '', city: '', address: '', notes: '' });
            fetchCustomers();
        } catch (error) {
            toast.error('Error al guardar cliente');
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            fullName: customer.fullName,
            ruc: customer.ruc || '',
            phone: customer.phone || '',
            city: customer.city || '',
            address: customer.address || '',
            notes: customer.notes || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

        try {
            await customersApi.delete(id);
            toast.success('Cliente eliminado');
            fetchCustomers();
        } catch (error) {
            toast.error('Error al eliminar cliente');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.ruc?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona tus clientes y sus datos comerciales.</p>
                </div>
                <Button onClick={() => {
                    setEditingCustomer(null);
                    setFormData({ fullName: '', ruc: '', phone: '', city: '', address: '', notes: '' });
                    setIsDialogOpen(true);
                }} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, RUC o teléfono..."
                        className="pl-10 h-10 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="dark:border-slate-800">
                            <TableHead className="dark:text-gray-400">Cliente</TableHead>
                            <TableHead className="dark:text-gray-400">RUC</TableHead>
                            <TableHead className="dark:text-gray-400">Teléfono</TableHead>
                            <TableHead className="dark:text-gray-400">Dirección</TableHead>
                            <TableHead className="text-right dark:text-gray-400">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    Cargando clientes...
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    {search ? 'No se encontraron clientes para tu búsqueda.' : 'Aún no tienes clientes registrados.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{customer.fullName}</p>
                                                {customer.city && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-gray-400" /> {customer.city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {customer.ruc || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm dark:text-gray-300">
                                            {customer.phone ? (
                                                <>
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {customer.phone}
                                                </>
                                            ) : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                                            {customer.address || '-'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="dark:text-gray-400 dark:hover:bg-slate-800">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                                                <DropdownMenuItem onClick={() => handleEdit(customer)} className="dark:text-gray-300 dark:hover:bg-slate-800">
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 dark:text-red-400 dark:hover:bg-slate-800"
                                                    onClick={() => handleDelete(customer.id)}
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
                <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Completa la información del cliente para el registro de ventas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo *</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ruc">RUC</Label>
                            <Input
                                id="ruc"
                                value={formData.ruc}
                                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                placeholder="Ej: 80001234-5"
                            />
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
                            <Label htmlFor="city">Ciudad</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="Ej: Asunción"
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
                                placeholder="Observaciones adicionales..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={!formData.fullName} className="bg-green-600 hover:bg-green-700">
                            Guardar Cliente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
