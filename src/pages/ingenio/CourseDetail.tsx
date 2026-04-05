import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Users, Star, CheckCircle, Lock,
  ChevronDown, ChevronUp, BookOpen, FileText, ImageIcon,
  Video, Link2, ExternalLink, Wallet
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { coursesApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

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
        coursesApi.getMyEnrollments(),
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
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white line-clamp-1">{course.title}</h1>
      </div>

      {/* Cover Image */}
      <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        {course.coverImage ? (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
            <BookOpen className="w-20 h-20 text-white/30" />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <Badge className="mb-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-3 py-1 font-bold">{course.category || "General"}</Badge>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{course.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{course.description}</p>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-lg">
              {course.instructorName?.[0] || 'I'}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">{course.instructorName}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Instructor</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
            <Users className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">{course.enrolledCount} cursando</span>
          </div>
        </div>
      </div>

      {/* Progress (if enrolled) */}
      {isEnrolled && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-500/20">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-200 dark:border-indigo-500/20 pb-3">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider text-sm flex items-center gap-2">
              <Star className="w-4 h-4" /> Avance del Módulo
            </span>
            <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">{Math.round(enrollment.progress || 0)}%</span>
          </div>
          <Progress value={enrollment.progress || 0} className="h-3 bg-white dark:bg-slate-900 shadow-inner" />
          <p className="text-sm font-semibold text-indigo-600/80 dark:text-indigo-400/80 mt-3 text-right">
            {completedLessons.length} de {totalLessons} lecciones superadas
          </p>
        </div>
      )}

      {/* Modules */}
      <div>
        <h3 className="font-black text-xl text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" /> Plan de Estudio
        </h3>
        <div className="space-y-3">
          {(!course.modules || course.modules.length === 0) ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Contenido en preparación</p>
            </div>
          ) : (
            course.modules.map((mod: any, moduleIndex: number) => {
              const isExpanded = expandedModules.includes(mod.id);

              return (
                <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {moduleIndex + 1}
                      </span>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">{mod.title}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{mod.lessons?.length || 0} lecciones</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800"
                      >
                        {mod.lessons?.map((lesson: any, lessonIndex: number) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          const embedUrl = lesson.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;

                          return (
                            <div key={lesson.id} className="border-b border-slate-200/50 dark:border-slate-800/50 last:border-b-0">
                              <div className="flex items-start gap-4 p-5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors">
                                {isEnrolled ? (
                                  <button onClick={() => handleToggleLesson(lesson.id, isCompleted)} className="mt-0.5 mt-1 transform hover:scale-110 active:scale-95 transition-transform">
                                    {isCompleted ? (
                                      <CheckCircle className="w-6 h-6 text-emerald-500 fill-emerald-50 dark:fill-emerald-900/20" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                                        <Play className="w-3 h-3 text-indigo-500 ml-0.5" />
                                      </div>
                                    )}
                                  </button>
                                ) : (
                                  <Lock className="w-5 h-5 text-slate-400 mt-1" />
                                )}
                                <div className="flex-1">
                                  <p className={`font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                    {lessonIndex + 1}. {lesson.title}
                                  </p>
                                  {lesson.description && (
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{lesson.description}</p>
                                  )}
                                </div>
                              </div>

                              {isEnrolled && embedUrl && (
                                <div className="px-5 pb-5 pl-14">
                                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-md">
                                    <iframe
                                      src={embedUrl}
                                      title={lesson.title}
                                      className="w-full h-full"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}

                              {isEnrolled && lesson.resources?.length > 0 && (
                                <div className="px-5 pb-4 pl-14 flex flex-wrap gap-2">
                                  {lesson.resources.map((res: any) => (
                                    <a
                                      key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs font-bold py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-slate-700 dark:text-slate-300 group"
                                    >
                                      {getResourceIcon(res.type)}
                                      <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{res.title}</span>
                                      <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
                                    </a>
                                  ))}
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
            })
          )}
        </div>
      </div>

      {/* Pay or Enroll Button */}
      {!isEnrolled && (
        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 z-10 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-3xl shadow-2xl pointer-events-auto max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(course.price)}
              </p>
              {course.comparePrice > 0 && (
                <p className="text-sm font-semibold text-slate-400 line-through flex gap-1">
                  Valoración <span className="text-rose-400 line-through">{formatCurrency(course.comparePrice)}</span>
                </p>
              )}
            </div>
            <div>
              {course.price > 0 ? (
                <div className="flex flex-col items-end">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-lg shadow-indigo-600/20" 
                    onClick={handleEnroll} 
                    disabled={enrolling}
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    {enrolling ? 'Procesando pago...' : 'Pagar con la Billetera'}
                  </Button>
                  <span className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
                    Saldo Billetera: <span className={cn(wallet && wallet.balance >= course.price ? "text-emerald-500" : "text-rose-500")}>{formatCurrency(wallet?.balance || 0)}</span>
                  </span>
                </div>
              ) : (
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-lg shadow-emerald-500/20" 
                  onClick={handleEnroll} 
                  disabled={enrolling}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  {enrolling ? 'Inscribiendo...' : 'Inscribirse Gratis'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
