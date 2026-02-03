import { motion } from 'framer-motion';
import { Download, FileText, TrendingUp, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const reportTypes = [
  {
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de tus ventas por período',
    icon: TrendingUp,
    color: 'bg-green-500',
    formats: ['Excel', 'PDF'],
  },
  {
    title: 'Reporte de Productos',
    description: 'Rendimiento de tus productos más vendidos',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    formats: ['Excel', 'PDF'],
  },
  {
    title: 'Reporte Financiero',
    description: 'Ingresos, egresos y ganancias',
    icon: DollarSign,
    color: 'bg-purple-500',
    formats: ['Excel', 'PDF'],
  },
  {
    title: 'Reporte de Pedidos',
    description: 'Estadísticas de pedidos y entregas',
    icon: Calendar,
    color: 'bg-orange-500',
    formats: ['Excel', 'PDF'],
  },
];

export default function SellerReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500">Genera reportes de tu tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Reportes Generados</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Este Mes</p>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Descargas</p>
            <p className="text-2xl font-bold text-gray-900">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Programados</p>
            <p className="text-2xl font-bold text-gray-900">1</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
