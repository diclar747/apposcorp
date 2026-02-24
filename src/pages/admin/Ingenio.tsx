import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, BookOpen, MoreHorizontal, Users, Trash2, Edit,
    ArrowLeft, FolderPlus, FileText, ImageIcon, Video, Link2,
    ChevronDown, ChevronUp, Eye, EyeOff, UserPlus, X, Sparkles,
    TrendingUp, TrendingDown, Landmark, Receipt, Calendar, Filter
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
import { formatCurrency, cn } from '@/lib/utils';
import { coursesApi, usersApi, financesApi } from '@/lib/api';

// ============ ACADEMY SECTIONS ============

function AcademyListView({ onSelectCourse, filter }: { onSelectCourse: (course: any) => void; filter?: string }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await coursesApi.getAll(true);
            setCourses(data);
        } catch (error) {
            toast.error('Error al cargar la academia');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter((course: any) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter) {
            return matchesSearch && course.title.toUpperCase().includes(filter);
        }
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold dark:text-white uppercase tracking-tighter">Etapas de Formación</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar etapa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 h-10 rounded-full w-64 border-slate-200 dark:bg-slate-800"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCourses.map((course: any, i) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative group bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer text-center"
                        onClick={() => onSelectCourse(course)}
                    >
                        {/* Graduation Icon with circular background */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-slate-900 rounded-full shadow-md border border-slate-50 dark:border-slate-800 flex items-center justify-center z-10">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-inner">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="mt-4 space-y-4">
                            <h3 className="font-black text-blue-600 dark:text-blue-400 text-lg uppercase tracking-tight leading-none">
                                {course.title.toUpperCase()}
                            </h3>
                            <div className="h-0.5 w-12 bg-slate-100 dark:bg-slate-800 mx-auto" />
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-tight h-10 line-clamp-2">
                                {course.description || "Contenido educativo especializado"}
                            </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                {course.modules?.length || 0} SECCIONES
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none text-[9px] font-bold">
                                {course.isPublished ? "PÚBLICO" : "BORRADOR"}
                            </Badge>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ============ COURSE DETAIL / EDIT VIEW (Ported from Courses.tsx) ============

function CourseDetailView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('modules');

    // Dialog states
    const [isModuleOpen, setIsModuleOpen] = useState(false);
    const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
    const [isLessonOpen, setIsLessonOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', type: 'video' });
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', price: '', category: '', level: '' });
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
            toast.error('Error al cargar detalle');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !course) return <div className="p-20 text-center text-slate-400">Cargando material...</div>;

    const toggleModule = (id: string) => setExpandedModules(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await coursesApi.addModule(courseId, moduleForm);
            toast.success('Módulo creado');
            setIsModuleOpen(false);
            setModuleForm({ title: '', description: '' });
            fetchCourse();
        } catch (error) { toast.error('Error al crear'); }
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
        } catch (error) { toast.error('Error al agregar'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            Gestionar: <span className="text-blue-600">{course.title}</span>
                        </h2>
                        <p className="text-sm text-slate-500">{course.modules?.length || 0} módulos cargados</p>
                    </div>
                </div>
                <Button onClick={() => setIsModuleOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Módulo
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {course.modules?.map((mod: any, idx: number) => {
                        const isExp = expandedModules.includes(mod.id);
                        return (
                            <Card key={mod.id} className="rounded-2xl border-slate-100 dark:bg-slate-900 overflow-hidden shadow-sm">
                                <div onClick={() => toggleModule(mod.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600">{idx + 1}</span>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{mod.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedModuleId(mod.id); setIsLessonOpen(true); }}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </div>
                                {isExp && (
                                    <div className="p-4 pt-0 space-y-2 border-t border-slate-50 dark:border-slate-800/30">
                                        {mod.lessons?.map((lsn: any) => (
                                            <div key={lsn.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Video className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{lsn.title}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        ))}
                                        {mod.lessons?.length === 0 && <p className="text-center py-4 text-xs text-slate-400 italic">No hay materiales en este módulo</p>}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
                <div className="space-y-6">
                    <Card className="rounded-2xl p-6 border-slate-100 dark:bg-slate-900 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Estadísticas</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Estudiantes</p>
                                <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{course.enrolledCount}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Estado</p>
                                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">ACTIVO</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Dialogs scaled down for port */}
            <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
                <DialogContent className="rounded-3xl">
                    <DialogTitle>Nuevo Módulo</DialogTitle>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nombre del Módulo</Label>
                            <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} className="rounded-xl" />
                        </div>
                        <Button onClick={handleCreateModule} className="w-full rounded-xl bg-blue-600">Crear</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
                <DialogContent className="rounded-3xl">
                    <DialogTitle>Agregar Material</DialogTitle>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>URL Video</Label>
                            <Input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} className="rounded-xl" placeholder="YouTube URL..." />
                        </div>
                        <Button onClick={handleCreateLesson} className="w-full rounded-xl bg-blue-600">Agregar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ============ FINANCE / BUDGET SECTION ============

type RecordType = 'ingreso' | 'egreso' | 'activo' | 'pasivo';

function BudgetView() {
    const [activeType, setActiveType] = useState<RecordType>('ingreso');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const themeColors = {
        ingreso: {
            bg: 'bg-emerald-500',
            light: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-600 dark:text-emerald-400',
            header: 'bg-[#82cc9d]', // Green from screenshot
            button: 'bg-[#82cc9d] hover:bg-[#6fb38a]'
        },
        egreso: {
            bg: 'bg-rose-500',
            light: 'bg-rose-50 dark:bg-rose-500/10',
            text: 'text-rose-600 dark:text-rose-400',
            header: 'bg-[#f08080]', // Light coral/rose
            button: 'bg-[#f08080] hover:bg-[#e07070]'
        },
        activo: {
            bg: 'bg-blue-500',
            light: 'bg-blue-50 dark:bg-blue-500/10',
            text: 'text-blue-600 dark:text-blue-400',
            header: 'bg-[#5da9e9]',
            button: 'bg-[#5da9e9] hover:bg-[#4a98d8]'
        },
        pasivo: {
            bg: 'bg-slate-500',
            light: 'bg-slate-50 dark:bg-slate-500/10',
            text: 'text-slate-600 dark:text-slate-400',
            header: 'bg-[#a3a3a3]',
            button: 'bg-[#a3a3a3] hover:bg-[#8f8f8f]'
        }
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            // For now using mock or current finance API
            const data = await financesApi.getAll();
            setRecords(data.filter((r: any) => r.type === activeType));
        } catch (error) {
            toast.error('Error al cargar registros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [activeType]);

    const filteredRecords = records.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Type Selector Tabs */}
            <div className="flex flex-wrap gap-2">
                {(['ingreso', 'egreso', 'activo', 'pasivo'] as RecordType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all shadow-sm",
                            activeType === type
                                ? `${themeColors[type].bg} text-white shadow-lg scale-105`
                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-300"
                        )}
                    >
                        {type}s
                    </button>
                ))}
            </div>

            {/* Main Interface Block */}
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                {/* Dynamic Theme Header */}
                <div className={cn("h-16 flex items-center justify-center", themeColors[activeType].header)}>
                    <h2 className="text-white text-xl font-bold tracking-tight uppercase">
                        Gestión de {activeType}
                    </h2>
                </div>

                <CardContent className="p-8 space-y-8">
                    {/* Form Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-500 font-bold">Fecha</Label>
                            <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="rounded-xl border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-500 font-bold">Nomb. {activeType.charAt(0).toUpperCase() + activeType.slice(1)}</Label>
                            <Input placeholder={`Nombre del ${activeType}...`} className="rounded-xl border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-500 font-bold">Descripción</Label>
                            <Input placeholder="Notas adicionales..." className="rounded-xl border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-500 font-bold">Monto</Label>
                            <Input type="number" placeholder="0" className="rounded-xl border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-500 font-bold">Categoría</Label>
                            <div className="flex gap-2">
                                <Select>
                                    <SelectTrigger className="rounded-xl border-slate-200">
                                        <SelectValue placeholder="<-- Seleccione -->" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="sueldo">Sueldo</SelectItem>
                                        <SelectItem value="premios">Premios</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" className="shrink-0 rounded-xl text-slate-400">+</Button>
                                <Button variant="outline" size="icon" className="shrink-0 rounded-xl text-rose-400 border-rose-200">-</Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <Button className={cn("rounded-xl px-10 h-10 text-white font-bold", themeColors[activeType].button)}>
                            Guardar
                        </Button>
                        <Button variant="secondary" className="rounded-xl px-10 h-10 bg-slate-400 hover:bg-slate-500 text-white font-bold">
                            Cancelar
                        </Button>
                        <Button variant="secondary" className="rounded-xl px-10 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            Volver
                        </Button>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-4 pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="font-black text-slate-800 dark:text-white text-lg">Listado de {activeType}s</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 font-bold">Mostrar</span>
                                <Select defaultValue="10">
                                    <SelectTrigger className="w-16 h-8 text-xs font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-xs text-slate-400 font-bold">filas</span>

                                <div className="relative ml-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 h-10 rounded-full w-64 border-slate-200 dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Fecha</TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Nombre</TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Descripción</TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Monto</TableHead>
                                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">Categoría</TableHead>
                                        <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">
                                                No se encontraron registros en este periodo
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRecords.map((r) => (
                                            <TableRow key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <TableCell className="text-slate-600 dark:text-slate-300 font-medium">{new Date(r.date || r.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-slate-900 dark:text-white font-bold">{r.title}</TableCell>
                                                <TableCell className="text-slate-500 dark:text-slate-400">{r.description}</TableCell>
                                                <TableCell className="font-bold text-slate-900 dark:text-white">{formatCurrency(r.amount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="rounded-lg text-[10px] uppercase tracking-wider font-black">
                                                        {r.category?.name || 'Varios'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============ MAIN ADMIN COMPONENT ============

export default function AdminIngenio() {
    const [activeTab, setActiveTab] = useState('budget');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    // If a course is selected, show detail view (Academy edit mode)
    // We'll import CourseDetailView logic here or define it locally
    // For brevity in this large component, I'll refer back or use the Courses.tsx component structure if needed

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                        Ingenio <span className="text-blue-600">Millonario</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Gestión Integral de Finanzas y Academia
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    {selectedCourseId && (
                        <Button variant="ghost" onClick={() => setSelectedCourseId(null)} className="h-10 rounded-xl">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Lista
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl h-14 shadow-sm w-full sm:w-auto">
                    <TabsTrigger value="budget" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">
                        <Landmark className="w-4 h-4 mr-2" /> Presupuesto
                    </TabsTrigger>
                    <TabsTrigger value="academy" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">
                        <BookOpen className="w-4 h-4 mr-2" /> Academia Online
                    </TabsTrigger>
                    <TabsTrigger value="e1" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">
                        <Sparkles className="w-4 h-4 mr-2" /> Presentación E1
                    </TabsTrigger>
                    <TabsTrigger value="e2" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-bold">
                        <Sparkles className="w-4 h-4 mr-2" /> Presentación E2
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TabsContent value="budget">
                            <BudgetView />
                        </TabsContent>

                        <TabsContent value="academy">
                            {selectedCourseId ? (
                                <CourseDetailView
                                    courseId={selectedCourseId}
                                    onBack={() => setSelectedCourseId(null)}
                                />
                            ) : (
                                <AcademyListView onSelectCourse={(c) => setSelectedCourseId(c.id)} />
                            )}
                        </TabsContent>

                        <TabsContent value="e1">
                            {selectedCourseId ? (
                                <CourseDetailView
                                    courseId={selectedCourseId}
                                    onBack={() => setSelectedCourseId(null)}
                                />
                            ) : (
                                <AcademyListView
                                    onSelectCourse={(c) => setSelectedCourseId(c.id)}
                                    filter="E1"
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="e2">
                            {selectedCourseId ? (
                                <CourseDetailView
                                    courseId={selectedCourseId}
                                    onBack={() => setSelectedCourseId(null)}
                                />
                            ) : (
                                <AcademyListView
                                    onSelectCourse={(c) => setSelectedCourseId(c.id)}
                                    filter="E2"
                                />
                            )}
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
