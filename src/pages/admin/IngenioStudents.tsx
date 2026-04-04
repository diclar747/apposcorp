import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, Users, Mail, Phone, Trash2, Edit,
  CheckCircle, XCircle, GraduationCap, DollarSign, Filter,
  ChevronRight, BookOpen, UserPlus, Download, MoreHorizontal,
  Clock, CreditCard, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ingenioApi } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentId?: string;
  company?: string;
  notes?: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'scholarship';
  paymentAmount?: number;
  totalAmount?: number;
  installmentsPaid?: number;
  totalInstallments?: number;
  enrolledAt: string;
  expiresAt?: string;
  isActive: boolean;
  assignments: {
    id: string;
    stageId: string;
    stage: { code: string; name: string };
    isCompleted: boolean;
  }[];
}

interface Stage {
  id: string;
  code: string;
  name: string;
}

const paymentStatusConfig = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: DollarSign },
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  scholarship: { label: 'Beca', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: GraduationCap },
};

export default function IngenioStudents() {
  const { stageCode } = useParams<{ stageCode: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Dialog states
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Form states
  const [studentForm, setStudentForm] = useState<Partial<Student>>({
    paymentStatus: 'pending',
    isActive: true
  });
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, stagesData] = await Promise.all([
        ingenioApi.getStudents(),
        ingenioApi.getStages()
      ]);
      setStudents(studentsData);
      setStages(stagesData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email) {
      toast.error('Nombre, apellido y email son obligatorios');
      return;
    }
    
    try {
      if (editingStudent) {
        await ingenioApi.updateStudent(editingStudent, studentForm);
        toast.success('Alumno actualizado');
      } else {
        const newStudent = await ingenioApi.createStudent({
          ...studentForm,
          stageIds: selectedStages
        });
        toast.success('Alumno registrado');
      }
      setIsStudentDialogOpen(false);
      resetForms();
      loadData();
    } catch (error) {
      toast.error('Error al guardar alumno');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('¿Eliminar este alumno? Esta acción no se puede deshacer.')) return;
    try {
      await ingenioApi.deleteStudent(id);
      toast.success('Alumno eliminado');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleAssignStages = async () => {
    if (!selectedStudent || selectedStages.length === 0) return;
    
    try {
      await ingenioApi.assignStages(selectedStudent.id, selectedStages);
      toast.success('Etapas asignadas correctamente');
      setIsAssignDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Error al asignar etapas');
    }
  };

  const handleRemoveAssignment = async (stageId: string) => {
    if (!selectedStudent) return;
    try {
      await ingenioApi.removeAssignment(selectedStudent.id, stageId);
      toast.success('Asignación removida');
      loadData();
    } catch (error) {
      toast.error('Error al remover asignación');
    }
  };

  const resetForms = () => {
    setStudentForm({ paymentStatus: 'pending', isActive: true });
    setEditingStudent(null);
    setSelectedStages([]);
    setSelectedStudent(null);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student.id);
    setStudentForm(student);
    setIsStudentDialogOpen(true);
  };

  const openAssignDialog = (student: Student) => {
    setSelectedStudent(student);
    setSelectedStages(student.assignments.map(a => a.stageId));
    setIsAssignDialogOpen(true);
  };

  const openProgressDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsProgressDialogOpen(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.documentId?.includes(searchTerm);
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && student.isActive;
    if (activeTab === 'inactive') return matchesSearch && !student.isActive;
    if (activeTab === 'pending') return matchesSearch && student.paymentStatus === 'pending';
    if (activeTab === stageCode?.toLowerCase()) {
      return matchesSearch && student.assignments.some(a => a.stage.code === stageCode);
    }
    return matchesSearch;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.isActive).length,
    pending: students.filter(s => s.paymentStatus === 'pending').length,
    e1: students.filter(s => s.assignments.some(a => a.stage.code === 'E1')).length,
    e2: students.filter(s => s.assignments.some(a => a.stage.code === 'E2')).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/ingenio')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Gestión de Alumnos
              </h1>
              <p className="text-xs text-slate-500">Ingenio Millonario</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {}}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsStudentDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Alumno
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Alumnos', value: stats.total, icon: Users, color: 'blue' },
            { label: 'Activos', value: stats.active, icon: CheckCircle, color: 'emerald' },
            { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'amber' },
            { label: 'En E1', value: stats.e1, icon: BookOpen, color: 'violet' },
            { label: 'En E2', value: stats.e2, icon: BookOpen, color: 'purple' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700",
                "hover:shadow-lg transition-all cursor-pointer"
              )}
              onClick={() => {
                if (stat.label === 'En E1') setActiveTab('e1');
                else if (stat.label === 'En E2') setActiveTab('e2');
                else if (stat.label === 'Activos') setActiveTab('active');
                else if (stat.label === 'Pendientes') setActiveTab('pending');
                else setActiveTab('all');
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", `text-${stat.color}-500`)} />
                <span className="text-2xl font-black">{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="e1">E1</TabsTrigger>
              <TabsTrigger value="e2">E2</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Listado de Alumnos
              <Badge variant="secondary" className="ml-2">
                {filteredStudents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Alumno</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contacto</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Etapas</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Pago</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="py-3 px-4">
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No se encontraron alumnos</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const StatusIcon = paymentStatusConfig[student.paymentStatus].icon;
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{student.firstName} {student.lastName}</p>
                                {student.company && (
                                  <p className="text-xs text-slate-500">{student.company}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-slate-600">
                                <Mail className="w-3 h-3" />
                                {student.email}
                              </div>
                              {student.phone && (
                                <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                                  <Phone className="w-3 h-3" />
                                  {student.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1 flex-wrap">
                              {student.assignments.map((assignment) => (
                                <Badge
                                  key={assignment.id}
                                  variant={assignment.isCompleted ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {assignment.stage.code}
                                </Badge>
                              ))}
                              {student.assignments.length === 0 && (
                                <span className="text-xs text-slate-400 italic">Sin etapas</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  paymentStatusConfig[student.paymentStatus].color
                                )}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {paymentStatusConfig[student.paymentStatus].label}
                              </Badge>
                              {student.totalAmount && (
                                <p className="text-xs text-slate-500">
                                  {formatCurrency(student.paymentAmount || 0)} / {formatCurrency(student.totalAmount)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={student.isActive ? 'default' : 'secondary'}
                              className={student.isActive ? 'bg-emerald-100 text-emerald-700' : ''}
                            >
                              {student.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openAssignDialog(student)}>
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  Asignar Etapas
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openProgressDialog(student)}>
                                  <GraduationCap className="w-4 h-4 mr-2" />
                                  Ver Progreso
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(student)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteStudent(student.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Student Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={studentForm.firstName || ''}
                onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                placeholder="Ej: Juan"
              />
            </div>
            <div>
              <Label>Apellido *</Label>
              <Input
                value={studentForm.lastName || ''}
                onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                placeholder="Ej: Pérez"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={studentForm.email || ''}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={studentForm.phone || ''}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                placeholder="+595 981 123 456"
              />
            </div>
            <div>
              <Label>Cédula</Label>
              <Input
                value={studentForm.documentId || ''}
                onChange={(e) => setStudentForm({ ...studentForm, documentId: e.target.value })}
                placeholder="1.234.567"
              />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input
                value={studentForm.company || ''}
                onChange={(e) => setStudentForm({ ...studentForm, company: e.target.value })}
                placeholder="Nombre de la empresa (opcional)"
              />
            </div>
            <div>
              <Label>Estado de Pago</Label>
              <Select
                value={studentForm.paymentStatus}
                onValueChange={(value: any) => setStudentForm({ ...studentForm, paymentStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="scholarship">Beca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto Pagado</Label>
              <Input
                type="number"
                value={studentForm.paymentAmount || ''}
                onChange={(e) => setStudentForm({ ...studentForm, paymentAmount: parseFloat(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Monto Total</Label>
              <Input
                type="number"
                value={studentForm.totalAmount || ''}
                onChange={(e) => setStudentForm({ ...studentForm, totalAmount: parseFloat(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Cuotas Pagadas</Label>
              <Input
                type="number"
                value={studentForm.installmentsPaid || ''}
                onChange={(e) => setStudentForm({ ...studentForm, installmentsPaid: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Total Cuotas</Label>
              <Input
                type="number"
                value={studentForm.totalInstallments || ''}
                onChange={(e) => setStudentForm({ ...studentForm, totalInstallments: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>
            {!editingStudent && (
              <div className="md:col-span-2">
                <Label>Asignar Etapas</Label>
                <div className="flex gap-2 mt-2">
                  {stages.map((stage) => (
                    <label
                      key={stage.id}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all",
                        selectedStages.includes(stage.id)
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedStages.includes(stage.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStages([...selectedStages, stage.id]);
                          } else {
                            setSelectedStages(selectedStages.filter(id => id !== stage.id));
                          }
                        }}
                      />
                      <span className="font-semibold">{stage.code}</span>
                      <span className="text-sm text-slate-500">{stage.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea
                value={studentForm.notes || ''}
                onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                placeholder="Notas adicionales sobre el alumno..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsStudentDialogOpen(false);
              resetForms();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStudent}>
              {editingStudent ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Stages Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Etapas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedStudent && (
              <p className="text-sm text-slate-500 mb-4">
                Alumno: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
              </p>
            )}
            <div className="space-y-2">
              {stages.map((stage) => {
                const isAssigned = selectedStages.includes(stage.id);
                const isCompleted = selectedStudent?.assignments.find(a => a.stageId === stage.id)?.isCompleted;
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                      isAssigned
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                    onClick={() => {
                      if (isAssigned) {
                        setSelectedStages(selectedStages.filter(id => id !== stage.id));
                      } else {
                        setSelectedStages([...selectedStages, stage.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white",
                        isAssigned ? "bg-blue-500" : "bg-slate-400"
                      )}>
                        {stage.code}
                      </div>
                      <div>
                        <p className="font-semibold">{stage.name}</p>
                        <p className="text-xs text-slate-500">{stage.description}</p>
                      </div>
                    </div>
                    {isAssigned && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                    {isCompleted && (
                      <Badge className="bg-emerald-100 text-emerald-700">Completado</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignStages}>
              Guardar Asignaciones
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Progreso del Alumno</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
                  Etapas Asignadas
                </h4>
                {selectedStudent.assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white",
                          assignment.isCompleted ? "bg-emerald-500" : "bg-blue-500"
                        )}>
                          {assignment.stage.code}
                        </div>
                        <div>
                          <p className="font-semibold">{assignment.stage.name}</p>
                          <p className="text-sm text-slate-500">
                            Asignado: {new Date(assignment.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={assignment.isCompleted ? 'default' : 'secondary'}
                        className={assignment.isCompleted ? 'bg-emerald-100 text-emerald-700' : ''}
                      >
                        {assignment.isCompleted ? 'Completado' : 'En progreso'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                {selectedStudent.assignments.length === 0 && (
                  <p className="text-center text-slate-500 py-4">
                    No hay etapas asignadas
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
