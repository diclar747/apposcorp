import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, Star, Clock, Play, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockCourses, mockEnrollments } from '@/data/mockData';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const categories = ['Todos', 'Finanzas', 'Emprendimiento', 'Inversión', 'Marketing'];

export default function ClientCourses() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [activeTab, setActiveTab] = useState<'all' | 'my-courses'>('all');

  const myEnrollments = mockEnrollments.filter(e => e.userId === user?.id);
  const myCourseIds = myEnrollments.map(e => e.courseId);

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || course.category === selectedCategory;
    const matchesTab = activeTab === 'all' || myCourseIds.includes(course.id);
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Cursos</h1>
        <p className="text-sm text-gray-500">Aprende y crece</p>
      </div>

      {/* Search */}
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

      {/* Tabs */}
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

      {/* Categories - Only show in all courses */}
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

      {/* Courses List */}
      <div className="px-4 space-y-3">
        {filteredCourses.map((course, index) => {
          const enrollment = myEnrollments.find(e => e.courseId === course.id);
          const isEnrolled = !!enrollment;
          
          return (
            <Link key={course.id} to={`/app/cursos/${course.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="flex gap-3 p-3">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {course.coverImage ? (
                      <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="text-[10px] mb-1">{course.category}</Badge>
                        <p className="font-medium text-gray-900 line-clamp-2">{course.title}</p>
                      </div>
                      {isEnrolled && enrollment?.progress === 100 && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{course.instructorName}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDuration(course.duration)}</span>
                      </div>
                    </div>
                    
                    {isEnrolled ? (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">Progreso</span>
                          <span className="font-medium">{enrollment?.progress}%</span>
                        </div>
                        <Progress value={enrollment?.progress} className="h-2" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Play className="w-4 h-4" />
                          <span className="text-sm">{course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones</span>
                        </div>
                        <p className="font-bold text-gray-900">{formatCurrency(course.price)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
