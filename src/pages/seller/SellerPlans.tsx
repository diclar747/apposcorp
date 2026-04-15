import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Crown, Shield, MessageCircle, CreditCard, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { plansApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import type { SubscriptionPlan } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export default function SellerPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const { user } = useAuthStore();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await plansApi.getAll();
            setPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcquire = (plan: SubscriptionPlan) => {
        const cycleNames = {
            monthly: 'Mensual',
            quarterly: 'Trimestral',
            semi_annual: 'Semestral',
            annual: 'Anual'
        };
        const message = `Hola Oscorp, me interesa adquirir el ${plan.name} (Plan ${cycleNames[cycle]}) para mi comercio. Mi usuario es ${user?.email}. ¿Podrían pasarme los datos para la transferencia bancaria?`;
        const whatsappUrl = `https://wa.me/595981123456?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-[0.2em]"
                >
                    <Star className="w-3 h-3 fill-current" />
                    Membresía Requerida
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                    Eleva tu <span className="text-blue-500">Negocio</span>
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
                    Impulsa tus ventas con herramientas profesionales. Elige el plan que potencie tu crecimiento.
                </p>
            </div>

            {/* Billing Cycle Selector */}
            <div className="flex justify-center mb-16">
                <div className="p-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl flex gap-1">
                    {[
                        { id: 'monthly', label: 'Mensual' },
                        { id: 'quarterly', label: 'Trimestral' },
                        { id: 'semi_annual', label: 'Semestral' },
                        { id: 'annual', label: 'Anual' },
                    ].map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCycle(c.id as BillingCycle)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                                cycle === c.id 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                            )}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan, index) => {
                    const isFeatured = plan.tier === 'standard';
                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className={cn(
                                "relative h-full flex flex-col overflow-hidden border-2 transition-all duration-500 group",
                                "bg-slate-900/40 backdrop-blur-xl border-slate-800 hover:border-blue-500/50",
                                isFeatured && "border-blue-500/50 shadow-2xl shadow-blue-500/10 lg:scale-105"
                            )}>
                                {isFeatured && (
                                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest z-10">
                                        Más Popular
                                    </div>
                                )}

                                <CardHeader className="pb-8 pt-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <Badge variant="outline" className={cn(
                                            "capitalize px-3 py-1 text-[10px] font-bold tracking-widest",
                                            plan.tier === 'basic' ? "bg-slate-800 text-slate-300 border-slate-700" :
                                            plan.tier === 'standard' ? "bg-blue-900/30 text-blue-400 border-blue-800/50" :
                                            "bg-amber-900/30 text-amber-400 border-amber-800/50"
                                        )}>
                                            {plan.tier}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-white mb-2 uppercase tracking-tighter group-hover:text-blue-400 transition-colors">
                                        {plan.name}
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 line-clamp-2 min-h-[40px]">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-8">
                                    <div className="py-6 border-y border-slate-800/50">
                                        {plan.isCommissionBased ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <span className="text-4xl font-black">{plan.commissionRate}%</span>
                                                    <span className="text-sm font-bold opacity-70 uppercase tracking-widest">comisión</span>
                                                </div>
                                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.15em]">Límite: {plan.maxProducts} productos</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black text-white">
                                                        {formatCurrency((plan.prices as any)?.[cycle] || (cycle === 'monthly' ? plan.price : 0))}
                                                    </span>
                                                    <span className="text-slate-500 font-bold text-sm">
                                                        {cycle === 'monthly' ? '/mes' : 
                                                         cycle === 'quarterly' ? '/trimestre' : 
                                                         cycle === 'semi_annual' ? '/semestre' : '/año'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.15em]">Límite: {plan.maxProducts} productos</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Beneficios incl.</p>
                                        <ul className="space-y-4">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium group/item">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10 shrink-0 group-hover/item:scale-110 transition-transform" />
                                                    {feature}
                                                </li>
                                            ))}
                                            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium group/item">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10 shrink-0" />
                                                Punto de Venta (POS)
                                            </li>
                                        </ul>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-8 pb-8">
                                    <Button 
                                        onClick={() => handleAcquire(plan)}
                                        className={cn(
                                            "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300",
                                            isFeatured 
                                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20" 
                                                : "bg-white hover:bg-slate-200 text-slate-950"
                                        )}
                                    >
                                        Adquirir Plan
                                        <MessageCircle className="w-5 h-5 ml-2" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 p-8 rounded-[2rem] bg-gradient-to-b from-slate-900/50 to-transparent border border-slate-800 text-center"
            >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 shadow-inner mb-6">
                    <CreditCard className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Proceso de Activación</h3>
                <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Al solicitar tu plan, te pondrás en contacto con soporte vía WhatsApp para coordinar la **transferencia bancaria**. 
                    Una vez confirmado el pago, tu cuenta será activada inmediatamente por un administrador.
                </p>
            </motion.div>
        </div>
    );
}
