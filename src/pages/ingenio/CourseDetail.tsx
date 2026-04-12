import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Lock, ChevronDown, ChevronUp, FileText, Video, Link2, ExternalLink, Sparkles, Headphones, Download, CheckCircle
} from 'lucide-react';
import { coursesApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores';
import { SecureViewer } from '@/components/shared/SecureViewer';

// ─── Media type detection ──────────────────────────────────────────────────────
function getMediaType(url: string): 'youtube' | 'video' | 'audio' | 'pdf' | 'doc' | 'link' {
  if (!url) return 'link';
  const lower = url.toLowerCase();
  
  // Base64 detection
  if (lower.startsWith('data:')) {
    if (lower.includes('application/pdf')) return 'pdf';
    if (lower.includes('video/')) return 'video';
    if (lower.includes('audio/')) return 'audio';
    if (lower.includes('word') || lower.includes('officedocument')) return 'doc';
  }

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/.test(lower)) return 'video';
  if (/\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/.test(lower)) return 'audio';
  if (/\.pdf(\?|$)/.test(lower)) return 'pdf';
  if (/\.(docx?|xlsx?|pptx?|txt|csv)(\?|$)/.test(lower)) return 'doc';
  return 'link';
}

function getYouTubeEmbedUrlStatic(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function LessonIcon({ url, completed }: { url?: string; completed?: boolean }) {
  if (completed) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (!url) return <Play className="w-5 h-5 text-indigo-500" />;
  const type = getMediaType(url);
  switch (type) {
    case 'youtube':
    case 'video':   return <Video className="w-5 h-5 text-indigo-500" />;
    case 'audio':   return <Headphones className="w-5 h-5 text-violet-500" />;
    case 'pdf':     return <FileText className="w-5 h-5 text-rose-500" />;
    case 'doc':     return <FileText className="w-5 h-5 text-blue-500" />;
    default:        return <Link2 className="w-5 h-5 text-slate-500" />;
  }
}

function LessonMedia({ url, title }: { url: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const type = getMediaType(url);

  if (type === 'youtube') {
    const embed = getYouTubeEmbedUrlStatic(url);
    if (!embed) return null;
    return (
      <div className="aspect-video rounded-3xl overflow-hidden bg-black mb-2 shadow-2xl">
        <iframe src={embed} className="w-full h-full border-none" allowFullScreen title={title} />
      </div>
    );
  }

  // If it's a secure material file, use SecureViewer
  if (['pdf', 'video', 'audio', 'doc'].includes(type)) {
     return (
        <div className={cn(
            "rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-2 transition-all duration-500",
            open ? "shadow-2xl shadow-indigo-500/20" : "shadow-sm"
        )}>
            <button 
                onClick={() => setOpen(o => !o)} 
                className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 group"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                        type === 'pdf' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" :
                        type === 'video' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" :
                        "bg-violet-50 dark:bg-violet-500/10 text-violet-500"
                    )}>
                        {type === 'pdf' && <FileText className="w-5 h-5" />}
                        {type === 'video' && <Video className="w-5 h-5" />}
                        {type === 'audio' && <Headphones className="w-5 h-5" />}
                        {type === 'doc' && <FileText className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{type}</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white">{open ? 'Ocultar material' : 'Abrir material seguro'}</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            
            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-100 dark:bg-slate-950 p-2"
                    >
                        <div className="h-[500px] w-full">
                            <SecureViewer 
                                url={url} 
                                type={type as any} 
                                title={title || 'Material'} 
                                onClose={() => setOpen(false)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
     );
  }

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-2">
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-500 font-black text-xs">
          {type.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-700 dark:text-white truncate">{title || url}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ExternalLink className="w-4 h-4 text-indigo-500" />
        </a>
      </div>
    </div>
  );
}

export default function IngenioCourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  const { isActive } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, enrollmentsData] = await Promise.all([
        coursesApi.getById(id!),
        coursesApi.getMyCourses(),
      ]);
      setCourse(courseData);
      const myEnrollment = enrollmentsData.find((e: any) => e.courseId === id);
      setEnrollment(myEnrollment || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = !!enrollment;
  const hasAccess = isActive || isEnrolled;

  const handleAction = async () => {
    if (isEnrolled) {
        // Already inside, maybe scroll to study plan or something? 
        // Or just toast.
        toast.info("Ya estás inscrito en este curso.");
        return;
    }

    if (isActive) {
        // Free enrollment for IM users
        try {
            await coursesApi.enroll(id!);
            toast.success("¡Excelente! Te has inscrito gratuitamente gracias a tu suscripción IM.");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Error al inscribirse.");
        }
    } else {
        // Paywall
        openPaywall();
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(mid => mid !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleToggleLesson = async (lessonId: string, completed: boolean) => {
    if (!enrollment) return;
    try {
      const updated = await coursesApi.updateProgress(enrollment.id, lessonId, !completed);
      setEnrollment(updated);
    } catch (error) {
      toast.error('Error al actualizar progreso');
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Abriendo material...</div>;
  if (!course) return <div className="p-20 text-center">Curso no encontrado</div>;

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = enrollment?.completedLessons || [];

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-2xl h-12 w-12 shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{course.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge className="bg-indigo-600 text-white border-none font-black">{course.category}</Badge>
            {!hasAccess && <Badge variant="outline" className="text-slate-400 font-bold">Bloqueado</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 space-y-8">
           <div className="aspect-video relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl overflow-hidden group">
              {hasAccess ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md mb-4 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => {
                        const firstMod = course.modules?.[0];
                        if (firstMod) toggleModule(firstMod.id);
                    }}>
                        <Play className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-white font-black text-xl mb-1 uppercase tracking-tighter">Plan de Estudio Habilitado</p>
                    <p className="text-slate-300 font-medium">Selecciona una lección debajo para comenzar.</p>
                 </div>
              ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/60 backdrop-blur-md">
                    <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-6 border border-white/20 shadow-2xl">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Contenido Exclusivo</h2>
                    <Button onClick={handleAction} className="bg-white hover:bg-slate-200 text-slate-950 font-black h-14 px-10 rounded-2xl shadow-2xl shadow-white/10">
                        Desbloquear con Acceso Full
                    </Button>
                 </div>
              )}
              {course.coverImage && <img src={course.coverImage} className="w-full h-full object-cover opacity-60" />}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-full rounded-[2.5rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-8 shadow-xl shadow-indigo-500/5">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tighter">
                    <Sparkles className="w-6 h-6 text-indigo-500" /> Acerca del Curso
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {course.description || "Descubre todo lo que este curso tiene para ofrecerte en tu camino hacia la maestría financiera."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                    { label: 'Lecciones', value: totalLessons, color: 'text-blue-500' },
                    { label: 'Nivel', value: course.level || 'Multinivel', color: 'text-purple-500' },
                    { label: 'Instructor', value: course.instructorName || 'IM Team', color: 'text-indigo-500' },
                    { label: 'Actualización', value: course.updateYear || 'Actual', color: 'text-emerald-500' }
                 ].map(stat => (
                    <div key={stat.label} className="p-5 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">{stat.label}</p>
                       <p className={cn("text-lg font-black leading-tight truncate", stat.color)}>{stat.value}</p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                   Plan de Estudio
                </h3>
              </div>
              
              <div className="space-y-4">
                 {course.modules?.map((mod: any, i: number) => {
                    const isExp = expandedModules.includes(mod.id);
                    return (
                        <div key={mod.id} className={cn(
                            "rounded-[2rem] border transition-all overflow-hidden",
                            hasAccess ? "bg-white dark:bg-slate-900 border-slate-100" : "bg-slate-50/50 dark:bg-slate-900 opacity-60 pointer-events-none"
                        )}>
                            <button onClick={() => toggleModule(mod.id)} className="w-full p-6 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center font-black text-indigo-600 text-xs">{i+1}</div>
                                    <span>{mod.title}</span>
                                </div>
                                {isExp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            <AnimatePresence>
                                {isExp && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-6 pb-6 space-y-4">
                                        <div className="pt-2 border-t border-slate-50 dark:border-slate-800 space-y-4">
                                            {mod.lessons?.map((lesson: any, li: number) => {
                                                const isDone = completedLessons.includes(lesson.id);
                                                return (
                                                    <div key={lesson.id} className="space-y-4">
                                                       <div className="flex items-start gap-4">
                                                          <button onClick={() => handleToggleLesson(lesson.id, isDone)} className="mt-1">
                                                              <LessonIcon url={lesson.videoUrl} completed={isDone} />
                                                          </button>
                                                          <div className="flex-1">
                                                             <p className={cn("font-bold text-sm", isDone && "text-slate-400 line-through")}>{li+1}. {lesson.title}</p>
                                                             <p className="text-xs text-slate-500 mt-0.5">{lesson.description}</p>
                                                          </div>
                                                       </div>
                                                       {lesson.videoUrl && (
                                                          <div className="ml-9">
                                                             <LessonMedia url={lesson.videoUrl} title={lesson.title} />
                                                          </div>
                                                       )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
