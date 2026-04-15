import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Users,
  Star,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  ImageIcon,
  Video,
  Link2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  PlayCircle,
  Award,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { coursesApi } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ClientCourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const hasMembership = hasRole(['ingenio', 'superadmin']);

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
      
      // Auto-expand first module
      if (courseData.modules?.length > 0) {
        setExpandedModules([courseData.modules[0].id]);
      }
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
      toast.success('Inscripción exitosa');
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Error al inscribirse');
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
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-green-500" />;
      case 'video': return <Video className="w-4 h-4 text-blue-500" />;
      default: return <Link2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Cargando material...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto opacity-50">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-black uppercase tracking-widest text-sm">Curso no encontrado</p>
          <p className="text-xs text-muted-foreground font-medium">El curso que buscas no existe o ha sido movido</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-2xl px-8">Volver atrás</Button>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = enrollment?.completedLessons || [];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header Overlay */}
      <div className="px-5 pt-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-11 h-11 flex items-center justify-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-black uppercase tracking-widest text-muted-foreground/40 line-clamp-1">{course.category}</h1>
          <p className="text-lg font-black dark:text-white line-clamp-1">{course.title}</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-5">
        <div className="relative aspect-[16/10] bg-gray-100 dark:bg-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/5">
          {course.coverImage ? (
            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/40" />
            </div>
          )}
          
          {/* Status Badge Overlay */}
          {!isEnrolled && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] text-center space-y-3">
                <Lock className="w-10 h-10 text-white mx-auto" />
                <p className="text-white font-black uppercase tracking-widest text-xs italic">Contenido Protegido</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="px-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] font-black uppercase px-2 shadow-none">
              Exclusivo Miembros
            </Badge>
            {hasMembership && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase px-2">
                Acceso Concedido
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{course.title}</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed italic border-l-2 border-amber-500 pl-4">
            {course.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
            <Users className="w-4 h-4 text-amber-500 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Estudiantes</p>
            <p className="text-lg font-black dark:text-white">+{course.enrolledCount}</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
            <Star className="w-4 h-4 text-amber-500 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Calificación</p>
            <p className="text-lg font-black dark:text-white">{course.rating || '5.0'}</p>
          </div>
        </div>

        {/* Progress System */}
        <AnimatePresence>
          {isEnrolled && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 dark:bg-amber-500 rounded-[2.5rem] p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tu avance actual</p>
                  <p className="text-xl font-black">{Math.round(enrollment.progress || 0)}% Completado</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
              <Progress value={enrollment.progress || 0} className="h-2 bg-white/20" indicatorClassName="bg-white" />
              <p className="text-[10px] font-bold uppercase tracking-widest mt-4 opacity-70">
                Llevas {completedLessons.length} de {totalLessons} lecciones superadas
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Explorer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Estructura del Curso</h3>
            <Badge variant="outline" className="rounded-full text-[10px] font-bold border-gray-200">{course.modules?.length} Secciones</Badge>
          </div>

          <div className="space-y-3">
            {course.modules?.map((mod: any, moduleIndex: number) => {
              const isExpanded = expandedModules.includes(mod.id);

              return (
                <div key={mod.id} className="group bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-5 text-left active:bg-gray-50 dark:active:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center text-xs font-black group-hover:bg-amber-500 group-hover:text-white transition-all">
                        {moduleIndex + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black dark:text-white leading-tight truncate">{mod.title}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
                          {mod.lessons?.length || 0} materiales de estudio
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-gray-100 dark:border-white/10 flex items-center justify-center">
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-2 overflow-hidden"
                      >
                        {mod.lessons?.map((lesson: any, lessonIndex: number) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          const embedUrl = lesson.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;

                          return (
                            <div key={lesson.id} className="rounded-2xl border border-gray-50 dark:border-white/5 overflow-hidden">
                              <div className="flex items-center gap-4 p-4">
                                {isEnrolled ? (
                                  <button 
                                    onClick={() => handleToggleLesson(lesson.id, isCompleted)}
                                    className={cn(
                                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                      isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-amber-500/10 text-amber-600"
                                    )}
                                  >
                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                  </button>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 text-muted-foreground/40 flex items-center justify-center">
                                    <Lock className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-xs font-bold leading-tight",
                                    isCompleted ? "text-muted-foreground line-through" : "text-gray-900 dark:text-white"
                                  )}>
                                    {lessonIndex + 1}. {lesson.title}
                                  </p>
                                </div>
                              </div>

                              {isEnrolled && isExpanded && (
                                <div className="px-4 pb-4 space-y-4">
                                  {embedUrl && (
                                    <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg ring-1 ring-white/10">
                                      <iframe
                                        src={embedUrl}
                                        title={lesson.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}

                                  {lesson.resources?.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">Material descargable</p>
                                      <div className="grid gap-2">
                                        {lesson.resources.map((res: any) => (
                                          <a
                                            key={res.id}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-amber-500/5 transition-colors group/res"
                                          >
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                                              {getResourceIcon(res.type)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 flex-1 truncate">{res.title}</span>
                                            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover/res:text-amber-500" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-2 left-0 right-0 p-4 pt-10 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent z-40">
        <div className="max-w-md mx-auto">
          {!isEnrolled ? (
            <div className="flex gap-2">
              {hasMembership ? (
                <Button 
                  onClick={handleEnroll} 
                  disabled={enrolling}
                  className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 group scale-100 active:scale-95 transition-all"
                >
                  {enrolling ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Empezar ahora gratis
                      <Play className="w-4 h-4 ml-2 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/app/ingenio')}
                  className="flex-1 h-14 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest shadow-xl group scale-100 active:scale-95 transition-all"
                >
                  Unirse para acceder
                  <Zap className="w-4 h-4 ml-2 fill-amber-500 text-amber-500" />
                </Button>
              )}
            </div>
          ) : enrollment.progress < 100 && (
            <Button 
              onClick={() => {
                const firstModuleId = course.modules?.[0]?.id;
                if (firstModuleId && !expandedModules.includes(firstModuleId)) {
                  setExpandedModules([firstModuleId]);
                }
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-widest shadow-xl group"
            >
              Continuar lección
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
