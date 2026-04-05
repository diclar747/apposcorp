import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles, Award, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wheel, type WheelSegment } from '@/components/ingenio/Wheel';

// Segments for E1
const segments: WheelSegment[] = [
    { number: 1, color: '#ef4444', title: 'Poder del Dinero', description: 'Entiende cómo funciona el dinero y cómo hacer que trabaje para ti.' },
    { number: 2, color: '#f97316', title: 'Crear más Dinero', description: 'Estrategias para generar múltiples fuentes de ingresos.' },
    { number: 3, color: '#f59e0b', title: 'Manejar el Dinero', description: 'Presupuestos inteligentes y control de gastos.' },
    { number: 4, color: '#84cc16', title: 'Proteger el Dinero', description: 'Seguros, emergencias y protección patrimonial.' },
    { number: 5, color: '#22c55e', title: 'Ahorrar el Dinero', description: 'Hábitos de ahorro y fondos de emergencia.' },
    { number: 6, color: '#10b981', title: 'Crecer el Dinero', description: 'Inversiones que generan retornos consistentes.' },
    { number: 7, color: '#06b6d4', title: 'Preservar el Dinero', description: 'Legado familiar y planificación a largo plazo.' },
    { number: 8, color: '#3b82f6', title: 'Invertir el Dinero', description: 'Oportunidades de inversión diversificadas.' },
    { number: 9, color: '#6366f1', title: 'Donar el Dinero', description: 'Filantropía y contribución social.' },
    { number: 10, color: '#8b5cf6', title: 'Disfrutar el Dinero', description: 'Balance entre ahorro y disfrute de la vida.' },
];

export default function PresentacionE1() {
    const [showContent, setShowContent] = useState(false);
    const [currentContent, setCurrentContent] = useState<typeof segments[0] | null>(null);

    const handleSegmentSelected = (segment: typeof segments[0]) => {
        setCurrentContent(segment);
        setShowContent(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white">Ingenio Millonario</h1>
                            <p className="text-xs text-slate-400">Presentación E1</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-slate-300 hover:text-white hover:bg-white/10"
                        onClick={() => window.location.href = '/login'}
                    >
                        Iniciar Sesión <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium mb-6 border border-violet-500/30">
                                <Sparkles className="w-4 h-4" />
                                Descubre tu camino financiero
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
                                La Ruleta de la<br />Prosperidad
                            </h1>
                            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                                Gira la ruleta para descubrir los 10 principios fundamentales 
                                para construir riqueza y libertad financiera.
                            </p>
                        </motion.div>
                    </div>

                    {/* Wheel Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <Wheel
                            segments={segments}
                            onSegmentSelected={handleSegmentSelected}
                            size={380}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Result Dialog */}
            <Dialog open={showContent} onOpenChange={setShowContent}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl"
                                style={{ backgroundColor: currentContent?.color }}
                            >
                                {currentContent?.number}
                            </div>
                            <span className="text-xl">{currentContent?.title}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <p className="text-slate-300 text-lg leading-relaxed">
                            {currentContent?.description}
                        </p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={() => setShowContent(false)}
                            className="bg-violet-600 hover:bg-violet-700"
                        >
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30"
                    >
                        <Award className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-3">
                            ¿Listo para transformar tu vida financiera?
                        </h2>
                        <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                            Únete a Ingenio Millonario y accede a formación completa.
                        </p>
                        <Button
                            size="lg"
                            onClick={() => window.location.href = '/register'}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 rounded-xl"
                        >
                            Comenzar Ahora <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 px-4 border-t border-slate-800">
                <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
                    <p>© 2026 Oscorp. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
