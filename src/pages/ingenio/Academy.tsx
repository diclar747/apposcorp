import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play, Search, GraduationCap, Lock, CheckCircle, Wallet, Sparkles } from "lucide-react";
import { coursesApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletStore, useAuthStore } from "@/stores";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import Wheel from "@/components/ingenio/Wheel";
import type { WheelSegment } from "@/components/ingenio/Wheel";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function IngenioAcademy() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [myCoursesIds, setMyCoursesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id);
    }
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allCourses, myEnrollments] = await Promise.all([
        coursesApi.getAll(),
        coursesApi.getMyCourses()
      ]);
      
      setCourses(allCourses);
      setMyCoursesIds(myEnrollments.map((e: any) => e.courseId));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la academia");
    } finally {
      setLoading(false);
    }
  };

  const CourseCard = ({ course }: { course: any }) => {
    const hasAccess = myCoursesIds.includes(course.id);
    
    return (
      <Card 
        onClick={() => navigate(`/ingenio/cursos/${course.id}`)}
        className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none rounded-[2rem] bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 cursor-pointer"
      >
        <div className="h-48 relative overflow-hidden">
          {course.coverImage ? (
            <img src={course.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
              <BookOpen className="w-16 h-16 text-white/30" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 z-10">
            {hasAccess ? (
              <Badge className="bg-emerald-500/90 text-white backdrop-blur-md border-none px-3 py-1 flex items-center gap-1 shadow-lg">
                <CheckCircle className="w-3 h-3" /> Adquirido
              </Badge>
            ) : (
              <Badge className="bg-slate-900/60 text-white backdrop-blur-md border-none px-3 py-1 flex items-center gap-1 shadow-lg">
                <Lock className="w-3 h-3" /> Bloqueado
              </Badge>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
             <p className="text-white text-sm font-medium line-clamp-2">{course.shortDescription || course.description}</p>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400">
              {course.level || "Multinivel"}
            </Badge>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Play className="w-3 h-3" /> {course.modulesCount || course.modules?.length || 0} módulos
            </span>
          </div>
          
          <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center justify-between gap-4 mt-6">
            <Button 
                variant="outline"
                className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-900 hover:text-white rounded-2xl h-11 transition-all duration-300"
              >
                {hasAccess ? 'Continuar Aprendiendo' : 'Ver Detalles y Comprar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredCourses = courses.filter((c: any) => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const wheelColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#14b8a6', '#8b5cf6', '#d946ef', '#f43f5e'];
  const wheelSegments: WheelSegment[] = courses.slice(0, 10).map((c, i) => ({
    number: i + 1,
    color: wheelColors[i % wheelColors.length],
    title: c.title.replace(/^(E1|E2|IM E1|IM E2) - /i, '').trim(),
  }));

  const handleWheelSelect = (segment: WheelSegment) => {
    toast.success(`¡Excelente elección! Hoy el destino sugiere: ${segment.title}`, {
      description: "Es un gran momento para avanzar con este módulo.",
      duration: 5000,
      icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-[100px] -ml-32 -mb-32 rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-none mb-4 px-4 py-1.5 rounded-full text-sm font-semibold flex w-fit items-center gap-2">
              <Sparkles className="w-4 h-4" /> Academia Premium
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              Ingenio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Millonario</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Formación avanzada diseñada para tu crecimiento exponencial. Aprende a dominar las finanzas, inversiones y el sistema de negocios.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] min-w-[240px]">
            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Balance en Billetera</p>
            <p className="text-3xl font-black text-white">{formatCurrency(wallet?.balance || 0)}</p>
            <div className="flex items-center gap-3 mt-3">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs text-slate-300 font-medium">Billetera Activa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wheel Section */}
      {wheelSegments.length >= 2 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-950 dark:to-slate-900 rounded-[3rem] p-8 md:p-12 border border-indigo-100 dark:border-slate-800 shadow-xl overflow-hidden relative group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <HelpCircle className="w-64 h-64 rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <Badge className="bg-amber-100 text-amber-600 border-none mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                Sugerencia del Día
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                ¿No estás seguro de <br />
                <span className="text-indigo-600">por dónde empezar?</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
                Gira la ruleta y deja que el destino decida tu formación de hoy. ¡Cada paso cuenta en tu camino al éxito!
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto lg:mx-0">
                 <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Cursos</p>
                    <p className="text-xl font-black text-indigo-600">{courses.length}</p>
                 </div>
                 <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Módulos</p>
                    <p className="text-xl font-black text-amber-500">Premium</p>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex justify-center scale-75 md:scale-90 lg:scale-100 transition-transform">
              <Wheel 
                segments={wheelSegments} 
                onSegmentSelected={handleWheelSelect}
                size={window.innerWidth < 768 ? 320 : 400}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Buscar por título o descripción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-base rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-indigo-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 text-slate-500 text-sm italic">
          <BookOpen className="w-4 h-4" />
          {courses.length} cursos disponibles
        </div>
      </div>

      {/* Course Categories */}
      <Tabs defaultValue="im-e1" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl h-auto mb-8 grid grid-cols-2 max-w-sm">
          <TabsTrigger value="im-e1" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900">
            Etapa IM E1
          </TabsTrigger>
          <TabsTrigger value="im-e2" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900">
            Etapa IM E2
          </TabsTrigger>
        </TabsList>

        <TabsContent value="im-e1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
              {[1, 2, 3].map(i => <div key={i} className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : filteredCourses.filter(c => c.category === 'IM E1').length === 0 ? (
            <EmptyState message="No hay cursos disponibles en la etapa E1 todavía." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.filter(c => c.category === 'IM E1').map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="im-e2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
              {[1, 2, 3].map(i => <div key={i} className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : filteredCourses.filter(c => c.category === 'IM E2').length === 0 ? (
            <EmptyState message="No hay cursos disponibles en la etapa E2 todavía." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.filter(c => c.category === 'IM E2').map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* View all others if any */}
        {filteredCourses.filter(c => c.category !== 'IM E1' && c.category !== 'IM E2').length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Sparkles className="text-amber-500 w-6 h-6" /> Otros Programas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.filter(c => c.category !== 'IM E1' && c.category !== 'IM E2').map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
      <BookOpen className="w-10 h-10 text-slate-300" />
    </div>
    <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto">{message}</p>
  </div>
);
