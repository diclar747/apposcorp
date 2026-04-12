import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Play, Search, Lock, CheckCircle, Sparkles, Clock, ShieldCheck, HelpCircle 
} from "lucide-react";
import { coursesApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { useIngenioSubscription } from "@/hooks/useIngenioSubscription";
import { usePaywallStore } from "@/stores";
import Wheel from "@/components/ingenio/Wheel";
import type { WheelSegment } from "@/components/ingenio/Wheel";
import { cn } from "@/lib/utils";
import { AccessDenied } from "@/components/ingenio/AccessDenied";

export default function IngenioAcademy() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, isActive, isReadOnly } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();

  const [courses, setCourses] = useState<any[]>([]);
  const [myCoursesIds, setMyCoursesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  if (status !== 'ACTIVE') {
    return <AccessDenied status={status} />;
  }

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allCourses, myEnrollments] = await Promise.all([
        coursesApi.getAll(),
        coursesApi.getMyCourses()
      ]);
      
      setCourses(allCourses.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
      setMyCoursesIds(myEnrollments.map((e: any) => e.courseId));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la academia");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!isActive) {
      openPaywall();
      return;
    }
    
    try {
      await coursesApi.enroll(courseId);
      toast.success("¡Inscripción exitosa! Ya puedes comenzar este curso.");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo realizar la inscripción.");
    }
  };

  const CourseCard = ({ course }: { course: any }) => {
    const isEnrolled = myCoursesIds.includes(course.id);
    const canAccess = isActive || isEnrolled;
    
    return (
      <Card 
        onClick={() => {
          if (isEnrolled || isActive) {
            navigate(`/ingenio/cursos/${course.id}`);
          } else {
            openPaywall();
          }
        }}
        className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer"
      >
        <div className="h-44 relative overflow-hidden">
          {course.coverImage ? (
            <img src={course.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
              <BookOpen className="w-16 h-16 text-white/30" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 z-10">
            {isEnrolled ? (
              <Badge className="bg-emerald-500 text-white border-none px-3 py-1 font-bold shadow-lg">
                <CheckCircle className="w-3 h-3 mr-1" /> Iniciado
              </Badge>
            ) : !isActive ? (
              <Badge className="bg-slate-900/80 text-white backdrop-blur-md border-none px-3 py-1 font-bold shadow-lg">
                <Lock className="w-3 h-3 mr-1" /> Premium
              </Badge>
            ) : null}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">
              {course.category}
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
              <Play className="w-3 h-3" /> {course.modulesCount || course.modules?.length || 0} módulos
            </span>
          </div>
          
          <h3 className="font-black text-lg mb-4 text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {course.title}
          </h3>

          <Button 
              onClick={(e) => {
                e.stopPropagation();
                if (isEnrolled || isActive) {
                  navigate(`/ingenio/cursos/${course.id}`);
                } else {
                  openPaywall();
                }
              }}
              className={cn(
                "w-full rounded-2xl h-12 font-black text-sm shadow-lg transition-all",
                (isEnrolled || isActive) 
                  ? "bg-slate-900 hover:bg-black text-white" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {(isEnrolled || isActive) ? 'Comenzar Ahora' : 'Desbloquear con Acceso Full'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const filteredCourses = courses.filter((c: any) => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const wheelSegments: WheelSegment[] = courses.slice(0, 12).map((c, i) => ({
    number: i + 1,
    color: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'][i % 12],
    title: c.title,
  }));

  const handleWheelSelect = (segment: WheelSegment) => {
    toast.success(`Destino sugerido: ${segment.title}`, {
      description: "Es un excelente momento para avanzar con este módulo.",
      icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
    });
  };


  return (
    <div className="space-y-8 pb-10">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full -mr-40 -mt-40" />
        <div className="relative z-10">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-none mb-4 font-black px-4 h-8 rounded-full">
            <Sparkles className="w-4 h-4 mr-2" /> Programas de Éxito
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
            Academia <span className="text-indigo-400">Premium</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
            Formación avanzada diseñada para tu crecimiento exponencial. Aprende a dominar las finanzas, inversiones y el sistema de negocios.
          </p>
        </div>
      </div>


      {wheelSegments.length > 0 && (
         <div className="flex flex-col lg:flex-row items-center gap-10 bg-slate-900 dark:bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px]" />
            <div className="flex-1 relative z-10 text-center lg:text-left">
               <Badge className="bg-amber-400 text-amber-950 border-none mb-4 font-black">¿INDECISO?</Badge>
               <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Gira la <span className="text-indigo-400">Rueda del Éxito</span></h2>
               <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto lg:mx-0">Deja que el destino sugiera tu próxima gran lección para acelerar tu libertad financiera.</p>
               <div className="flex gap-4">
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/10 text-center flex-1">
                     <p className="text-2xl font-black text-indigo-400">100%</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Contenido Premium</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/10 text-center flex-1">
                     <p className="text-2xl font-black text-emerald-400">{courses.length}</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Cursos Totales</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 flex justify-center scale-90 md:scale-100">
               <Wheel segments={wheelSegments} onSegmentSelected={handleWheelSelect} size={300} />
            </div>
         </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="¿Qué quieres aprender hoy?..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg rounded-2xl bg-white dark:bg-slate-950 border-slate-200 shadow-xl shadow-slate-200/50"
          />
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-black text-xs uppercase tracking-widest">
          <BookOpen className="w-5 h-5" />
          {courses.length} cursos disponibles
        </div>
      </div>

      <Tabs defaultValue="IM E1" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl h-auto mb-10 overflow-x-auto whitespace-nowrap">
          {['IM E1', 'IM E2'].map(cat => (
            <TabsTrigger key={cat} value={cat} className="rounded-xl px-8 py-3 font-black text-sm leading-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {['IM E1', 'IM E2'].map(cat => (
          <TabsContent key={cat} value={cat}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-[2rem] bg-slate-100 animate-pulse" />)}
              </div>
            ) : filteredCourses.filter(c => c.category === cat).length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest">Próximamente más contenido</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.filter(c => c.category === cat).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
