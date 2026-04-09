import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, Star, Clock, Play, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { coursesApi } from '@/lib/api';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const categories = ['Todos', 'Finanzas', 'Emprendimiento', 'Inversión', 'Marketing'];

export default function ClientCourses() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [activeTab, setActiveTab] = useState<'all' | 'my-courses'>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, enrollmentsData] = await Promise.all([
        coursesApi.getAll(),
        coursesApi.getMyCourses(),
      ]);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const myEnrollmentMap = new Map(enrollments.map((e: any) => [e.courseId, e]));

  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || course.category === selectedCategory;
    const matchesTab = activeTab === 'all' || myEnrollmentMap.has(course.id);
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="space-y-4 pb-6">
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cursos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Aprende y crece</p>
      </div>

      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="px-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
            size="sm"
            className="flex-1"
          >
            Todos los cursos
          </Button>
          <Button
            variant={activeTab === 'my-courses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-courses')}
            size="sm"
            className="flex-1"
          >
            Mis cursos
          </Button>
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando cursos...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron cursos</p>
          </div>
        ) : (
          filteredCourses.map((course: any, index: number) => {
            const enrollment = myEnrollmentMap.get(course.id);
            const isEnrolled = !!enrollment;

            return (
              <Link key={course.id} to={`/app/cursos/${course.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden"
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                      {course.coverImage ? (
                        <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                          <BookOpen className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="text-[10px] mb-1">{course.category}</Badge>
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{course.title}</p>
                        </div>
                        {isEnrolled && enrollment?.progress === 100 && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{course.instructorName}</p>

                      <div className="flex items-center gap-3 mt-2">
                        {course.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{course.rating}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{course.modules?.length || 0} módulos</span>
                        </div>
                      </div>

                      {isEnrolled ? (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Progreso</span>
                            <span className="font-medium dark:text-white">{Math.round(enrollment?.progress || 0)}%</span>
                          </div>
                          <Progress value={enrollment?.progress || 0} className="h-2" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Play className="w-4 h-4" />
                            <span className="text-sm">
                              {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0} lecciones
                            </span>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {course.price > 0 ? formatCurrency(course.price) : 'Gratis'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
