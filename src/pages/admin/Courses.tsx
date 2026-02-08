import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, BookOpen, MoreHorizontal, Users, Trash2, Edit,
  ArrowLeft, FolderPlus, FileText, ImageIcon, Video, Link2,
  ChevronDown, ChevronUp, Eye, EyeOff, UserPlus, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { coursesApi, usersApi } from '@/lib/api';

// ============ Course List View ============
function CourseListView({ onSelectCourse }: { onSelectCourse: (course: any) => void }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      const data = await coursesApi.getAll(true);
      setCourses(data);
    } catch (error) {
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const course = await coursesApi.create({
        title: newCourse.title,
        description: newCourse.description,
        price: Number(newCourse.price) || 0,
        category: newCourse.category,
        level: newCourse.level,
      });
      toast.success('Curso creado exitosamente');
      setIsCreateOpen(false);
      setNewCourse({ title: '', description: '', price: '', category: 'Finanzas', level: 'beginner' });
      fetchCourses();
      onSelectCourse(course);
    } catch (error) {
      toast.error('Error al crear curso');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;
    try {
      await coursesApi.delete(id);
      toast.success('Curso eliminado');
      fetchCourses();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleTogglePublish = async (course: any) => {
    try {
      await coursesApi.update(course.id, { isPublished: !course.isPublished });
      toast.success(course.isPublished ? 'Curso despublicado' : 'Curso publicado');
      fetchCourses();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const filteredCourses = courses.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cursos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona el contenido educativo</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
              <DialogDescription>Añade los detalles del nuevo curso.</DialogDescription>
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
                  <Input id="price" type="number" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={newCourse.category} onValueChange={val => setNewCourse({ ...newCourse, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finanzas">Finanzas</SelectItem>
                      <SelectItem value="Emprendimiento">Emprendimiento</SelectItem>
                      <SelectItem value="Inversión">Inversión</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={newCourse.level} onValueChange={val => setNewCourse({ ...newCourse, level: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Crear Curso</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-800">
                  <TableHead className="dark:text-gray-400">Curso</TableHead>
                  <TableHead className="dark:text-gray-400">Módulos</TableHead>
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
                      {loading ? 'Cargando...' : 'No se encontraron cursos'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course: any, index) => (
                    <motion.tr
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => onSelectCourse(course)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{course.category} · {course.level}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {course.modules?.length || 0} módulos
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{course.enrolledCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {course.price > 0 ? formatCurrency(course.price) : 'Gratis'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                          {course.isPublished ? 'Publicado' : 'Borrador'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="dark:text-gray-400 dark:hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                            <DropdownMenuItem onClick={() => onSelectCourse(course)} className="cursor-pointer dark:text-gray-300">
                              <Edit className="w-4 h-4 mr-2" /> Gestionar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublish(course)} className="cursor-pointer dark:text-gray-300">
                              {course.isPublished ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                              {course.isPublished ? 'Despublicar' : 'Publicar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400 cursor-pointer"
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

// ============ Course Detail/Edit View ============
function CourseDetailView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');

  // Module dialog
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  // Lesson/Material dialog
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', type: 'video' });

  // Resource dialog
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', type: 'pdf', url: '', lessonId: '' });

  // Assign user dialog
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Edit course
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '', category: '', level: '' });

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getById(courseId);
      setCourse(data);
    } catch (error) {
      toast.error('Error al cargar curso');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // ---- Course Edit ----
  const handleEditCourse = async () => {
    try {
      await coursesApi.update(courseId, {
        title: editForm.title,
        description: editForm.description,
        price: Number(editForm.price) || 0,
        category: editForm.category,
        level: editForm.level,
      });
      toast.success('Curso actualizado');
      setIsEditOpen(false);
      fetchCourse();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const openEditDialog = () => {
    if (!course) return;
    setEditForm({
      title: course.title,
      description: course.description,
      price: String(course.price),
      category: course.category,
      level: course.level,
    });
    setIsEditOpen(true);
  };

  // ---- Modules ----
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesApi.addModule(courseId, moduleForm);
      toast.success('Módulo creado');
      setIsModuleOpen(false);
      setModuleForm({ title: '', description: '' });
      fetchCourse();
    } catch (error) {
      toast.error('Error al crear módulo');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('¿Eliminar este módulo y todo su contenido?')) return;
    try {
      await coursesApi.deleteModule(moduleId);
      toast.success('Módulo eliminado');
      fetchCourse();
    } catch (error) {
      toast.error('Error al eliminar módulo');
    }
  };

  // ---- Lessons/Materials ----
  const openAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setLessonForm({ title: '', description: '', videoUrl: '', type: 'video' });
    setIsLessonOpen(true);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesApi.addLesson(selectedModuleId, {
        title: lessonForm.title,
        description: lessonForm.description,
        videoUrl: lessonForm.videoUrl || null,
      });
      toast.success('Material agregado');
      setIsLessonOpen(false);
      fetchCourse();
    } catch (error) {
      toast.error('Error al agregar material');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Eliminar este material?')) return;
    try {
      await coursesApi.deleteLesson(lessonId);
      toast.success('Material eliminado');
      fetchCourse();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // ---- Resources ----
  const openAddResource = (lessonId: string) => {
    setResourceForm({ title: '', type: 'pdf', url: '', lessonId });
    setIsResourceOpen(true);
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesApi.addResource({
        lessonId: resourceForm.lessonId || null,
        courseId: !resourceForm.lessonId ? courseId : null,
        title: resourceForm.title,
        type: resourceForm.type,
        url: resourceForm.url,
      });
      toast.success('Recurso agregado');
      setIsResourceOpen(false);
      fetchCourse();
    } catch (error) {
      toast.error('Error al agregar recurso');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await coursesApi.deleteResource(resourceId);
      toast.success('Recurso eliminado');
      fetchCourse();
    } catch (error) {
      toast.error('Error al eliminar recurso');
    }
  };

  // ---- Enrollments ----
  const fetchAllUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setAllUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      await coursesApi.assignUser(courseId, userId);
      toast.success('Usuario asignado al curso');
      setIsAssignOpen(false);
      fetchCourse();
    } catch (error: any) {
      toast.error(error?.message || 'Error al asignar usuario');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('¿Eliminar esta inscripción?')) return;
    try {
      await coursesApi.removeEnrollment(courseId, enrollmentId);
      toast.success('Inscripción eliminada');
      fetchCourse();
    } catch (error) {
      toast.error('Error al eliminar inscripción');
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      await coursesApi.update(courseId, { isPublished: !course.isPublished });
      toast.success(course.isPublished ? 'Curso despublicado' : 'Curso publicado');
      fetchCourse();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading || !course) {
    return <div className="p-8 text-center text-gray-500">Cargando curso...</div>;
  }

  const enrolledUserIds = new Set(course.enrollments?.map((e: any) => e.user?.id || e.userId) || []);
  const filteredAssignUsers = allUsers.filter((u: any) =>
    !enrolledUserIds.has(u.id) &&
    (u.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-green-500" />;
      case 'video': return <Video className="w-4 h-4 text-blue-500" />;
      default: return <Link2 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
            <Badge variant={course.isPublished ? 'default' : 'secondary'}>
              {course.isPublished ? 'Publicado' : 'Borrador'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {course.category} · {course.level} · {course.modules?.length || 0} módulos · {course.enrolledCount} estudiantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTogglePublish}>
            {course.isPublished ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {course.isPublished ? 'Despublicar' : 'Publicar'}
          </Button>
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Edit className="w-4 h-4 mr-1" /> Editar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Módulos y Materiales</TabsTrigger>
          <TabsTrigger value="students">Estudiantes ({course.enrollments?.length || 0})</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        {/* ===== MODULES TAB ===== */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Módulos del Curso</h2>
            <Button onClick={() => setIsModuleOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <FolderPlus className="w-4 h-4 mr-2" /> Nuevo Módulo
            </Button>
          </div>

          {course.modules?.length === 0 ? (
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-8 text-center">
                <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No hay módulos aún. Crea el primer módulo para agregar contenido.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {course.modules.map((mod: any, modIndex: number) => {
                const isExpanded = expandedModules.includes(mod.id);
                return (
                  <Card key={mod.id} className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      onClick={() => toggleModule(mod.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                          {modIndex + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{mod.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {mod.lessons?.length || 0} materiales
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openAddLesson(mod.id); }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t dark:border-slate-800">
                        {mod.lessons?.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">
                            Sin materiales. Haz clic en + para agregar.
                          </div>
                        ) : (
                          mod.lessons.map((lesson: any, lessonIndex: number) => (
                            <div key={lesson.id} className="border-b dark:border-slate-800 last:border-b-0">
                              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-400 font-mono w-6">{modIndex + 1}.{lessonIndex + 1}</span>
                                  {lesson.videoUrl ? (
                                    <Video className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lesson.title}</p>
                                    {lesson.videoUrl && (
                                      <p className="text-xs text-blue-500 truncate max-w-[300px]">{lesson.videoUrl}</p>
                                    )}
                                    {lesson.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAddResource(lesson.id)}>
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteLesson(lesson.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {/* Resources of this lesson */}
                              {lesson.resources?.length > 0 && (
                                <div className="pl-16 pr-4 pb-2 space-y-1">
                                  {lesson.resources.map((res: any) => (
                                    <div key={res.id} className="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 dark:bg-slate-800/50 rounded">
                                      <div className="flex items-center gap-2">
                                        {getResourceIcon(res.type)}
                                        <span className="text-gray-700 dark:text-gray-300">{res.title}</span>
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">
                                          {res.url}
                                        </a>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => handleDeleteResource(res.id)}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== STUDENTS TAB ===== */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Estudiantes Inscritos</h2>
            <Button
              onClick={() => { setIsAssignOpen(true); fetchAllUsers(); setUserSearchTerm(''); }}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Asignar Usuario
            </Button>
          </div>

          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-slate-800">
                    <TableHead className="dark:text-gray-400">Usuario</TableHead>
                    <TableHead className="dark:text-gray-400">Progreso</TableHead>
                    <TableHead className="dark:text-gray-400">Inscripción</TableHead>
                    <TableHead className="text-right dark:text-gray-400">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!course.enrollments || course.enrollments.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No hay estudiantes inscritos
                      </TableCell>
                    </TableRow>
                  ) : (
                    course.enrollments.map((enrollment: any) => (
                      <TableRow key={enrollment.id} className="dark:border-slate-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={enrollment.user?.avatar} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                {enrollment.user?.firstName?.[0]}{enrollment.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium dark:text-white">
                                {enrollment.user?.firstName} {enrollment.user?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{enrollment.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${enrollment.progress || 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(enrollment.progress || 0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {new Date(enrollment.createdAt).toLocaleDateString('es-PY')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveEnrollment(enrollment.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== INFO TAB ===== */}
        <TabsContent value="info" className="space-y-4">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Título</Label>
                  <p className="font-medium dark:text-white mt-1">{course.title}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Categoría</Label>
                  <p className="font-medium dark:text-white mt-1">{course.category}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Nivel</Label>
                  <p className="font-medium dark:text-white mt-1">{course.level}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Precio</Label>
                  <p className="font-medium dark:text-white mt-1">{course.price > 0 ? formatCurrency(course.price) : 'Gratis'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Instructor</Label>
                  <p className="font-medium dark:text-white mt-1">{course.instructorName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Estado</Label>
                  <p className="mt-1">
                    <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                      {course.isPublished ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase">Descripción</Label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{course.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOGS ===== */}

      {/* Create Module Dialog */}
      <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Módulo</DialogTitle>
            <DialogDescription>Agrega un módulo al curso.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateModule} className="space-y-4">
            <div className="space-y-2">
              <Label>Título del módulo</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit">Crear Módulo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lesson/Material Dialog */}
      <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Material</DialogTitle>
            <DialogDescription>Agrega una lección, video o contenido al módulo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>URL de Video YouTube (opcional)</Label>
              <Input
                value={lessonForm.videoUrl}
                onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <DialogFooter>
              <Button type="submit">Agregar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Resource Dialog */}
      <Dialog open={isResourceOpen} onOpenChange={setIsResourceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Recurso</DialogTitle>
            <DialogDescription>Agrega un PDF, imagen o enlace de video.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={resourceForm.type} onValueChange={val => setResourceForm({ ...resourceForm, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Imagen</SelectItem>
                  <SelectItem value="video">Video (YouTube)</SelectItem>
                  <SelectItem value="link">Enlace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={resourceForm.url}
                onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder={resourceForm.type === 'video' ? 'https://youtube.com/...' : 'https://...'}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Agregar Recurso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Asignar Usuario al Curso</DialogTitle>
            <DialogDescription>Busca y selecciona un usuario para inscribirlo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredAssignUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No se encontraron usuarios disponibles</p>
              ) : (
                filteredAssignUsers.slice(0, 20).map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => handleAssignUser(u.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium dark:text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio</Label>
                <Input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={editForm.category} onValueChange={val => setEditForm({ ...editForm, category: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                    <SelectItem value="Emprendimiento">Emprendimiento</SelectItem>
                    <SelectItem value="Inversión">Inversión</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={editForm.level} onValueChange={val => setEditForm({ ...editForm, level: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditCourse}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Main Component ============
export default function AdminCourses() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  if (selectedCourseId) {
    return (
      <CourseDetailView
        courseId={selectedCourseId}
        onBack={() => setSelectedCourseId(null)}
      />
    );
  }

  return (
    <CourseListView
      onSelectCourse={(course) => setSelectedCourseId(course.id)}
    />
  );
}
