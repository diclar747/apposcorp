import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, ShoppingCart, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { ordersApi, productsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Helper: download CSV from array of objects
function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    ),
  ];
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SellerReports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, productsData] = await Promise.all([
          ordersApi.getAll('seller'),
          productsApi.getAll(),
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalEarnings = orders.reduce((sum: number, o: any) => sum + (o.sellerEarnings || 0), 0);

  const generateSalesCSV = () => {
    const data = orders.map((o: any) => ({
      'Nro. Orden': o.orderNumber,
      'Fecha': formatDate(o.createdAt),
      'Cliente': `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`,
      'Productos': o.items?.length || 0,
      'Subtotal': o.subtotal,
      'Comisión': o.commissionAmount,
      'Ganancia': o.sellerEarnings,
      'Total': o.total,
      'Estado': o.status,
      'Método de Pago': o.paymentMethod,
    }));
    downloadCSV(data, `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateProductsCSV = () => {
    const data = products.map((p: any) => ({
      'SKU': p.sku,
      'Nombre': p.name,
      'Categoría': p.category,
      'Precio': p.price,
      'Costo': p.cost || 0,
      'Ganancia %': p.profitPercentage || 0,
      'Stock': p.stock,
      'Estado': p.status,
      'Tipo': p.type,
      'Visibilidad': p.visibility,
    }));
    downloadCSV(data, `reporte-productos-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateFinancialCSV = () => {
    const totalCommission = orders.reduce((sum: number, o: any) => sum + (o.commissionAmount || 0), 0);
    const summary = [
      { 'Concepto': 'Ventas Totales', 'Monto': totalSales },
      { 'Concepto': 'Comisiones Pagadas', 'Monto': totalCommission },
      { 'Concepto': 'Ganancias Netas', 'Monto': totalEarnings },
      { 'Concepto': 'Total Pedidos', 'Monto': orders.length },
      { 'Concepto': 'Ticket Promedio', 'Monto': orders.length > 0 ? Math.round(totalSales / orders.length) : 0 },
    ];
    downloadCSV(summary, `reporte-financiero-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateOrdersCSV = () => {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
      ready: 'Listo', in_transit: 'En camino', delivered: 'Entregado',
      cancelled: 'Cancelado', refunded: 'Reembolsado',
    };
    const data = orders.map((o: any) => ({
      'Nro. Orden': o.orderNumber,
      'Fecha': formatDate(o.createdAt),
      'Cliente': `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`,
      'Estado': statusMap[o.status] || o.status,
      'Tipo Entrega': o.deliveryType === 'delivery' ? 'Delivery' : 'Retiro en tienda',
      'Método Pago': o.paymentMethod,
      'Total': o.total,
    }));
    downloadCSV(data, `reporte-pedidos-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateSalesPDF = () => {
    const rows = orders.map((o: any) => `
      <tr>
        <td>${o.orderNumber || ''}</td>
        <td>${formatDate(o.createdAt)}</td>
        <td>${(o.buyer?.firstName || '') + ' ' + (o.buyer?.lastName || '')}</td>
        <td style="text-align:right">${formatCurrency(o.total)}</td>
        <td style="text-align:right">${formatCurrency(o.sellerEarnings || 0)}</td>
        <td>${o.status || ''}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Reporte de Ventas</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;color:#333}
        h1{font-size:22px;margin-bottom:4px}
        .date{color:#666;font-size:12px;margin-bottom:20px}
        .stats{display:flex;gap:24px;margin-bottom:20px}
        .stat{background:#f5f5f5;padding:12px 16px;border-radius:8px}
        .stat-label{font-size:11px;color:#666}
        .stat-value{font-size:18px;font-weight:bold}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{background:#f0f0f0;padding:8px;text-align:left;border-bottom:2px solid #ddd}
        td{padding:6px 8px;border-bottom:1px solid #eee}
        @media print{body{padding:0}.no-print{display:none}}
      </style></head><body>
      <h1>Reporte de Ventas - Oscorp</h1>
      <p class="date">Generado: ${new Date().toLocaleDateString('es-PY')}</p>
      <div class="stats">
        <div class="stat"><div class="stat-label">Total Ventas</div><div class="stat-value">${formatCurrency(totalSales)}</div></div>
        <div class="stat"><div class="stat-label">Ganancias</div><div class="stat-value">${formatCurrency(totalEarnings)}</div></div>
        <div class="stat"><div class="stat-label">Pedidos</div><div class="stat-value">${orders.length}</div></div>
      </div>
      <table><thead><tr><th>Orden</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Ganancia</th><th>Estado</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=function(){window.print()}<\/script>
    </body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleGenerateReport = async (type: string, format: string) => {
    const key = `${type}-${format}`;
    setGeneratingReport(key);

    try {
      if (format === 'CSV') {
        if (type === 'sales') generateSalesCSV();
        else if (type === 'products') generateProductsCSV();
        else if (type === 'financial') generateFinancialCSV();
        else if (type === 'orders') generateOrdersCSV();
      } else {
        await generateSalesPDF();
      }
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      toast.error('Error al generar reporte');
      console.error(error);
    } finally {
      setGeneratingReport(null);
    }
  };

  const reportTypes = [
    {
      key: 'sales',
      title: 'Reporte de Ventas',
      description: `${orders.length} ventas registradas - Total: ${formatCurrency(totalSales)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      formats: ['CSV', 'PDF'],
    },
    {
      key: 'products',
      title: 'Reporte de Productos',
      description: `${products.length} productos registrados`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      formats: ['CSV'],
    },
    {
      key: 'financial',
      title: 'Reporte Financiero',
      description: `Ganancias: ${formatCurrency(totalEarnings)}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      formats: ['CSV'],
    },
    {
      key: 'orders',
      title: 'Reporte de Pedidos',
      description: `${orders.filter((o: any) => o.status === 'delivered').length} entregados de ${orders.length} total`,
      icon: Calendar,
      color: 'bg-orange-500',
      formats: ['CSV'],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

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
            <p className="text-sm text-gray-500">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Ganancias</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pedidos</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Productos</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.key}
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
                      {report.formats.map((format) => (
                        <Button
                          key={format}
                          size="sm"
                          variant={format === 'PDF' ? 'outline' : 'default'}
                          onClick={() => handleGenerateReport(report.key, format)}
                          disabled={generatingReport === `${report.key}-${format}`}
                        >
                          {generatingReport === `${report.key}-${format}` ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          {format}
                        </Button>
                      ))}
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
