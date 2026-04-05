import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, ChevronRight, Sparkles,
    BookOpen, Users, Target, Zap, Award, ArrowRight, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Wheel from '@/components/ingenio/Wheel';

// ─── Data ─────────────────────────────────────────────────────────────────────

const segments = [
    { number: 1, color: '#ef4444', title: 'Mentalidad Ganadora', description: 'El éxito comienza en la mente. Desarrolla una mentalidad de abundancia y crecimiento.' },
    { number: 2, color: '#f97316', title: 'Metas Claras', description: 'Define objetivos financieros específicos, medibles y alcanzables con plazos definidos.' },
    { number: 3, color: '#f59e0b', title: 'Plan de Acción', description: 'Crea un roadmap detallado para alcanzar tus metas financieras paso a paso.' },
    { number: 4, color: '#84cc16', title: 'Ingresos Múltiples', description: 'Diversifica tus fuentes de ingreso para mayor seguridad y crecimiento.' },
    { number: 5, color: '#22c55e', title: 'Inversión Inteligente', description: 'Aprende a invertir en activos que generen retornos pasivos consistentes.' },
    { number: 6, color: '#10b981', title: 'Red de Contactos', description: 'Construye relaciones con personas que impulsen tu crecimiento financiero.' },
    { number: 7, color: '#06b6d4', title: 'Educación Continua', description: 'Nunca dejes de aprender. Invierte en tu conocimiento financiero.' },
    { number: 8, color: '#3b82f6', title: 'Disciplina Financiera', description: 'La consistencia vence a la intensidad. Mantén hábitos financieros saludables.' },
    { number: 9, color: '#6366f1', title: 'Dar para Recibir', description: 'La generosidad abre puertas. Contribuye al éxito de otros.' },
    { number: 10, color: '#8b5cf6', title: 'Legado Duradero', description: 'Construye riqueza que trascienda generaciones.' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PresentacionE2() {
    const [spinning, setSpinning] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
    const [showContent, setShowContent] = useState(false);
    const [currentContent, setCurrentContent] = useState<typeof segments[0] | null>(null);
    const wheelRef = useRef<{ startSpin: () => void; stopSpin: () => void }>(null);

    const handleSpin = () => {
        wheelRef.current?.startSpin();
    };

    const handleStop = () => {
        wheelRef.current?.stopSpin();
    };

    const handleSegmentSelected = (segment: typeof segments[0]) => {
        setSelectedSegment(segment.number - 1);
        setCurrentContent(segment);
        setShowContent(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white">Ingenio Millonario</h1>
                            <p className="text-xs text-slate-400">Presentación E2 - Avanzado</p>
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
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-6 border border-emerald-500/30">
                                <Sparkles className="w-4 h-4" />
                                Nivel Avanzado - Transformación Total
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                                El Sistema de la<br />Riqueza Real
                            </h1>
                            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                                Descubre los 10 pasos avanzados que los millonarios usan 
                                para construir y mantener riqueza duradera.
                            </p>
                        </motion.div>
                    </div>

                    {/* Wheel Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col items-center gap-8"
                    >
                        <div className="relative">
                            <Wheel
                                ref={wheelRef}
                                segments={segments}
                                onSegmentSelected={handleSegmentSelected}
                                onSpinStateChange={setSpinning}
                                showControls={false}
                                size={400}
                            />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            {!spinning ? (
                                <Button
                                    size="lg"
                                    onClick={handleSpin}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-bold rounded-2xl shadow-2xl shadow-emerald-600/25 transition-all hover:scale-105"
                                >
                                    <Play className="w-5 h-5 mr-2" />
                                    Descubrir mi Paso
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={handleStop}
                                    variant="outline"
                                    className="border-2 border-emerald-500 text-emerald-300 hover:bg-emerald-500/20 px-8 py-6 text-lg font-bold rounded-2xl"
                                >
                                    <Pause className="w-5 h-5 mr-2" />
                                    Detener
                                </Button>
                            )}
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={() => {
                                    setSelectedSegment(null);
                                    setShowContent(false);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Reiniciar
                            </Button>
                        </div>
                    </motion.div>

                    {/* Selected Content Dialog */}
                    <Dialog open={showContent} onOpenChange={setShowContent}>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl"
                                        style={{ backgroundColor: currentContent?.color }}
                                    >
                                        {currentContent?.number}
                                    </div>
                                    <span className="text-2xl">{currentContent?.title}</span>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    {currentContent?.description}
                                </p>
                                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <h4 className="font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Estrategia de Implementación
                                    </h4>
                                    <p className="text-slate-400 text-sm">
                                        Este principio avanzado requiere acción inmediata. 
                                        Documenta cómo lo aplicarás esta semana y hazte responsable.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={() => setShowContent(false)}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Comenzar Ahora <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Los 10 Pilares del Éxito</h2>
                        <p className="text-slate-400">Sistema avanzado de construcción de riqueza</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {segments.slice(0, 5).map((segment, i) => (
                            <motion.div
                                key={segment.number}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-colors"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mb-3"
                                    style={{ backgroundColor: segment.color }}
                                >
                                    {segment.number}
                                </div>
                                <h3 className="font-semibold text-white text-sm mb-1">{segment.title}</h3>
                                <p className="text-xs text-slate-400 line-clamp-2">{segment.description}</p>
                            </motion.div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                        {segments.slice(5, 10).map((segment, i) => (
                            <motion.div
                                key={segment.number}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (i + 5) * 0.1 }}
                                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-colors"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mb-3"
                                    style={{ backgroundColor: segment.color }}
                                >
                                    {segment.number}
                                </div>
                                <h3 className="font-semibold text-white text-sm mb-1">{segment.title}</h3>
                                <p className="text-xs text-slate-400 line-clamp-2">{segment.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">E1 vs E2</h2>
                        <p className="text-slate-400">De los fundamentos a la maestría financiera</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-violet-500/30">
                            <h3 className="text-xl font-bold text-violet-300 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Presentación E1
                            </h3>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-500">•</span>
                                    Fundamentos del dinero
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-500">•</span>
                                    10 principios básicos
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-500">•</span>
                                    Mentalidad de crecimiento
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-500">•</span>
                                    Primeros pasos financieros
                                </li>
                            </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-emerald-500/30">
                            <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Presentación E2
                            </h3>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    Estrategias avanzadas
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    Sistemas de riqueza
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    Inversión profesional
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    Construcción de legado
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30"
                    >
                        <Award className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Domina tu futuro financiero
                        </h2>
                        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                            Completa tu formación con ambas presentaciones y accede 
                            al sistema completo de Ingenio Millonario.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => window.location.href = '/register'}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-bold rounded-xl w-full sm:w-auto"
                            >
                                Unirse al Programa <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => window.location.href = '/presentacion-e1'}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg rounded-xl w-full sm:w-auto"
                            >
                                Ver E1 Primero
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-slate-800">
                <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
                    <p>© 2026 Oscorp. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
