import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, BookOpen, MoreHorizontal, Video, Users, Star, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { token, user } = useAuthStore();

  // Form State
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Finanzas',
    level: 'beginner'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newCourse,
          price: Number(newCourse.price),
          instructorId: user?.id, // Should normally be handled by backend from token, but sending just in case or if flexible
          slug: newCourse.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now()
        })
      });

      if (res.ok) {
        toast.success('Curso creado exitosamente');
        setIsCreateOpen(false);
        setNewCourse({ title: '', description: '', price: '', category: 'Finanzas', level: 'beginner' });
        fetchCourses();
      } else {
        toast.error('Error al crear curso');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Curso eliminado');
        fetchCourses();
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  }

  const filteredCourses = courses.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cursos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona el contenido educativo</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
              <DialogDescription>
                Añade los detalles del nuevo curso.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea id="desc" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (Gs)</Label>
                  <Input id="price" type="number" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <Select value={newCourse.level} onValueChange={val => setNewCourse({ ...newCourse, level: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Guardar Curso</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-800">
                  <TableHead className="dark:text-gray-400">Curso</TableHead>
                  <TableHead className="dark:text-gray-400">Instructor</TableHead>
                  <TableHead className="dark:text-gray-400">Estudiantes</TableHead>
                  <TableHead className="dark:text-gray-400">Precio</TableHead>
                  <TableHead className="dark:text-gray-400">Estado</TableHead>
                  <TableHead className="text-right dark:text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron cursos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course: any, index) => (
                    <motion.tr
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Badge variant="secondary" className="text-[10px] h-5">{course.level}</Badge>
                              <span>{course.modules?.length || 0} módulos</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {course.instructor?.firstName || 'Admin'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{course.enrolledCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(course.price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                          {course.isPublished ? 'Publicado' : 'Borrador'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="dark:text-gray-400 dark:hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                            <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:focus:bg-slate-800">
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400 cursor-pointer dark:focus:bg-slate-800"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
