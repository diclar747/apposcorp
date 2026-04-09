import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Users, Star, CheckCircle, Lock,
  ChevronDown, ChevronUp, BookOpen, FileText, ImageIcon,
  Video, Link2, ExternalLink, Wallet, Sparkles, Headphones, Download
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { coursesApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// ─── Media type detection ──────────────────────────────────────────────────────

function getMediaType(url: string): 'youtube' | 'video' | 'audio' | 'pdf' | 'doc' | 'link' {
  if (!url) return 'link';
  const lower = url.toLowerCase();
  // YouTube
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  // Direct video
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/.test(lower)) return 'video';
  // Audio
  if (/\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/.test(lower)) return 'audio';
  // PDF
  if (/\.pdf(\?|$)/.test(lower)) return 'pdf';
  // Docs
  if (/\.(docx?|xlsx?|pptx?|txt|csv)(\?|$)/.test(lower)) return 'doc';
  return 'link';
}

function getYouTubeEmbedUrlStatic(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// Icon shown in lesson row based on media type
function LessonIcon({ url }: { url?: string }) {
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

// Full media renderer for lesson content — collapsible
function LessonMedia({ url, title }: { url: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const type = getMediaType(url);

  // YouTube & direct video: always visible (playing experience is the point)
  if (type === 'youtube') {
    const embed = getYouTubeEmbedUrlStatic(url);
    if (!embed) return null;
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-2">
        <iframe src={embed} className="w-full h-full" allowFullScreen title={title} />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="rounded-2xl overflow-hidden bg-black mb-2">
        <video controls className="w-full max-h-[420px]" src={url}>
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    );
  }

  // Audio — collapsible
  if (type === 'audio') {
    return (
      <div className="rounded-2xl border border-violet-100 dark:border-violet-800 overflow-hidden mb-2">
        {/* Header */}
        <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 px-4 py-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Audio</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{title}</p>
          </div>
          <a href={url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors" title="Descargar">
            <Download className="w-4 h-4 text-violet-500" />
          </a>
          <button onClick={() => setOpen(o => !o)} className="p-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors">
            {open ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-violet-500" />}
          </button>
        </div>
        {/* Expanded player */}
        {open && (
          <div className="px-4 py-3 bg-white dark:bg-slate-900">
            <audio controls className="w-full" src={url}>
              Tu navegador no soporta la reproducción de audio.
            </audio>
          </div>
        )}
      </div>
    );
  }

  // PDF — collapsible with inline viewer
  if (type === 'pdf') {
    return (
      <div className="rounded-2xl border border-rose-100 dark:border-rose-900 overflow-hidden mb-2">
        {/* Header */}
        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 px-4 py-3">
          <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">PDF</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{title}</p>
          </div>
          <a href={url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-800 transition-colors" title="Descargar">
            <Download className="w-4 h-4 text-rose-500" />
          </a>
          <button onClick={() => setOpen(o => !o)} className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-800 transition-colors">
            {open ? <ChevronUp className="w-4 h-4 text-rose-500" /> : <ChevronDown className="w-4 h-4 text-rose-500" />}
          </button>
        </div>
        {/* Expanded PDF viewer */}
        {open && (
          <iframe src={url} className="w-full border-t border-rose-100 dark:border-rose-900" style={{ height: '520px' }} title={title} />
        )}
      </div>
    );
  }

  // Document — collapsible (just opens externally, no inline viewer)
  if (type === 'doc') {
    return (
      <div className="rounded-2xl border border-blue-100 dark:border-blue-800 overflow-hidden mb-2">
        {/* Header */}
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Documento</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{title}</p>
          </div>
          <a href={url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors" title="Descargar">
            <Download className="w-4 h-4 text-blue-500" />
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors" title="Abrir">
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </a>
        </div>
      </div>
    );
  }

  // Generic link — collapsible
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-2">
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3">
        <div className="w-9 h-9 bg-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enlace</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{title || url}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Abrir enlace">
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </a>
      </div>
    </div>
  );
}



export default function IngenioCourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchData();
    if (user) fetchWallet(user.id);
  }, [id, user, fetchWallet]);

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

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(mid => mid !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      await coursesApi.enroll(course.id);
      toast.success(course.price > 0 ? 'Pago realizado e inscripción exitosa' : 'Inscripción exitosa');
      fetchData();
      if (user) fetchWallet(user.id);
    } catch (error: any) {
      toast.error(error?.message || 'Error al procesar el pago o inscribirse');
    } finally {
      setEnrolling(false);
    }
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

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4 text-rose-500" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'video': return <Video className="w-4 h-4 text-indigo-500" />;
      default: return <Link2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Cargando material académico...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-medium text-lg">Módulo no encontrado</p>
        <Button onClick={() => navigate(-1)} className="mt-4 bg-indigo-600 rounded-xl">Volver a la Academia</Button>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = enrollment?.completedLessons || [];

  return (
    <div className="space-y-8 pb-32 max-w-4xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-none font-bold uppercase tracking-wider text-[10px]">
                {course.category || "General"}
              </Badge>
              {!isEnrolled && (
                <Badge variant="outline" className="text-slate-400 border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                  Contenido Bloqueado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Visual Player Section (Actual Video or Locked Overlay) */}
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
            {isEnrolled ? (
              /* If enrolled, show the main course introduction or first lesson if selected */
              course.coverImage ? (
                <img src={course.coverImage} className="w-full h-full object-cover opacity-40 blur-sm" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
                   <Play className="w-20 h-20 text-white/20" />
                </div>
              )
            ) : (
              /* If NOT enrolled, show a locked state */
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 border border-white/20 shadow-2xl animate-pulse">
                   <Lock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Módulo Exclusivo</h2>
                <p className="text-slate-400 max-w-sm mb-8 text-sm leading-relaxed">
                  Este contenido es parte de la formación avanzada {course.category}. Adquiere el acceso permanente para desbloquear las lecciones.
                </p>
                {!isEnrolled && (
                  <Button 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 text-lg font-black shadow-2xl shadow-indigo-600/40 border-b-4 border-indigo-800 transform active:translate-y-1 transition-all"
                  >
                    {enrolling ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                      </div>
                    ) : (
                      <>Desbloquear por {formatCurrency(course.price)}</>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {/* Background for Locked State */}
            {!isEnrolled && course.coverImage && (
              <img src={course.coverImage} className="w-full h-full object-cover opacity-20" />
            )}
            {!isEnrolled && !course.coverImage && (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
            )}
          </div>

          {/* Description & Metadata */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" /> Acerca de este Módulo
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
              {course.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nivel</p>
                 <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{course.level || "Multinivel"}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duración</p>
                 <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{totalLessons} Lecciones</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Instructor</p>
                 <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{course.instructorName || "Ingenio Millonario"}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actualización</p>
                 <p className="font-black text-slate-900 dark:text-white uppercase text-sm">
                   {course.updateYear || (course.updatedAt ? new Date(course.updatedAt).getFullYear() : new Date().getFullYear())}
                 </p>
               </div>
            </div>
          </div>

          {/* Plan de Estudio (Locked/Unlocked) */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" /> Plan de Estudio
            </h3>
            
            <div className="space-y-4">
              {(!course.modules || course.modules.length === 0) ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-medium italic">Contenido en fase de producción.</p>
                </div>
              ) : (
                course.modules.map((mod: any, modIdx: number) => {
                  const isExp = expandedModules.includes(mod.id) && isEnrolled;
                  return (
                    <div 
                      key={mod.id} 
                      className={cn(
                        "rounded-[2rem] overflow-hidden transition-all duration-300",
                        isEnrolled ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800" : "bg-slate-50/50 dark:bg-slate-900/30 border border-transparent opacity-60"
                      )}
                    >
                      <button 
                        disabled={!isEnrolled}
                        onClick={() => toggleModule(mod.id)}
                        className="w-full h-16 px-6 flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-xs shadow-sm">
                             {modIdx + 1}
                           </div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                             {mod.title}
                           </h4>
                        </div>
                        {isEnrolled ? (
                          isExp ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExp && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-50 dark:border-slate-800">
                            <div className="p-2 space-y-1">
                              {mod.lessons?.map((lesson: any, lessonIdx: number) => {
                                const isCompleted = completedLessons.includes(lesson.id);
                                const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
                                
                                return (
                                  <div key={lesson.id} className="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                     <div className="flex items-start gap-4 mb-4">
                                        <button onClick={() => handleToggleLesson(lesson.id, isCompleted)} className="mt-1">
                                           {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <LessonIcon url={lesson.videoUrl} />}
                                        </button>
                                        <div className="flex-1">
                                          <p className={cn("font-bold text-sm", isCompleted ? "text-slate-400 line-through" : "text-slate-900 dark:text-white")}>
                                            {lessonIdx + 1}. {lesson.title}
                                          </p>
                                          <p className="text-xs text-slate-500 mt-1">{lesson.description}</p>
                                        </div>
                                     </div>
                                     
                                     {lesson.videoUrl && (
                                       <div className="ml-9">
                                         <LessonMedia url={lesson.videoUrl} title={lesson.title} />
                                       </div>
                                     )}

                                     {lesson.resources?.length > 0 && (
                                       <div className="flex flex-wrap gap-2 ml-9 mt-3">
                                          {lesson.resources.map((res: any) => (
                                            <a key={res.id} href={res.url} target="_blank" rel="noopener" className="flex items-center gap-2 text-[10px] font-black uppercase p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-colors">
                                               {getResourceIcon(res.type)}
                                               <span>{res.title}</span>
                                            </a>
                                          ))}
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
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isEnrolled && !loading && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-4 right-4 md:left-[280px] md:right-8 z-50 pointer-events-none flex justify-center"
          >
            <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto w-full max-w-4xl border-t-2 border-t-indigo-500/30">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                    <Wallet className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Precio de Acceso</p>
                    <p className="text-3xl font-black text-white tracking-tighter leading-none">{formatCurrency(course.price)}</p>
                 </div>
              </div>
              
              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                 <Button 
                   onClick={handleEnroll}
                   disabled={enrolling}
                   className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 text-lg font-black shadow-2xl shadow-indigo-600/30 border-b-4 border-indigo-800 transition-all active:border-b-0 active:translate-y-1"
                 >
                    {enrolling ? (
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                         <span>Procesando...</span>
                      </div>
                    ) : 'Adquirir con Billetera'}
                 </Button>
                 <div className="flex items-center justify-center md:justify-end gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <p className="text-[10px] font-bold uppercase text-slate-400">Tu Saldo:</p>
                    <span className={cn("text-[11px] font-black", wallet && wallet.balance >= course.price ? "text-emerald-400" : "text-rose-400")}>
                      {formatCurrency(wallet?.balance || 0)}
                    </span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
