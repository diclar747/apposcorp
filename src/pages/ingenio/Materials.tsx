import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, BookOpen, ChevronRight, FileText, Video, 
    Music, Lock, RotateCcw, AlertCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wheel } from '@/components/ingenio/Wheel';
import { SecureViewer } from '@/components/shared/SecureViewer';
import { ingenioApi } from '@/lib/api';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores/paywallStore';
import { AccessDenied } from '@/components/ingenio/AccessDenied';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const e1Segments = [
    { number: 1, color: '#ef4444', title: 'Poder del Dinero' },
    { number: 2, color: '#f97316', title: 'Crear más Dinero' },
    { number: 3, color: '#f59e0b', title: 'Manejar el Dinero' },
    { number: 4, color: '#84cc16', title: 'Proteger el Dinero' },
    { number: 5, color: '#22c55e', title: 'Ahorrar el Dinero' },
    { number: 6, color: '#10b981', title: 'Crecer el Dinero' },
    { number: 7, color: '#06b6d4', title: 'Preservar el Dinero' },
    { number: 8, color: '#3b82f6', title: 'Invertir el Dinero' },
    { number: 9, color: '#6366f1', title: 'Donar el Dinero' },
    { number: 10, color: '#8b5cf6', title: 'Disfrutar el Dinero' },
];

const e2Segments = [
    { number: 1, color: '#ef4444', title: 'Mentalidad Ganadora' },
    { number: 2, color: '#f97316', title: 'Metas Claras' },
    { number: 3, color: '#f59e0b', title: 'Plan de Acción' },
    { number: 4, color: '#84cc16', title: 'Ingresos Múltiples' },
    { number: 5, color: '#22c55e', title: 'Inversión Inteligente' },
    { number: 6, color: '#10b981', title: 'Red de Contactos' },
    { number: 7, color: '#06b6d4', title: 'Educación Continua' },
    { number: 8, color: '#3b82f6', title: 'Disciplina Financiera' },
    { number: 9, color: '#6366f1', title: 'Dar para Recibir' },
    { number: 10, color: '#8b5cf6', title: 'Legado Duradero' },
];

export default function IngenioMaterials() {
    const { status, isActive } = useIngenioSubscription();
    const { openPaywall } = usePaywallStore();
    
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStage, setSelectedStage] = useState<'E1' | 'E2'>('E1');
    const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
    const [viewingMaterial, setViewingMaterial] = useState<any>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const data = await ingenioApi.getMaterials();
            setMaterials(data);
        } catch (error) {
            toast.error('Error al cargar la biblioteca de materiales');
        } finally {
            setLoading(false);
        }
    };

    if (status !== 'ACTIVE') {
        return <AccessDenied status={status} />;
    }

    const segments = selectedStage === 'E1' ? e1Segments : e2Segments;
    const currentSegmentData = selectedSegment ? segments.find(s => s.number === selectedSegment) : null;
    const filteredMaterials = materials.filter(m => 
        m.stage === selectedStage && 
        (selectedSegment === null || m.segmentNumber === selectedSegment)
    );

    const handleWheelSelect = (segment: any) => {
        setSelectedSegment(segment.number);
        toast.success(`Segmento: ${segment.title}`, {
            description: "Explora los materiales disponibles para este pilar.",
            icon: <Sparkles className="w-5 h-5 text-amber-500" />
        });
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 blur-[120px] rounded-full -mr-40 -mt-20" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <Badge className="bg-violet-500/20 text-violet-300 border-none mb-4 font-black">BIBLIOTECA EXCLUSIVA</Badge>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
                            Rueda del <span className="text-violet-400">Éxito</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed mb-6">
                            Gira la rueda o selecciona una etapa para profundizar en los pilares fundamentales de tu libertad financiera.
                        </p>
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => { setSelectedStage('E1'); setSelectedSegment(null); }}
                                className={selectedStage === 'E1' ? 'bg-violet-600' : 'bg-white/5'}
                            >E1 - Básico</Button>
                            <Button 
                                onClick={() => { setSelectedStage('E2'); setSelectedSegment(null); }}
                                className={selectedStage === 'E2' ? 'bg-violet-600' : 'bg-white/5'}
                            >E2 - Avanzado</Button>
                        </div>
                    </div>
                    <div className="flex justify-center scale-90 md:scale-110">
                        <Wheel 
                            segments={segments} 
                            onSegmentSelected={handleWheelSelect} 
                            size={320} 
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        {currentSegmentData ? (
                            <>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: currentSegmentData.color }}>
                                    {currentSegmentData.number}
                                </div>
                                {currentSegmentData.title}
                            </>
                        ) : (
                            <>
                                <BookOpen className="w-6 h-6 text-violet-500" />
                                Todos los Materiales {selectedStage}
                            </>
                        )}
                    </h2>
                    {selectedSegment && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSegment(null)} className="text-slate-500 font-bold">
                            <RotateCcw className="w-4 h-4 mr-2" /> Ver todos
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Aún no hay materiales cargados en este segmento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMaterials.map((mat, index) => (
                            <motion.div
                                key={mat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card 
                                    onClick={() => setViewingMaterial(mat)}
                                    className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                mat.fileType === 'pdf' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" :
                                                mat.fileType === 'video' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" :
                                                "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {mat.fileType === 'pdf' && <FileText className="w-6 h-6" />}
                                                {mat.fileType === 'video' && <Video className="w-6 h-6" />}
                                                {mat.fileType === 'audio' && <Music className="w-6 h-6" />}
                                                {mat.fileType === 'doc' && <FileText className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight mb-1 truncate group-hover:text-violet-600 transition-colors">{mat.title}</h4>
                                                <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-snug">{mat.description || 'Sin descripción'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                 <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" 
                                                      style={{ backgroundColor: segments.find(s => s.number === mat.segmentNumber)?.color }}>
                                                     {mat.segmentNumber}
                                                 </div>
                                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mat.fileType}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Material Viewer Modal */}
            <AnimatePresence>
                {viewingMaterial && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl p-4 md:p-10 flex items-center justify-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full h-full max-w-6xl"
                        >
                            <SecureViewer
                                url={viewingMaterial.fileUrl}
                                type={viewingMaterial.fileType}
                                title={viewingMaterial.title}
                                onClose={() => setViewingMaterial(null)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
