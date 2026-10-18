import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Clock, Loader2, PlayCircle, Users } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import { trackReferral } from '@/lib/affiliate';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PublicCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverImage: string | null;
  instructorName: string;
  category: string;
  price: number;
  comparePrice: number | null;
  duration: number;
  enrolledCount: number;
  modules: { id: string; title: string; lessons: { id: string; title: string; duration: number }[] }[];
}

/** Página pública de un curso: es la que reciben los clientes desde el enlace de un afiliado o tutor (?ref=CODIGO). */
export default function CoursePublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    coursesApi.getPublic(slug)
      .then((c: PublicCourse) => { if (!cancelled) setCourse(c); })
      .catch(() => { if (!cancelled) setCourse(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    // Visita desde un enlace de afiliado o tutor (?ref=CODIGO)
    trackReferral({ courseSlug: slug }, location.search);
    return () => { cancelled = true; };
  }, [slug, location.search]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;
  if (!course) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <p className="font-semibold">No encontramos este curso.</p>
        <Button asChild><Link to="/">Volver al inicio</Link></Button>
      </div>
    );
  }

  // Si no hay sesión, la ruta protegida lleva al login y vuelve al curso al terminar
  const goToCourse = () => navigate(`/app/cursos/${course.id}`);
  const lessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {course.coverImage && <img src={course.coverImage} alt="" className="w-full aspect-video object-cover rounded-xl" />}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{course.category}</p>
        <h1 className="text-2xl font-black leading-tight">{course.title}</h1>
        <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lessons} lecciones</span>
          {course.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration} min</span>}
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.enrolledCount} alumnos</span>
          <span>Instructor: {course.instructorName}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            {course.comparePrice && course.comparePrice > course.price && (
              <p className="text-xs text-muted-foreground line-through">{formatCurrency(course.comparePrice)}</p>
            )}
            <p className="text-2xl font-black tabular-nums">{course.price > 0 ? formatCurrency(course.price) : 'Gratis'}</p>
          </div>
          <Button size="lg" onClick={goToCourse}>Quiero este curso</Button>
        </CardContent>
      </Card>

      <p className="text-sm whitespace-pre-line">{course.description}</p>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Contenido</p>
        {course.modules.map((m) => (
          <div key={m.id} className="rounded-lg border border-border p-3">
            <p className="font-semibold text-sm">{m.title}</p>
            <ul className="mt-1 space-y-0.5">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PlayCircle className="w-3.5 h-3.5 shrink-0" />{l.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Button size="lg" className="w-full" onClick={goToCourse}>Quiero este curso</Button>
    </div>
  );
}
