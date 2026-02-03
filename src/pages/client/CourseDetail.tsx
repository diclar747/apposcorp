import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  Lock,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockCourses, mockEnrollments } from '@/data/mockData';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ClientCourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const course = mockCourses.find(c => c.id === id);
  const enrollment = mockEnrollments.find(e => e.courseId === id && e.userId === user?.id);
  const isEnrolled = !!enrollment;
  
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Curso no encontrado</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    );
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleEnroll = () => {
    toast.success('Inscripción exitosa');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold line-clamp-1">{course.title}</h1>
      </div>

      {/* Cover Image */}
      <div className="px-4">
        <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden">
          {course.coverImage ? (
            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-gray-300" />
            </div>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="px-4">
        <Badge className="mb-2">{course.category}</Badge>
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="text-gray-600 mt-2">{course.description}</p>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{course.rating}</span>
            <span className="text-gray-500">({course.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-5 h-5" />
            <span>{course.enrolledCount} estudiantes</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">{course.instructorName[0]}</span>
          </div>
          <div>
            <p className="font-medium">{course.instructorName}</p>
            <p className="text-sm text-gray-500">Instructor</p>
          </div>
        </div>
      </div>

      {/* Progress (if enrolled) */}
      {isEnrolled && (
        <div className="px-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">Tu progreso</span>
              <span className="font-bold text-blue-900">{enrollment.progress}%</span>
            </div>
            <Progress value={enrollment.progress} className="h-2" />
            <p className="text-sm text-blue-700 mt-2">
              {enrollment.completedLessons.length} de {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones completadas
            </p>
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="px-4">
        <h3 className="font-semibold text-gray-900 mb-3">Contenido del curso</h3>
        <div className="space-y-2">
          {course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id);
            const completedLessons = enrollment?.completedLessons || [];
            
            return (
              <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
                      {moduleIndex + 1}
                    </span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{module.title}</p>
                      <p className="text-sm text-gray-500">{module.lessons.length} lecciones</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="border-t border-gray-200"
                  >
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : isEnrolled ? (
                            <Play className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">{formatDuration(lesson.duration)}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enroll Button */}
      {!isEnrolled && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(course.price)}</p>
              {course.comparePrice && (
                <p className="text-sm text-gray-400 line-through">{formatCurrency(course.comparePrice)}</p>
              )}
            </div>
            <Button className="bg-blue-600" size="lg" onClick={handleEnroll}>
              Inscribirme ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
