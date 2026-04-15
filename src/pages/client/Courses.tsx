import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  Star, 
  Clock, 
  Play, 
  CheckCircle, 
  Lock, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { coursesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const categories = ['Todos', 'Estrategia', 'Finanzas', 'Ventas', 'Marketing', 'Liderazgo'];

export default function ClientCourses() {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = hasRole(['ingenio', 'superadmin']);

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess]);

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
    return matchesSearch && matchesCategory;
  });

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 animate-in fade-in duration-700">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_-12px_rgba(251,191,36,0.4)] border border-amber-300/30">
            <Lock className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <div className="max-w-md space-y-3">
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            Acceso Restringido
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Únete a <span className="text-amber-500">Ingenio Millonario</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Desbloquea el acceso ilimitado a todos nuestros cursos, sesiones estratégicas y la red de emprendedores más exclusiva.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {[
            { icon: Play, label: 'Todo Incluido' },
            { icon: Users, label: 'Comunidad' },
            { icon: TrendingUp, label: 'Mentoría' },
            { icon: Award, label: 'Certificados' }
          ].map((feature, i) => (
            <motion.div 
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-center gap-2 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
            >
              <feature.icon className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-tight text-gray-700 dark:text-gray-300">{feature.label}</span>
            </motion.div>
          ))}
        </div>

        <Button 
          size="lg"
          onClick={() => navigate('/app/ingenio')}
          className="w-full max-w-xs h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 group transition-all"
        >
          Activar mi Membresía
          <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
        </Button>

        <button 
          onClick={() => navigate('/app')}
          className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="px-5 pt-6 space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <Badge className="bg-amber-500 text-white border-none text-[8px] font-black uppercase tracking-widest h-5 px-3">
              Membresía Activa
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Academia</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 italic">Tu camino al éxito</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 rotate-3">
            <BookOpen className="w-6 h-6 text-amber-500 -rotate-3" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-amber-500 transition-colors" />
          <Input
            placeholder="¿Qué quieres aprender hoy?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 rounded-2xl bg-gray-100/50 dark:bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-amber-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border",
                selectedCategory === category 
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white shadow-lg"
                  : "bg-white text-muted-foreground border-gray-100 dark:bg-white/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="px-5 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Cargando Academia...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto opacity-50">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-black uppercase tracking-widest text-sm">No hay resultados</p>
              <p className="text-xs text-muted-foreground font-medium">Prueba con otra búsqueda o categoría</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-5">
            <AnimatePresence>
              {filteredCourses.map((course: any, index: number) => {
                const enrollment = myEnrollmentMap.get(course.id);
                const isStarted = !!enrollment;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/app/cursos/${course.id}`}>
                      <div className="group relative bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1">
                        <div className="p-4 flex gap-5 items-center">
                          {/* Image Container */}
                          <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden rounded-[2rem] shadow-xl group-hover:scale-105 transition-transform duration-700">
                            {course.coverImage ? (
                              <img 
                                src={course.coverImage} 
                                alt={course.title} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                                <BookOpen className="w-10 h-10 text-white/40" />
                              </div>
                            )}
                            {isStarted && enrollment?.progress === 100 && (
                              <div className="absolute inset-0 bg-emerald-500/60 backdrop-blur-sm flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[8px] font-black uppercase px-2 h-4">
                                  Incluido
                                </Badge>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{course.category}</span>
                              </div>
                              <h3 className="font-black text-lg leading-tight tracking-tight text-gray-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                                {course.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                <Play className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  {course.modules?.length || 0} módulos
                                </span>
                              </div>
                              {course.rating > 0 && (
                                <div className="flex items-center gap-1.5 text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{course.rating}</span>
                                </div>
                              )}
                            </div>

                            {isStarted && (
                              <div className="pt-1">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                  <span className="text-muted-foreground/60">Progreso</span>
                                  <span className="text-amber-500">{Math.round(enrollment?.progress || 0)}%</span>
                                </div>
                                <Progress value={enrollment?.progress || 0} className="h-1.5 bg-amber-500/10" indicatorClassName="bg-amber-500" />
                              </div>
                            )}
                          </div>

                          {/* Action Arrow */}
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center transition-all group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 active:scale-95 flex-shrink-0">
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
