import { motion } from 'framer-motion';
import { Download, FileText, BarChart3, PieChart, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const reportTypes = [
  {
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de ventas por período, tienda y producto',
    icon: TrendingUp,
    color: 'bg-green-500',
    formats: ['Excel', 'PDF'],
    lastGenerated: '2024-03-01',
  },
  {
    title: 'Reporte de Usuarios',
    description: 'Estadísticas de registro, actividad y retención de usuarios',
    icon: Users,
    color: 'bg-blue-500',
    formats: ['Excel', 'PDF'],
    lastGenerated: '2024-02-28',
  },
  {
    title: 'Reporte de Productos',
    description: 'Rendimiento de productos, stock y categorías más vendidas',
    icon: ShoppingCart,
    color: 'bg-purple-500',
    formats: ['Excel', 'PDF'],
    lastGenerated: '2024-02-25',
  },
  {
    title: 'Reporte Financiero',
    description: 'Ingresos, egresos, comisiones y balance general',
    icon: DollarSign,
    color: 'bg-orange-500',
    formats: ['Excel', 'PDF'],
    lastGenerated: '2024-03-01',
  },
  {
    title: 'Reporte de Créditos',
    description: 'Estado de créditos, pagos y morosidad',
    icon: BarChart3,
    color: 'bg-cyan-500',
    formats: ['Excel', 'PDF'],
    lastGenerated: '2024-02-20',
  },
];

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Genera y descarga reportes del sistema</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Reportes Generados</p>
            <p className="text-2xl font-bold text-gray-900">156</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Este Mes</p>
            <p className="text-2xl font-bold text-gray-900">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Descargas</p>
            <p className="text-2xl font-bold text-gray-900">89</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Programados</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${report.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <report.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>

                    <div className="flex gap-2 mt-3">
                      {report.formats.map((format) => (
                        <Badge key={format} variant="secondary" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Última generación: {report.lastGenerated}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Generar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
