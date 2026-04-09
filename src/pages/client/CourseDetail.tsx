import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { coursesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ClientCourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

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

  const handleRequestAccess = async () => {
    if (!course) return;
    try {
      await coursesApi.requestAccess(course.id);
      toast.success('Solicitud enviada al administrador');
    } catch (error: any) {
      toast.error(error?.message || 'Error al enviar solicitud');
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
    return <div className="p-8 text-center text-gray-500">Cargando curso...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Curso no encontrado</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = enrollment?.completedLessons || [];

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <h1 className="text-lg font-semibold line-clamp-1 dark:text-white">{course.title}</h1>
      </div>

      {/* Cover Image */}
      <div className="px-4">
        <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
          {course.coverImage ? (
            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
              <BookOpen className="w-16 h-16 text-white/50" />
            </div>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="px-4">
        <Badge className="mb-2">{course.category}</Badge>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{course.description}</p>

        <div className="flex items-center gap-4 mt-4">
          {course.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium dark:text-white">{course.rating}</span>
              <span className="text-gray-500">({course.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Users className="w-5 h-5" />
            <span>{course.enrolledCount} estudiantes</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">{course.instructorName?.[0] || 'A'}</span>
          </div>
          <div>
            <p className="font-medium dark:text-white">{course.instructorName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
          </div>
        </div>
      </div>

      {/* Progress (if enrolled) */}
      {isEnrolled && (
        <div className="px-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900 dark:text-blue-300">Tu progreso</span>
              <span className="font-bold text-blue-900 dark:text-blue-300">{Math.round(enrollment.progress || 0)}%</span>
            </div>
            <Progress value={enrollment.progress || 0} className="h-2" />
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              {completedLessons.length} de {totalLessons} lecciones completadas
            </p>
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="px-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contenido del curso</h3>
        <div className="space-y-2">
          {(!course.modules || course.modules.length === 0) ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin contenido disponible aún</p>
            </div>
          ) : (
            course.modules.map((mod: any, moduleIndex: number) => {
              const isExpanded = expandedModules.includes(mod.id);

              return (
                <div key={mod.id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                        {moduleIndex + 1}
                      </span>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{mod.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{mod.lessons?.length || 0} materiales</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 dark:text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      className="border-t border-gray-200 dark:border-slate-700"
                    >
                      {mod.lessons?.map((lesson: any, lessonIndex: number) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const embedUrl = lesson.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;

                        return (
                          <div key={lesson.id} className="border-b border-gray-100 dark:border-slate-800 last:border-b-0">
                            <div className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                              {isEnrolled ? (
                                <button onClick={() => handleToggleLesson(lesson.id, isCompleted)}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Play className="w-5 h-5 text-blue-500" />
                                  )}
                                </button>
                              ) : (
                                <Lock className="w-5 h-5 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <p className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                {lesson.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lesson.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Show video embed if enrolled and has video */}
                            {isEnrolled && embedUrl && (
                              <div className="px-4 pb-3">
                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                  <iframe
                                    src={embedUrl}
                                    title={lesson.title}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            )}

                            {/* Show resources */}
                            {isEnrolled && lesson.resources?.length > 0 && (
                              <div className="px-4 pb-3 space-y-1">
                                {lesson.resources.map((res: any) => (
                                  <a
                                    key={res.id}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs py-1.5 px-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    {getResourceIcon(res.type)}
                                    <span className="text-gray-700 dark:text-gray-300 flex-1">{res.title}</span>
                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enroll / Request Access Button */}
      {!isEnrolled && (
        <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 z-10">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {course.price > 0 ? formatCurrency(course.price) : 'Gratis'}
              </p>
              {course.comparePrice && (
                <p className="text-sm text-gray-400 line-through">{formatCurrency(course.comparePrice)}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={handleRequestAccess}>
                Solicitar Acceso
              </Button>
              {course.price === 0 && (
                <Button className="bg-blue-600" size="lg" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? 'Inscribiendo...' : 'Inscribirme'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
