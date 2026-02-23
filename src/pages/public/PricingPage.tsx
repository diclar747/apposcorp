import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Check,
    HelpCircle,
    ArrowRight,
    Store,
    ShoppingBag,
    BarChart3,
    Zap,
    Globe,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { plansApi } from '@/lib/api';
import type { SubscriptionPlan, BillingCycle } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function PricingPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await plansApi.getPublic();
            setPlans(data.filter((p: any) => p.isActive && !p.isCommissionBased));
        } catch (error) {
            // Mock data for display
            const mockPlans: SubscriptionPlan[] = [
                {
                    id: '1',
                    name: 'Plan Básico',
                    tier: 'basic',
                    description: 'Perfecto para empezar tu negocio online.',
                    price: 50000,
                    prices: { monthly: 50000, quarterly: 135000, semi_annual: 250000, annual: 450000 },
                    features: ['Punto de Venta (Web)', 'Tienda Online Personalizada', 'Gestión de hasta 50 productos', 'Soporte vía Email'],
                    isCommissionBased: false,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    name: 'Plan Estándar',
                    tier: 'standard',
                    description: 'Crecimiento y herramientas avanzadas.',
                    price: 150000,
                    prices: { monthly: 150000, quarterly: 400000, semi_annual: 750000, annual: 1350000 },
                    features: ['Todo lo del Plan Básico', 'Gestión de Stock Ilimitada', 'Reportes de Ventas y Finanzas', 'Gestión de Clientes', 'Gestión de Proveedores', 'Soporte Prioritario'],
                    isCommissionBased: false,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '3',
                    name: 'Plan Comercial',
                    tier: 'commercial',
                    description: 'Potencia total para empresas establecidas.',
                    price: 350000,
                    prices: { monthly: 350000, quarterly: 950000, semi_annual: 1800000, annual: 3200000 },
                    features: ['Todo lo del Plan Estándar', 'Multi-usuarios Admin', 'Integraciones Avanzadas', 'App Móvil para Gestión', 'Soporte 24/7 Personalizado', 'Capacitaciones Exclusivas'],
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

    const currentCycleLabel = (cycle: BillingCycle) => {
        switch (cycle) {
            case 'monthly': return 'mes';
            case 'quarterly': return 'trimestre';
            case 'semi_annual': return 'semestre';
            case 'annual': return 'año';
            default: return 'mes';
        }
    };

    const getPriceByCycle = (plan: SubscriptionPlan) => {
        if (billingCycle === 'monthly') return plan.prices.monthly;
        if (billingCycle === 'quarterly') return plan.prices.quarterly;
        if (billingCycle === 'semi_annual') return plan.prices.semi_annual;
        if (billingCycle === 'annual') return plan.prices.annual;
        return plan.price;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent -z-10" />
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none px-4 py-1 text-sm">
                            Potencia tu negocio ahora
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
                            Vende más con <span className="text-blue-600">Oscorp</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
                            Escoge el plan perfecto para los objetivos de tu comercio. Sin costos ocultos, herramientas poderosas y todo lo que necesitas para crecer en un solo lugar.
                        </p>
                    </motion.div>

                    {/* Billing Cycle Switcher */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Mensual</span>
                        <div className="relative w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-full p-1 cursor-pointer" onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}>
                            <motion.div
                                className="w-5 h-5 bg-blue-600 rounded-full shadow-md"
                                animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Anual</span>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none text-[10px] animate-pulse">Ahorra hasta 25%</Badge>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-24 container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, idx) => {
                        const isStandard = plan.tier === 'standard';
                        const cyclePrice = getPriceByCycle(plan);

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="flex"
                            >
                                <Card className={`relative flex flex-col w-full border-2 transition-all duration-300 hover:shadow-2xl dark:bg-slate-900 ${isStandard ? 'border-blue-600 scale-105 shadow-xl z-10' : 'border-slate-100 dark:border-slate-800'}`}>
                                    {isStandard && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <Badge className="bg-blue-600 text-white border-none py-1 px-4 text-xs font-bold shadow-lg uppercase tracking-wider">RECOMENDADO</Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pt-8">
                                        <CardTitle className="text-2xl font-black mb-2 dark:text-white capitalize">{plan.name}</CardTitle>
                                        <CardDescription className="dark:text-gray-400 min-h-[40px]">{plan.description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 space-y-8 px-8">
                                        <div className="text-center">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">{formatCurrency(cyclePrice)}</span>
                                                <span className="text-slate-400 font-medium">/{currentCycleLabel(billingCycle)}</span>
                                            </div>
                                            {billingCycle === 'annual' && plan.prices.monthly && (
                                                <p className="text-xs text-green-600 font-medium mt-1">Equivalente a {formatCurrency(Math.round(cyclePrice / 12))}/mes</p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">¿Qué incluye?</p>
                                            <ul className="space-y-4">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-gray-300">
                                                        <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 stroke-[3px]" />
                                                        </div>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pb-8 px-8">
                                        <Button
                                            asChild
                                            className={`w-full py-6 text-base font-bold transition-all duration-300 ${isStandard ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-slate-900 dark:bg-blue-900/50 hover:bg-slate-800 dark:hover:bg-blue-800/50'}`}
                                        >
                                            <Link to={`/register?plan=${plan.tier}`}>
                                                Empezar con {plan.name}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Múltiples herramientas, un solo lugar</h2>
                        <p className="text-slate-600 dark:text-gray-400">Todo lo que implementamos está diseñado para facilitar la gestión diaria de tu negocio.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Store, title: "Punto de Venta", desc: "Realiza cobros rápidos y lleva un registro detallado de tus ventas locales." },
                            { icon: ShoppingBag, title: "Tienda Online", desc: "Tu catálogo siempre disponible para todo el país en segundos." },
                            { icon: BarChart3, title: "Reportes Inteligentes", desc: "Entiende tus ganancias y comportamientos de compra con gráficos claros." },
                            { icon: Zap, title: "Gestión Veloz", desc: "Administra stock, precios y promociones de forma instantánea." }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-gray-400 line-height-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Commission Option Section */}
            <section className="py-24 container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Plus className="w-64 h-64 -mr-32 -mt-32" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black mb-6">¿Recién empiezas y no quieres costos fijos?</h2>
                    <p className="text-xl text-blue-50 mb-10 opacity-90 max-w-2xl mx-auto">
                        Ofrecemos un modelo flexible <strong>100% basado en comisiones</strong>. Paga solo cuando vendes. Sin cuotas mensuales, sin riesgos.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
                            <span className="text-sm uppercase font-bold tracking-widest opacity-80 block mb-1">Comisión desde</span>
                            <span className="text-3xl font-black">2.0%</span>
                        </div>
                        <Button asChild variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 py-7 px-10 text-lg font-bold rounded-2xl">
                            <Link to="/contacto">Consultar por este Plan</Link>
                        </Button>
                    </div>

                    <p className="mt-8 text-sm text-blue-200">Ideal para micro-emprendedores y feriantes.</p>
                </div>
            </section>
        </div>
    );
}
