import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, BookOpen, Play, Clock, Award,
    ChevronRight, RotateCcw, FileText, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wheel } from '@/components/ingenio/Wheel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Segmentos
const e1Segments = [
    { number: 1, color: '#ef4444', title: 'Poder del Dinero', description: 'Entiende cómo funciona el dinero' },
    { number: 2, color: '#f97316', title: 'Crear más Dinero', description: 'Genera múltiples ingresos' },
    { number: 3, color: '#f59e0b', title: 'Manejar el Dinero', description: 'Presupuestos inteligentes' },
    { number: 4, color: '#84cc16', title: 'Proteger el Dinero', description: 'Seguros y protección' },
    { number: 5, color: '#22c55e', title: 'Ahorrar el Dinero', description: 'Fondos de emergencia' },
    { number: 6, color: '#10b981', title: 'Crecer el Dinero', description: 'Inversiones consistentes' },
    { number: 7, color: '#06b6d4', title: 'Preservar el Dinero', description: 'Planificación a largo plazo' },
    { number: 8, color: '#3b82f6', title: 'Invertir el Dinero', description: 'Oportunidades diversificadas' },
    { number: 9, color: '#6366f1', title: 'Donar el Dinero', description: 'Filantropía y contribución' },
    { number: 10, color: '#8b5cf6', title: 'Disfrutar el Dinero', description: 'Balance en la vida' },
];

const e2Segments = [
    { number: 1, color: '#ef4444', title: 'Mentalidad Ganadora', description: 'Mentalidad de abundancia' },
    { number: 2, color: '#f97316', title: 'Metas Claras', description: 'Objetivos específicos' },
    { number: 3, color: '#f59e0b', title: 'Plan de Acción', description: 'Roadmap detallado' },
    { number: 4, color: '#84cc16', title: 'Ingresos Múltiples', description: 'Diversifica ingresos' },
    { number: 5, color: '#22c55e', title: 'Inversión Inteligente', description: 'Retornos pasivos' },
    { number: 6, color: '#10b981', title: 'Red de Contactos', description: 'Construye relaciones' },
    { number: 7, color: '#06b6d4', title: 'Educación Continua', description: 'Nunca dejes de aprender' },
    { number: 8, color: '#3b82f6', title: 'Disciplina Financiera', description: 'La consistencia vence' },
    { number: 9, color: '#6366f1', title: 'Dar para Recibir', description: 'Generosidad' },
    { number: 10, color: '#8b5cf6', title: 'Legado Duradero', description: 'Riqueza que trasciende' },
];

interface Material {
    id: string;
    title: string;
    description: string;
    stage: 'E1' | 'E2';
    segmentNumber: number;
    fileUrl: string;
    fileType: 'pdf' | 'video' | 'audio' | 'doc';
    completed?: boolean;
}

export default function IngenioStudy() {
    const [selectedStage, setSelectedStage] = useState<'E1' | 'E2'>('E1');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [studyHistory, setStudyHistory] = useState<string[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0 });

    const segments = selectedStage === 'E1' ? e1Segments : e2Segments;

    // Cargar materiales desde localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`ingenio-materials-${selectedStage}`);
        const savedHistory = localStorage.getItem(`ingenio-history-${selectedStage}`);
        
        if (saved) {
            const mats = JSON.parse(saved);
            setMaterials(mats);
            setStats({
                total: mats.length,
                completed: mats.filter((m: Material) => m.completed).length
            });
        }
        if (savedHistory) {
            setStudyHistory(JSON.parse(savedHistory));
        }
    }, [selectedStage]);

    const handleWheelSelect = (segment: { number: number; color: string; title: string; description?: string }) => {
        // Buscar materiales del segmento seleccionado
        const segmentMaterials = materials.filter(m => m.segmentNumber === segment.number);
        
        if (segmentMaterials.length === 0) {
            toast.error(`No hay materiales disponibles para "${segment.title}"`);
            return;
        }
        
        // Seleccionar uno aleatorio
        const randomMaterial = segmentMaterials[Math.floor(Math.random() * segmentMaterials.length)];
        setSelectedMaterial(randomMaterial);
        setShowResult(true);
        
        // Guardar en historial
        const newHistory = [randomMaterial.id, ...studyHistory].slice(0, 10);
        setStudyHistory(newHistory);
        localStorage.setItem(`ingenio-history-${selectedStage}`, JSON.stringify(newHistory));
    };

    const markAsCompleted = () => {
        if (!selectedMaterial) return;
        
        const updated = materials.map(m => 
            m.id === selectedMaterial.id ? { ...m, completed: true } : m
        );
        
        localStorage.setItem(`ingenio-materials-${selectedStage}`, JSON.stringify(updated));
        setMaterials(updated);
        setStats({
            total: updated.length,
            completed: updated.filter(m => m.completed).length
        });
        
        toast.success('¡Material marcado como completado!');
        setShowResult(false);
    };

    const getProgress = () => {
        if (stats.total === 0) return 0;
        return Math.round((stats.completed / stats.total) * 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white p-4 sm:p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center pt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">
                            <Sparkles className="w-3 h-3 mr-1" /> Modo Estudio
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
                            Ruleta de Aprendizaje
                        </h1>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            Gira la ruleta para descubrir qué tema estudiar hoy
                        </p>
                    </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 text-center">
                            <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-slate-400">Materiales</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 text-center">
                            <Award className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.completed}</p>
                            <p className="text-xs text-slate-400">Completados</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4 text-center">
                            <Clock className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{getProgress()}%</p>
                            <p className="text-xs text-slate-400">Progreso</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stage Selector */}
                <div className="flex justify-center gap-4">
                    <Button
                        variant={selectedStage === 'E1' ? 'default' : 'outline'}
                        onClick={() => setSelectedStage('E1')}
                        className={selectedStage === 'E1' ? 'bg-violet-600' : 'border-slate-600'}
                    >
                        E1 - Fundamentos
                    </Button>
                    <Button
                        variant={selectedStage === 'E2' ? 'default' : 'outline'}
                        onClick={() => setSelectedStage('E2')}
                        className={selectedStage === 'E2' ? 'bg-emerald-600' : 'border-slate-600'}
                    >
                        E2 - Avanzado
                    </Button>
                </div>

                {/* Wheel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center py-8"
                >
                    <Wheel 
                        segments={segments}
                        onSegmentSelected={handleWheelSelect}
                        size={360}
                    />
                </motion.div>

                {/* Recent History */}
                {studyHistory.length > 0 && (
                    <div className="max-w-md mx-auto">
                        <h3 className="text-sm font-semibold text-slate-400 mb-3 text-center">
                            Estudios Recientes
                        </h3>
                        <div className="space-y-2">
                            {studyHistory.slice(0, 5).map((id, i) => {
                                const mat = materials.find(m => m.id === id);
                                if (!mat) return null;
                                return (
                                    <div 
                                        key={i}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-sm"
                                    >
                                        {mat.fileType === 'pdf' ? <FileText className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4 text-blue-400" />}
                                        <span className="flex-1 truncate">{mat.title}</span>
                                        {mat.completed && <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">✓</Badge>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Result Dialog */}
                <Dialog open={showResult} onOpenChange={setShowResult}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl"
                                    style={{ backgroundColor: selectedMaterial ? segments.find(s => s.number === selectedMaterial.segmentNumber)?.color : '#666' }}
                                >
                                    {selectedMaterial?.segmentNumber}
                                </div>
                                <div>
                                    <p className="text-lg">¡Tema Seleccionado!</p>
                                    <p className="text-sm text-slate-400 font-normal">
                                        {selectedMaterial && segments.find(s => s.number === selectedMaterial.segmentNumber)?.title}
                                    </p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        
                        {selectedMaterial && (
                            <div className="space-y-4 mt-4">
                                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <h4 className="font-semibold text-lg mb-2">{selectedMaterial.title}</h4>
                                    <p className="text-slate-400 text-sm mb-4">{selectedMaterial.description}</p>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                        <Badge variant="outline" className="border-slate-600">
                                            {selectedMaterial.fileType.toUpperCase()}
                                        </Badge>
                                        <span>•</span>
                                        <span>{selectedStage}</span>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <Button 
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            onClick={() => window.open(selectedMaterial.fileUrl, '_blank')}
                                        >
                                            <Play className="w-4 h-4 mr-2" /> Ver Material
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                                            onClick={markAsCompleted}
                                            disabled={selectedMaterial.completed}
                                        >
                                            <Award className="w-4 h-4 mr-2" />
                                            {selectedMaterial.completed ? 'Completado' : 'Completar'}
                                        </Button>
                                    </div>
                                </div>
                                
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setShowResult(false)}
                                    className="w-full"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" /> Girar de Nuevo
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
