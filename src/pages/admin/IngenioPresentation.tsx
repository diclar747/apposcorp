import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Video, ExternalLink, Upload, Plus,
  Trash2, Edit, Users, BookOpen, ChevronRight, Play, X,
  GraduationCap, DollarSign, CheckCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ingenioApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Wheel } from '@/components/ingenio/Wheel';

interface Segment {
  number: number;
  color: string;
  title: string;
  description?: string;
}

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'image' | 'link';
  url?: string;
  fileName?: string;
  thumbnailUrl?: string;
  order: number;
}

interface Content {
  id: string;
  segmentNumber: number;
  title: string;
  description?: string;
  type: string;
  url?: string;
}

interface Stage {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  segments: Segment[];
  materials: Material[];
  contents: Content[];
}

// Default segments with colors
const defaultSegments: Segment[] = [
  { number: 1, color: '#ef4444', title: 'Poder del Dinero', description: 'Entendiendo el verdadero poder del dinero' },
  { number: 2, color: '#f97316', title: 'Crear más Dinero', description: 'Estrategias para multiplicar tus ingresos' },
  { number: 3, color: '#f59e0b', title: 'Controlar el Dinero', description: 'Gestión efectiva de tus finanzas' },
  { number: 4, color: '#84cc16', title: 'Apalancar el Dinero', description: 'Usar el dinero para generar más dinero' },
  { number: 5, color: '#22c55e', title: 'Decisión Monetaria', description: 'Tomar decisiones financieras inteligentes' },
  { number: 6, color: '#10b981', title: 'Solución Monetaria', description: 'Resolver problemas con creatividad financiera' },
  { number: 7, color: '#06b6d4', title: 'Proteger el Dinero', description: 'Salvaguardar tus activos' },
  { number: 8, color: '#3b82f6', title: 'Invertir el Dinero', description: 'Hacer crecer tu patrimonio' },
  { number: 9, color: '#6366f1', title: 'Donar el Dinero', description: 'El poder de dar' },
  { number: 10, color: '#8b5cf6', title: 'Disfrutar el Dinero', description: 'Vivir la vida con abundancia' },
];

export default function IngenioPresentation() {
  const { stageCode = 'E1' } = useParams<{ stageCode: string }>();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [activeTab, setActiveTab] = useState('wheel');
  
  // Dialog states
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Form states
  const [segmentForm, setSegmentForm] = useState<Partial<Segment>>({});
  const [materialForm, setMaterialForm] = useState<Partial<Material>>({ type: 'pdf' });
  const [contentForm, setContentForm] = useState<Partial<Content>>({ type: 'text' });
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);

  useEffect(() => {
    loadStage();
  }, [stageCode]);

  const loadStage = async () => {
    try {
      setLoading(true);
      // First try to get existing stage
      const stages = await ingenioApi.getStages();
      const existingStage = stages.find((s: any) => s.code === stageCode);
      
      if (existingStage) {
        const detail = await ingenioApi.getStage(existingStage.id);
        setStage(detail);
        // Ensure segments exist
        if (!detail.segments || detail.segments.length === 0) {
          await initializeSegments(existingStage.id);
          const refreshed = await ingenioApi.getStage(existingStage.id);
          setStage(refreshed);
        }
      } else {
        // Create new stage
        const newStage = await ingenioApi.createStage({
          code: stageCode,
          name: `Etapa ${stageCode}`,
          description: `Presentación ${stageCode} de Ingenio Millonario`,
          color: stageCode === 'E1' ? '#3b82f6' : '#8b5cf6',
          order: stageCode === 'E1' ? 1 : 2
        });
        await initializeSegments(newStage.id);
        const detail = await ingenioApi.getStage(newStage.id);
        setStage(detail);
      }
    } catch (error) {
      toast.error('Error al cargar la etapa');
    } finally {
      setLoading(false);
    }
  };

  const initializeSegments = async (stageId: string) => {
    try {
      await ingenioApi.saveSegments(stageId, defaultSegments);
    } catch (error) {
      console.error('Error initializing segments:', error);
    }
  };

  const handleSegmentSelected = (segment: Segment) => {
    setSelectedSegment(segment);
    // Load contents for this segment
    if (stage) {
      const segmentContents = stage.contents?.filter(c => c.segmentNumber === segment.number) || [];
      // Auto-switch to content tab if there are contents
      if (segmentContents.length > 0) {
        setActiveTab('content');
      }
    }
  };

  const handleSaveSegments = async () => {
    if (!stage) return;
    try {
      await ingenioApi.saveSegments(stage.id, stage.segments);
      toast.success('Configuración de ruleta guardada');
      setIsSegmentDialogOpen(false);
      loadStage();
    } catch (error) {
      toast.error('Error al guardar segmentos');
    }
  };

  const handleSaveMaterial = async () => {
    if (!stage || !materialForm.title) return;
    
    try {
      if (editingMaterial) {
        await ingenioApi.updateMaterial(editingMaterial, {
          ...materialForm,
          stageId: stage.id
        });
        toast.success('Material actualizado');
      } else {
        await ingenioApi.createMaterial({
          ...materialForm,
          stageId: stage.id,
          order: stage.materials?.length || 0
        });
        toast.success('Material creado');
      }
      setIsMaterialDialogOpen(false);
      setMaterialForm({ type: 'pdf' });
      setEditingMaterial(null);
      loadStage();
    } catch (error) {
      toast.error('Error al guardar material');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return;
    try {
      await ingenioApi.deleteMaterial(id);
      toast.success('Material eliminado');
      loadStage();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveContent = async () => {
    if (!stage || !contentForm.title || !selectedSegment) return;
    
    try {
      await ingenioApi.createContent({
        ...contentForm,
        stageId: stage.id,
        segmentNumber: selectedSegment.number
      });
      toast.success('Contenido agregado');
      setIsContentDialogOpen(false);
      setContentForm({ type: 'text' });
      loadStage();
    } catch (error) {
      toast.error('Error al guardar contenido');
    }
  };

  const openPdfViewer = (material: Material) => {
    setSelectedMaterial(material);
    setIsPdfViewerOpen(true);
  };

  const getContentsForSegment = () => {
    if (!stage || !selectedSegment) return [];
    return stage.contents?.filter(c => c.segmentNumber === selectedSegment.number) || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/ingenio')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Presentación {stageCode}
              </h1>
              <p className="text-xs text-slate-500">Ingenio Millonario · FGTM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsSegmentDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Configurar Ruleta
            </Button>
            <Button onClick={() => navigate(`/admin/ingenio/students/${stageCode}`)}>
              <Users className="w-4 h-4 mr-2" />
              Alumnos
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="wheel" className="gap-2">
              <Play className="w-4 h-4" />
              Ruleta
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Materiales
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2" disabled={!selectedSegment}>
              <FileText className="w-4 h-4" />
              Contenido {selectedSegment && `(#${selectedSegment.number})`}
            </TabsTrigger>
          </TabsList>

          {/* Wheel Tab */}
          <TabsContent value="wheel" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Wheel Section */}
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-center">Ruleta del Conocimiento</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Wheel
                    segments={stage?.segments || defaultSegments}
                    onSegmentSelected={handleSegmentSelected}
                    size={380}
                  />
                </CardContent>
              </Card>

              {/* Content Panel */}
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle>Contenido del Tema</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {selectedSegment ? (
                      <motion.div
                        key={selectedSegment.number}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg mx-auto"
                          style={{ backgroundColor: selectedSegment.color }}
                        >
                          {selectedSegment.number}
                        </div>
                        <h3 className="text-2xl font-bold text-center">{selectedSegment.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-center">
                          {selectedSegment.description}
                        </p>
                        
                        {/* Contents for this segment */}
                        <div className="mt-6 space-y-3">
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
                            Materiales de este tema
                          </h4>
                          {getContentsForSegment().length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No hay contenidos para este número</p>
                          ) : (
                            getContentsForSegment().map((content, idx) => (
                              <div
                                key={content.id}
                                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                              >
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{content.title}</p>
                                  {content.description && (
                                    <p className="text-xs text-slate-500">{content.description}</p>
                                  )}
                                </div>
                                {content.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={content.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => setIsContentDialogOpen(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Contenido
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-slate-500">Gira la ruleta para ver el contenido</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Materials Preview */}
            <Card className="mt-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Materiales de la Etapa {stageCode}</CardTitle>
                  <p className="text-sm text-slate-500">PDFs, videos y recursos educativos</p>
                </div>
                <Button onClick={() => setIsMaterialDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Material
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {stage?.materials?.map((material, idx) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                        {material.thumbnailUrl ? (
                          <img
                            src={material.thumbnailUrl}
                            alt={material.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : material.type === 'pdf' ? (
                          <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                            <FileText className="w-12 h-12 text-red-500" />
                          </div>
                        ) : material.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                            <Video className="w-12 h-12 text-blue-500" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => material.type === 'pdf' ? openPdfViewer(material) : window.open(material.url, '_blank')}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                        
                        {/* Type badge */}
                        <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0">
                          {material.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h4 className="font-bold text-sm truncate mb-1">{material.title}</h4>
                        {material.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{material.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {material.fileName || 'Sin archivo'}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingMaterial(material.id);
                                setMaterialForm(material);
                                setIsMaterialDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleDeleteMaterial(material.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Add new card */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setIsMaterialDialogOpen(true)}
                    className="aspect-[4/5] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600">
                      Agregar Material
                    </span>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Todos los Materiales</CardTitle>
                  <p className="text-sm text-slate-500">
                    {stage?.materials?.length || 0} recursos disponibles
                  </p>
                </div>
                <Button onClick={() => setIsMaterialDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Material
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stage?.materials?.map((material) => (
                    <Card key={material.id} className="overflow-hidden">
                      <div className="aspect-video bg-slate-100 relative">
                        {material.type === 'pdf' ? (
                          <div className="w-full h-full flex items-center justify-center bg-red-50">
                            <FileText className="w-16 h-16 text-red-400" />
                          </div>
                        ) : material.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50">
                            <Video className="w-16 h-16 text-blue-400" />
                          </div>
                        ) : null}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-1">{material.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{material.description}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => material.type === 'pdf' ? openPdfViewer(material) : window.open(material.url, '_blank')}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingMaterial(material.id);
                              setMaterialForm(material);
                              setIsMaterialDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            {selectedSegment ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: selectedSegment.color }}
                    >
                      {selectedSegment.number}
                    </div>
                    <div>
                      <CardTitle>{selectedSegment.title}</CardTitle>
                      <p className="text-sm text-slate-500">{selectedSegment.description}</p>
                    </div>
                  </div>
                  <Button onClick={() => setIsContentDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Contenido
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getContentsForSegment().map((content, idx) => (
                      <Card key={content.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="font-semibold">{content.title}</h4>
                              <p className="text-sm text-slate-500">{content.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{content.type}</Badge>
                            {content.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={content.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {getContentsForSegment().length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No hay contenidos para este tema</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setIsContentDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar el primero
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Selecciona un número de la ruleta para ver su contenido</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Configure Segments Dialog */}
      <Dialog open={isSegmentDialogOpen} onOpenChange={setIsSegmentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Ruleta - {stageCode}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {(stage?.segments || defaultSegments).map((segment, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: segment.color }}
                  >
                    {segment.number}
                  </div>
                  <span className="font-semibold">Segmento {segment.number}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input
                      value={segment.title}
                      onChange={(e) => {
                        const newSegments = [...(stage?.segments || defaultSegments)];
                        newSegments[idx] = { ...segment, title: e.target.value };
                        setStage(prev => prev ? { ...prev, segments: newSegments } : null);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Descripción</Label>
                    <Input
                      value={segment.description || ''}
                      onChange={(e) => {
                        const newSegments = [...(stage?.segments || defaultSegments)];
                        newSegments[idx] = { ...segment, description: e.target.value };
                        setStage(prev => prev ? { ...prev, segments: newSegments } : null);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 transition-all",
                            segment.color === color ? "border-slate-900 scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            const newSegments = [...(stage?.segments || defaultSegments)];
                            newSegments[idx] = { ...segment, color };
                            setStage(prev => prev ? { ...prev, segments: newSegments } : null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSegmentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSegments}>
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Título</Label>
              <Input
                value={materialForm.title || ''}
                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                placeholder="Ej: Introducción al FGTM"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={materialForm.description || ''}
                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                placeholder="Breve descripción del contenido..."
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={materialForm.type}
                onValueChange={(value: any) => setMaterialForm({ ...materialForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Imagen</SelectItem>
                  <SelectItem value="link">Enlace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL del archivo</Label>
              <Input
                value={materialForm.url || ''}
                onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            {materialForm.type === 'video' && (
              <div>
                <Label>URL de miniatura</Label>
                <Input
                  value={materialForm.thumbnailUrl || ''}
                  onChange={(e) => setMaterialForm({ ...materialForm, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsMaterialDialogOpen(false);
              setEditingMaterial(null);
              setMaterialForm({ type: 'pdf' });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMaterial}>
              {editingMaterial ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Dialog */}
      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Contenido - Tema #{selectedSegment?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Título</Label>
              <Input
                value={contentForm.title || ''}
                onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                placeholder="Título del contenido"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={contentForm.description || ''}
                onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                placeholder="Descripción..."
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={contentForm.type}
                onValueChange={(value: any) => setContentForm({ ...contentForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {contentForm.type !== 'text' && (
              <div>
                <Label>URL</Label>
                <Input
                  value={contentForm.url || ''}
                  onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsContentDialogOpen(false);
              setContentForm({ type: 'text' });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveContent}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedMaterial?.title}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsPdfViewerOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="h-[80vh] bg-slate-100">
            {selectedMaterial?.url ? (
              <iframe
                src={selectedMaterial.url}
                className="w-full h-full"
                title={selectedMaterial.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No hay archivo para mostrar</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
