import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, FileText, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wheel, type WheelSegment } from '@/components/ingenio/Wheel';

// Segmentos E1
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

interface Material {
  id: string;
  title: string;
  segmentNumber: number;
  fileUrl: string;
  fileType: 'pdf' | 'video';
}

export default function PresentacionE1() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Cargar materiales
  useEffect(() => {
    const saved = localStorage.getItem('ingenio-materials-E1');
    if (saved) {
      setMaterials(JSON.parse(saved));
    }
  }, []);

  const handleSegmentSelected = (segment: WheelSegment) => {
    setSelectedSegment(segment);
    setIsSpinning(false);
    toast.success(`¡Seleccionado: ${segment.title}!`);
  };

  const getMaterialsForSegment = (segmentNumber: number) => {
    return materials.filter(m => m.segmentNumber === segmentNumber);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white">Ingenio Millonario</h1>
              <p className="text-xs text-slate-500">Presentación E1 - Fundamentos</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => window.location.href = '/login'}>
            Iniciar Sesión <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            La Ruleta de la Prosperidad
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gira la ruleta para descubrir qué tema estudiar hoy
          </p>
        </div>

        {/* Wheel + Content Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Wheel Section */}
          <div className="flex flex-col items-center">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
              <Wheel 
                segments={segments}
                onSegmentSelected={handleSegmentSelected}
                onSpinStateChange={setIsSpinning}
                size={400}
              />
            </div>
          </div>

          {/* Content List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-green-500">Contenido</span>
            </h3>
            <div className="space-y-3">
              {segments.map((seg) => (
                <motion.div
                  key={seg.number}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedSegment?.number === seg.number
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                  }`}
                  onClick={() => setSelectedSegment(seg)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: seg.color }}
                  >
                    {seg.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{seg.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{seg.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Materials Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedSegment ? (
                <span className="flex items-center gap-2">
                  Materiales: 
                  <span style={{ color: selectedSegment.color }}>{selectedSegment.title}</span>
                </span>
              ) : (
                'Todos los Materiales'
              )}
            </h3>
            <Badge variant="outline" className="text-slate-500">
              {selectedSegment 
                ? `${getMaterialsForSegment(selectedSegment.number).length} materiales`
                : `${materials.length} materiales totales`
              }
            </Badge>
          </div>

          {selectedSegment && getMaterialsForSegment(selectedSegment.number).length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay materiales para este segmento aún</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(selectedSegment ? getMaterialsForSegment(selectedSegment.number) : materials).map((mat) => (
                <Card key={mat.id} className="group hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: segments.find(s => s.number === mat.segmentNumber)?.color || '#666' }}
                      >
                        {mat.segmentNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-2 text-sm">{mat.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {segments.find(s => s.number === mat.segmentNumber)?.title}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver PDF
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
