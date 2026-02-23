import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Settings,
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    Layout,
    DollarSign,
    Percent,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { plansApi } from '@/lib/api';
import type { SubscriptionPlan, PlanTier } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        tier: 'basic' as PlanTier,
        description: '',
        price: 0,
        prices: {
            monthly: 0,
            quarterly: 0,
            semi_annual: 0,
            annual: 0,
        },
        features: [] as string[],
        productLimit: 0,
        isCommissionBased: false,
        commissionPercentage: 0,
        isActive: true,
    });

    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await plansApi.getAll();
            setPlans(data);
        } catch (error) {
            // In a real app, this would be an API call. For now, we'll use mock data if it fails
            const mockPlans: SubscriptionPlan[] = [
                {
                    id: '1',
                    name: 'Plan Básico',
                    tier: 'basic',
                    description: 'Ideal para pequeños comerciantes empezando.',
                    price: 80000,
                    prices: { monthly: 80000, quarterly: 220000, semi_annual: 420000, annual: 800000 },
                    features: ['POS', 'Tienda Online', 'Gestión de Productos', 'Ventas', 'QR OKPOS'],
                    productLimit: 100,
                    isCommissionBased: false,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    name: 'Plan Estándar',
                    tier: 'standard',
                    description: 'Para negocios en crecimiento que necesitan más control.',
                    price: 120000,
                    prices: { monthly: 120000, quarterly: 330000, semi_annual: 620000, annual: 1200000 },
                    features: ['Todo lo del Básico', 'Proveedores', 'Clientes', 'Compras', 'Pedidos', 'QR OKPOS'],
                    productLimit: 250,
                    isCommissionBased: false,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '3',
                    name: 'Plan Comercial',
                    tier: 'commercial',
                    description: 'Solución completa para empresas establecidas.',
                    price: 160000,
                    prices: { monthly: 160000, quarterly: 440000, semi_annual: 830000, annual: 1600000 },
                    features: ['Todo lo del Estándar', 'Reportes Avanzados', 'Gestión de Caja', 'Soporte 24/7', 'QR OKPOS'],
                    productLimit: 500,
                    isCommissionBased: false,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            ];
            setPlans(mockPlans);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan?: SubscriptionPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                tier: plan.tier,
                description: plan.description,
                price: plan.price,
                prices: plan.prices,
                features: plan.features,
                productLimit: plan.productLimit,
                isCommissionBased: plan.isCommissionBased,
                commissionPercentage: plan.commissionPercentage || 0,
                isActive: plan.isActive,
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                tier: 'basic',
                description: '',
                price: 0,
                prices: { monthly: 0, quarterly: 0, semi_annual: 0, annual: 0 },
                features: [],
                productLimit: 0,
                isCommissionBased: false,
                commissionPercentage: 0,
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSavePlan = async () => {
        try {
            if (editingPlan) {
                await plansApi.update(editingPlan.id, formData);
                toast.success('Plan actualizado correctamente');
            } else {
                await plansApi.create(formData);
                toast.success('Plan creado correctamente');
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            toast.error('Error al guardar el plan');
        }
    };

    const addFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData({
                ...formData,
                features: [...formData.features, newFeature.trim()]
            });
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        const updatedFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({ ...formData, features: updatedFeatures });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Planes</h1>
                    <p className="text-gray-500 dark:text-gray-400">Configura los paquetes y beneficios para los comerciantes.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="relative overflow-hidden border-2 hover:border-blue-500 transition-all group dark:bg-slate-900 dark:border-slate-800">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
                                    {plan.tier}
                                </Badge>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={() => handleOpenModal(plan)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardTitle className="text-xl font-bold dark:text-white">{plan.name}</CardTitle>
                            <CardDescription className="dark:text-gray-400">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="py-2 border-y border-gray-100 dark:border-slate-800">
                                {plan.isCommissionBased ? (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <Percent className="w-5 h-5 font-bold" />
                                        <span className="text-2xl font-black">{plan.commissionPercentage}%</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">por cada venta</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(plan.price)}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">/mes</span>
                                        </div>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Límite: {plan.productLimit} productos</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Beneficios incl.</p>
                                <ul className="space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Plan Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
                        <DialogDescription>
                            Configura los beneficios y costos del paquete para los vendedores.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Plan</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Plan Profesional"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tier">Nivel</Label>
                                <Select value={formData.tier} onValueChange={(val: PlanTier) => setFormData({ ...formData, tier: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona nivel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="basic">Básico</SelectItem>
                                        <SelectItem value="standard">Estándar</SelectItem>
                                        <SelectItem value="commercial">Comercial</SelectItem>
                                        <SelectItem value="custom">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Breve resumen de quién debería usar este plan"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="limit">Límite de Productos</Label>
                            <Input
                                id="limit"
                                type="number"
                                value={formData.productLimit}
                                onChange={(e) => setFormData({ ...formData, productLimit: Number(e.target.value) })}
                                placeholder="Ej: 100"
                            />
                        </div>

                        {/* Pricing Model */}
                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold">Modelo de Cobro</Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Elige entre cuota fija o comisión por venta</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="isCommission" className="text-sm font-medium">Bajo Comisión</Label>
                                    <Checkbox
                                        id="isCommission"
                                        checked={formData.isCommissionBased}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isCommissionBased: checked === true })}
                                    />
                                </div>
                            </div>

                            {formData.isCommissionBased ? (
                                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                                    <Label htmlFor="commission" className="flex items-center gap-2">
                                        <Percent className="w-4 h-4" /> Porcentaje de Comisión
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="commission"
                                            type="number"
                                            value={formData.commissionPercentage}
                                            onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                                            className="max-w-[150px]"
                                        />
                                        <span className="text-sm text-gray-500">% por cada venta procesada en la plataforma.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-slate-800">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Precios por Ciclo de Facturación</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="p-monthly" className="text-xs">Mensual (Base)</Label>
                                            <Input
                                                id="p-monthly"
                                                type="number"
                                                value={formData.prices.monthly}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        price: val,
                                                        prices: { ...formData.prices, monthly: val }
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="p-quarterly" className="text-xs">Trimestral (3 meses)</Label>
                                            <Input
                                                id="p-quarterly"
                                                type="number"
                                                value={formData.prices.quarterly}
                                                onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, quarterly: Number(e.target.value) } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="p-semiannual" className="text-xs">Semestral (6 meses)</Label>
                                            <Input
                                                id="p-semiannual"
                                                type="number"
                                                value={formData.prices.semi_annual}
                                                onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, semi_annual: Number(e.target.value) } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="p-annual" className="text-xs">Anual (12 meses)</Label>
                                            <Input
                                                id="p-annual"
                                                type="number"
                                                value={formData.prices.annual}
                                                onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, annual: Number(e.target.value) } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features Management */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Beneficios y Características
                            </Label>

                            <div className="flex gap-2">
                                <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="Ej: Reportes en tiempo real"
                                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                />
                                <Button type="button" size="sm" onClick={addFeature}>Agregar</Button>
                            </div>

                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                {formData.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-800">
                                        <span className="text-sm dark:text-gray-300">{feature}</span>
                                        <button onClick={() => removeFeature(idx)} className="text-red-400 hover:text-red-600">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {formData.features.length === 0 && (
                                    <p className="text-xs text-center text-gray-400 py-4">No has agregado características aún.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSavePlan} className="bg-blue-600 hover:bg-blue-700">
                            {editingPlan ? 'Actualizar' : 'Crear'} Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
