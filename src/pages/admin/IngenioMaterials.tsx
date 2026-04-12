import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Upload, FileText, Video, BookOpen, Trash2, Plus,
    Sparkles, RotateCcw, ChevronRight, Loader2, FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wheel } from '@/components/ingenio/Wheel';
import { ingenioApi } from '@/lib/api';
import { useRef } from 'react';
import { FilePicker } from '@/components/shared/FilePicker';
import { SecureViewer } from '@/components/shared/SecureViewer';

// Tipos de materiales
interface Material {
    id: string;
    title: string;
    description: string;
    stage: 'E1' | 'E2';
    segmentNumber: number;
    fileUrl: string;
    fileType: 'pdf' | 'video' | 'audio' | 'doc';
    createdAt: string;
}

// Segmentos de la ruleta
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
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedStage, setSelectedStage] = useState<'E1' | 'E2'>('E1');
    const [showWheel, setShowWheel] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
    const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
    
    const [form, setForm] = useState({
        title: '',
        description: '',
        stage: 'E1' as 'E1' | 'E2',
        segmentNumber: 1,
        fileUrl: '',
        fileType: 'pdf' as 'pdf' | 'video' | 'audio' | 'doc',
    });

    // Cargar materiales desde la API
    useEffect(() => {
        fetchMaterials();
    }, [selectedStage]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const data = await ingenioApi.getMaterials();
            // Filtrar por etapa si la API no lo hace, aunque idealmente debería
            setMaterials(data.filter((m: any) => m.stage === selectedStage));
        } catch (error) {
            toast.error('Error al cargar materiales');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title || !form.fileUrl) {
            toast.error('El título y el archivo son obligatorios');
            return;
        }
        
        try {
            setUploading(true);
            await ingenioApi.createMaterial({
                ...form,
                isPublic: true,
                order: materials.length + 1
            });
            
            toast.success('Material creado correctamente');
            setIsCreateOpen(false);
            fetchMaterials();
            setForm({
                title: '',
                description: '',
                stage: selectedStage,
                segmentNumber: 1,
                fileUrl: '',
                fileType: 'pdf',
            });
        } catch (error) {
            toast.error('Error al crear el material');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este material?')) return;
        try {
            await ingenioApi.deleteMaterial(id);
            toast.success('Material eliminado');
            fetchMaterials();
        } catch (error) {
            toast.error('No se pudo eliminar el material');
        }
    };

    const handleWheelSelect = (segment: { number: number; color: string; title: string }) => {
        setSelectedSegment(segment.number);
        setForm(prev => ({ ...prev, segmentNumber: segment.number }));
        setShowWheel(false);
        toast.success(`Segmento seleccionado: ${segment.title}`);
    };

    const getMaterialsBySegment = (segmentNumber: number) => {
        return materials.filter(m => m.segmentNumber === segmentNumber);
    };

    const segments = selectedStage === 'E1' ? e1Segments : e2Segments;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-violet-500" />
                        Materiales de Estudio
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestiona contenido para cada segmento de la ruleta
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedStage} onValueChange={(v) => setSelectedStage(v as 'E1' | 'E2')}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="E1">E1 - Básico</SelectItem>
                            <SelectItem value="E2">E2 - Avanzado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Material
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {segments.map((seg) => {
                    const count = getMaterialsBySegment(seg.number).length;
                    return (
                        <Card key={seg.number} className="border-slate-200 dark:border-slate-800">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: seg.color }}
                                >
                                    {seg.number}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">{seg.title}</p>
                                    <p className="text-lg font-bold">{count} mat.</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Materials Grid */}
            {loading ? (
                <div className="text-center py-20">Cargando...</div>
            ) : materials.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No hay materiales cargados</p>
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" /> Agregar primer material
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {segments.map((seg) => {
                        const segMaterials = getMaterialsBySegment(seg.number);
                        if (segMaterials.length === 0) return null;
                        
                        return (
                            <div key={seg.number} className="space-y-3">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <div 
                                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                                        style={{ backgroundColor: seg.color }}
                                    >
                                        {seg.number}
                                    </div>
                                    {seg.title}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {segMaterials.map((mat) => (
                                        <Card key={mat.id} className="group hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {mat.fileType === 'pdf' && <FileText className="w-8 h-8 text-red-500" />}
                                                        {mat.fileType === 'video' && <Video className="w-8 h-8 text-blue-500" />}
                                                        {mat.fileType === 'audio' && <span className="text-2xl">🎵</span>}
                                                        {mat.fileType === 'doc' && <FileText className="w-8 h-8 text-blue-600" />}
                                                        <div>
                                                            <h4 className="font-semibold text-sm line-clamp-1">{mat.title}</h4>
                                                            <p className="text-xs text-slate-500 line-clamp-1">{mat.description}</p>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => handleDelete(mat.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <button 
                                                    onClick={() => setViewingMaterial(mat)}
                                                    className="text-xs text-blue-500 hover:text-blue-700 font-bold mt-2 inline-flex items-center gap-1 transition-colors"
                                                >
                                                    Ver material <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nuevo Material de Estudio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Título</Label>
                            <Input 
                                value={form.title}
                                onChange={(e) => setForm({...form, title: e.target.value})}
                                placeholder="Ej: Guía del Poder del Dinero"
                            />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Textarea 
                                value={form.description}
                                onChange={(e) => setForm({...form, description: e.target.value})}
                                placeholder="Breve descripción del contenido..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Etapa</Label>
                                <Select 
                                    value={form.stage} 
                                    onValueChange={(v) => setForm({...form, stage: v as 'E1' | 'E2'})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="E1">E1</SelectItem>
                                        <SelectItem value="E2">E2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Segmento de Ruleta</Label>
                                <div className="flex items-center gap-2">
                                    <Select 
                                        value={form.segmentNumber.toString()} 
                                        onValueChange={(v) => setForm({...form, segmentNumber: parseInt(v)})}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {segments.map((s) => (
                                                <SelectItem key={s.number} value={s.number.toString()}>
                                                    {s.number} - {s.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => setShowWheel(true)}
                                        title="Seleccionar con ruleta"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Label className="mb-2 block">Archivo del Material</Label>
                            <FilePicker 
                                value={form.fileUrl}
                                onChange={(val, type) => setForm({...form, fileUrl: val || '', fileType: type as any})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={uploading} className="bg-violet-600 hover:bg-violet-700">
                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            {uploading ? 'Guardando...' : 'Guardar Material'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Wheel Selector Dialog */}
            <Dialog open={showWheel} onOpenChange={setShowWheel}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Gira la ruleta para seleccionar un segmento</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex justify-center">
                        <Wheel 
                            segments={segments}
                            onSegmentSelected={handleWheelSelect}
                            size={350}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            {/* Viewer Dialog */}
            {viewingMaterial && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-5xl h-[85vh]">
                        <SecureViewer 
                            url={viewingMaterial.fileUrl} 
                            type={viewingMaterial.fileType} 
                            title={viewingMaterial.title} 
                            onClose={() => setViewingMaterial(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
