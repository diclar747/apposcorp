import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play, Search, GraduationCap } from "lucide-react";
import { coursesApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function IngenioAcademy() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c: any) => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-indigo-600" /> Academia Oscorp Premium
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Accede a todos los materiales de formación continua, eventos tipo E1 y E2, y domina tu coeficiente financiero.
        </p>
      </div>

      <div className="relative max-w-xl mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          placeholder="Buscar cursos, temas o lecciones..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando módulos de estudio...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-lg">Aún no hay cursos asignados o no se encontraron resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => (
            <Card key={course.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer border-none rounded-3xl bg-white dark:bg-slate-900" onClick={() => navigate(`/ingenio/cursos/${course.id}`)}>
              <div className="h-44 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                {course.coverImage ? (
                  <img src={course.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <BookOpen className="w-12 h-12 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <Badge className="mb-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-3 py-1 text-xs">
                  {course.category || "Programa E1"}
                </Badge>
                <h3 className="font-bold text-xl mb-2 text-slate-900 dark:text-white line-clamp-1">{course.title}</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 mb-5 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-medium text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" /> {course.modules?.length || 0} módulos
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
