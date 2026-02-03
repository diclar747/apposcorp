import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, BookOpen, Play, Users, Star, Edit, Trash2, Eye } from 'lucide-react';
import { mockCourses, mockEnrollments } from '@/data/mockData';
import { formatCurrency, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && course.isPublished) ||
                         (statusFilter === 'draft' && !course.isPublished);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500">Gestiona los cursos de la plataforma</p>
        </div>
        <Button className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Cursos</p>
            <p className="text-2xl font-bold text-gray-900">{mockCourses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Publicados</p>
            <p className="text-2xl font-bold text-gray-900">{mockCourses.filter(c => c.isPublished).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Inscripciones</p>
            <p className="text-2xl font-bold text-gray-900">{mockEnrollments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockEnrollments.length * 450000)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} size="sm">Todos</Button>
              <Button variant={statusFilter === 'published' ? 'default' : 'outline'} onClick={() => setStatusFilter('published')} size="sm">Publicados</Button>
              <Button variant={statusFilter === 'draft' ? 'default' : 'outline'} onClick={() => setStatusFilter('draft')} size="sm">Borradores</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-200 relative">
                {course.coverImage ? (
                  <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Ver</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge className="absolute bottom-3 left-3 bg-white/90 text-gray-900">
                  {course.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course.instructorName}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    <span>{course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.enrolledCount} estudiantes</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{course.rating}</span>
                    <span className="text-sm text-gray-500">({course.reviewCount})</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(course.price)}</p>
                    {course.comparePrice && (
                      <p className="text-sm text-gray-400 line-through">{formatCurrency(course.comparePrice)}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                    {course.isPublished ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
