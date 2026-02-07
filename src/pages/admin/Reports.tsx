import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, TrendingUp, Users, ShoppingCart, DollarSign, BarChart3, Loader2 } from 'lucide-react';
import { ordersApi, usersApi, productsApi, creditsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) {
    toast.error('No hay datos para exportar');
    return;
  }
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

function generatePDF(title: string, statsHtml: string, tableHtml: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#333}
      h1{font-size:22px;margin-bottom:4px}
      .date{color:#666;font-size:12px;margin-bottom:20px}
      .stats{display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap}
      .stat{background:#f5f5f5;padding:12px 16px;border-radius:8px;min-width:140px}
      .stat-label{font-size:11px;color:#666}
      .stat-value{font-size:18px;font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f0f0f0;padding:8px;text-align:left;border-bottom:2px solid #ddd}
      td{padding:6px 8px;border-bottom:1px solid #eee}
      @media print{body{padding:0}.no-print{display:none}}
    </style></head><body>
    <h1>${title} - Oscorp</h1>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-PY')}</p>
    ${statsHtml}
    ${tableHtml}
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function AdminReports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, usersData, productsData, creditsData] = await Promise.all([
          ordersApi.getAllAdmin(),
          usersApi.getAll(),
          productsApi.getAll(),
          creditsApi.getAllAdmin(),
        ]);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCredits(Array.isArray(creditsData) ? creditsData : []);
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast.error('Error al cargar datos para reportes');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Computed stats
  const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalCommissions = orders.reduce((sum: number, o: any) => sum + (o.commissionAmount || 0), 0);
  const totalCreditsAmount = credits.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  const statusMap: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparaci\u00f3n',
    ready: 'Listo', in_transit: 'En camino', delivered: 'Entregado',
    cancelled: 'Cancelado', refunded: 'Reembolsado',
  };

  const creditStatusMap: Record<string, string> = {
    pending: 'Pendiente', active: 'Activo', completed: 'Completado',
    rejected: 'Rechazado', defaulted: 'En mora',
  };

  const roleMap: Record<string, string> = {
    superadmin: 'Administrador', seller: 'Vendedor', client: 'Cliente',
  };

  // --- CSV Generators ---
  const generateSalesCSV = () => {
    const data = orders.map((o: any) => ({
      'Nro. Orden': o.orderNumber,
      'Fecha': formatDate(o.createdAt),
      'Comprador': `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`.trim(),
      'Vendedor': `${o.seller?.firstName || ''} ${o.seller?.lastName || ''}`.trim(),
      'Productos': o.items?.length || 0,
      'Subtotal': o.subtotal,
      'Impuesto': o.tax,
      'Env\u00edo': o.shippingCost,
      'Comisi\u00f3n': o.commissionAmount,
      'Ganancia Vendedor': o.sellerEarnings,
      'Total': o.total,
      'Estado': statusMap[o.status] || o.status,
      'M\u00e9todo de Pago': o.paymentMethod,
      'Estado Pago': o.paymentStatus,
    }));
    downloadCSV(data, `reporte-ventas-admin-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateUsersCSV = () => {
    const data = users.map((u: any) => ({
      'Nombre': `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      'Email': u.email,
      'Tel\u00e9fono': u.phone || '',
      'Rol': roleMap[u.role] || u.role,
      'Ciudad': u.city || '',
      'Estado': u.isActive ? 'Activo' : 'Inactivo',
      'Saldo Wallet': u.wallet?.balance || 0,
      'Fecha Registro': formatDate(u.createdAt),
    }));
    downloadCSV(data, `reporte-usuarios-admin-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateProductsCSV = () => {
    const data = products.map((p: any) => ({
      'SKU': p.sku,
      'Nombre': p.name,
      'Categor\u00eda': p.category,
      'Precio': p.price,
      'Costo': p.cost || 0,
      'Ganancia %': p.profitPercentage || 0,
      'Stock': p.stock,
      'Estado': p.status,
      'Tipo': p.type,
      'Visibilidad': p.visibility,
      'Vendedor': p.seller?.user ? `${p.seller.user.firstName} ${p.seller.user.lastName}` : '',
    }));
    downloadCSV(data, `reporte-productos-admin-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateFinancialCSV = () => {
    const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
    const totalDelivered = deliveredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalCommission = orders.reduce((s: number, o: any) => s + (o.commissionAmount || 0), 0);
    const totalSellerEarnings = orders.reduce((s: number, o: any) => s + (o.sellerEarnings || 0), 0);
    const totalTax = orders.reduce((s: number, o: any) => s + (o.tax || 0), 0);
    const totalShipping = orders.reduce((s: number, o: any) => s + (o.shippingCost || 0), 0);

    const summary = [
      { 'Concepto': 'Ventas Totales (todos los estados)', 'Monto': totalSales },
      { 'Concepto': 'Ventas Entregadas', 'Monto': totalDelivered },
      { 'Concepto': 'Comisiones Plataforma', 'Monto': totalCommission },
      { 'Concepto': 'Ganancias Vendedores', 'Monto': totalSellerEarnings },
      { 'Concepto': 'Impuestos Recaudados', 'Monto': totalTax },
      { 'Concepto': 'Costo Env\u00edos', 'Monto': totalShipping },
      { 'Concepto': 'Total Pedidos', 'Monto': orders.length },
      { 'Concepto': 'Pedidos Entregados', 'Monto': deliveredOrders.length },
      { 'Concepto': 'Ticket Promedio', 'Monto': orders.length > 0 ? Math.round(totalSales / orders.length) : 0 },
      { 'Concepto': 'Cr\u00e9ditos Otorgados', 'Monto': totalCreditsAmount },
    ];
    downloadCSV(summary, `reporte-financiero-admin-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateCreditsCSV = () => {
    const data = credits.map((c: any) => ({
      'Usuario': c.user ? `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() : '',
      'Email': c.user?.email || '',
      'Concepto': c.concept,
      'Monto': c.amount,
      'Cuotas': c.installments,
      'Monto Cuota': c.installmentAmount,
      'Total a Pagar': c.totalToPay,
      'Tasa Inter\u00e9s': c.interestRate,
      'Estado': creditStatusMap[c.status] || c.status,
      'Cuotas Pagadas': c.paymentSchedule?.filter((p: any) => p.status === 'paid').length || 0,
      'Cuotas Pendientes': c.paymentSchedule?.filter((p: any) => p.status !== 'paid').length || 0,
      'Fecha Solicitud': formatDate(c.createdAt),
    }));
    downloadCSV(data, `reporte-creditos-admin-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // --- PDF Generators ---
  const generateSalesPDF = () => {
    const rows = orders.map((o: any) => `
      <tr>
        <td>${o.orderNumber || ''}</td>
        <td>${formatDate(o.createdAt)}</td>
        <td>${(o.buyer?.firstName || '') + ' ' + (o.buyer?.lastName || '')}</td>
        <td>${(o.seller?.firstName || '') + ' ' + (o.seller?.lastName || '')}</td>
        <td style="text-align:right">${formatCurrency(o.total)}</td>
        <td style="text-align:right">${formatCurrency(o.commissionAmount || 0)}</td>
        <td>${statusMap[o.status] || o.status}</td>
      </tr>`).join('');

    const stats = `<div class="stats">
      <div class="stat"><div class="stat-label">Total Ventas</div><div class="stat-value">${formatCurrency(totalSales)}</div></div>
      <div class="stat"><div class="stat-label">Comisiones</div><div class="stat-value">${formatCurrency(totalCommissions)}</div></div>
      <div class="stat"><div class="stat-label">Pedidos</div><div class="stat-value">${orders.length}</div></div>
      <div class="stat"><div class="stat-label">Entregados</div><div class="stat-value">${orders.filter((o: any) => o.status === 'delivered').length}</div></div>
    </div>`;

    const table = `<table><thead><tr>
      <th>Orden</th><th>Fecha</th><th>Comprador</th><th>Vendedor</th><th>Total</th><th>Comisi\u00f3n</th><th>Estado</th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    generatePDF('Reporte de Ventas', stats, table);
  };

  const generateUsersPDF = () => {
    const sellers = users.filter((u: any) => u.role === 'seller');
    const clients = users.filter((u: any) => u.role === 'client');
    const activeUsers = users.filter((u: any) => u.isActive);

    const rows = users.map((u: any) => `
      <tr>
        <td>${(u.firstName || '') + ' ' + (u.lastName || '')}</td>
        <td>${u.email}</td>
        <td>${roleMap[u.role] || u.role}</td>
        <td>${u.isActive ? 'Activo' : 'Inactivo'}</td>
        <td>${formatDate(u.createdAt)}</td>
      </tr>`).join('');

    const stats = `<div class="stats">
      <div class="stat"><div class="stat-label">Total Usuarios</div><div class="stat-value">${users.length}</div></div>
      <div class="stat"><div class="stat-label">Vendedores</div><div class="stat-value">${sellers.length}</div></div>
      <div class="stat"><div class="stat-label">Clientes</div><div class="stat-value">${clients.length}</div></div>
      <div class="stat"><div class="stat-label">Activos</div><div class="stat-value">${activeUsers.length}</div></div>
    </div>`;

    const table = `<table><thead><tr>
      <th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Fecha Registro</th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    generatePDF('Reporte de Usuarios', stats, table);
  };

  const generateProductsPDF = () => {
    const totalStock = products.reduce((s: number, p: any) => s + (p.stock || 0), 0);
    const totalValue = products.reduce((s: number, p: any) => s + (p.price * (p.stock || 0)), 0);

    const rows = products.map((p: any) => `
      <tr>
        <td>${p.sku || ''}</td>
        <td>${p.name}</td>
        <td>${p.category || ''}</td>
        <td style="text-align:right">${formatCurrency(p.price)}</td>
        <td style="text-align:right">${p.stock}</td>
        <td>${p.status}</td>
      </tr>`).join('');

    const stats = `<div class="stats">
      <div class="stat"><div class="stat-label">Total Productos</div><div class="stat-value">${products.length}</div></div>
      <div class="stat"><div class="stat-label">Stock Total</div><div class="stat-value">${totalStock.toLocaleString('es-PY')}</div></div>
      <div class="stat"><div class="stat-label">Valor Inventario</div><div class="stat-value">${formatCurrency(totalValue)}</div></div>
    </div>`;

    const table = `<table><thead><tr>
      <th>SKU</th><th>Nombre</th><th>Categor\u00eda</th><th>Precio</th><th>Stock</th><th>Estado</th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    generatePDF('Reporte de Productos', stats, table);
  };

  const generateFinancialPDF = () => {
    const totalSellerEarnings = orders.reduce((s: number, o: any) => s + (o.sellerEarnings || 0), 0);
    const totalTax = orders.reduce((s: number, o: any) => s + (o.tax || 0), 0);
    const deliveredTotal = orders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + (o.total || 0), 0);

    const stats = `<div class="stats">
      <div class="stat"><div class="stat-label">Ventas Totales</div><div class="stat-value">${formatCurrency(totalSales)}</div></div>
      <div class="stat"><div class="stat-label">Comisiones</div><div class="stat-value">${formatCurrency(totalCommissions)}</div></div>
      <div class="stat"><div class="stat-label">Impuestos</div><div class="stat-value">${formatCurrency(totalTax)}</div></div>
      <div class="stat"><div class="stat-label">Cr\u00e9ditos</div><div class="stat-value">${formatCurrency(totalCreditsAmount)}</div></div>
    </div>`;

    const tableData = [
      ['Ventas Totales (todos los estados)', formatCurrency(totalSales)],
      ['Ventas Entregadas', formatCurrency(deliveredTotal)],
      ['Comisiones Plataforma', formatCurrency(totalCommissions)],
      ['Ganancias Vendedores', formatCurrency(totalSellerEarnings)],
      ['Impuestos Recaudados', formatCurrency(totalTax)],
      ['Total Pedidos', String(orders.length)],
      ['Ticket Promedio', formatCurrency(orders.length > 0 ? Math.round(totalSales / orders.length) : 0)],
      ['Cr\u00e9ditos Otorgados', formatCurrency(totalCreditsAmount)],
      ['Cr\u00e9ditos Activos', String(credits.filter((c: any) => c.status === 'active').length)],
    ];

    const rows = tableData.map(([concept, value]) => `
      <tr><td>${concept}</td><td style="text-align:right;font-weight:bold">${value}</td></tr>
    `).join('');

    const table = `<table><thead><tr>
      <th>Concepto</th><th style="text-align:right">Monto</th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    generatePDF('Reporte Financiero', stats, table);
  };

  const generateCreditsPDF = () => {
    const activeCredits = credits.filter((c: any) => c.status === 'active');
    const pendingCredits = credits.filter((c: any) => c.status === 'pending');
    const totalPending = pendingCredits.reduce((s: number, c: any) => s + (c.amount || 0), 0);

    const rows = credits.map((c: any) => `
      <tr>
        <td>${c.user ? (c.user.firstName || '') + ' ' + (c.user.lastName || '') : ''}</td>
        <td>${c.concept || ''}</td>
        <td style="text-align:right">${formatCurrency(c.amount)}</td>
        <td>${c.installments}</td>
        <td style="text-align:right">${formatCurrency(c.installmentAmount)}</td>
        <td>${creditStatusMap[c.status] || c.status}</td>
        <td>${formatDate(c.createdAt)}</td>
      </tr>`).join('');

    const stats = `<div class="stats">
      <div class="stat"><div class="stat-label">Total Cr\u00e9ditos</div><div class="stat-value">${credits.length}</div></div>
      <div class="stat"><div class="stat-label">Monto Total</div><div class="stat-value">${formatCurrency(totalCreditsAmount)}</div></div>
      <div class="stat"><div class="stat-label">Activos</div><div class="stat-value">${activeCredits.length}</div></div>
      <div class="stat"><div class="stat-label">Pendientes</div><div class="stat-value">${formatCurrency(totalPending)}</div></div>
    </div>`;

    const table = `<table><thead><tr>
      <th>Usuario</th><th>Concepto</th><th>Monto</th><th>Cuotas</th><th>Monto Cuota</th><th>Estado</th><th>Fecha</th>
    </tr></thead><tbody>${rows}</tbody></table>`;

    generatePDF('Reporte de Cr\u00e9ditos', stats, table);
  };

  // --- Report Handler ---
  const handleGenerateReport = async (type: string, format: string) => {
    const key = `${type}-${format}`;
    setGeneratingReport(key);

    try {
      if (format === 'CSV') {
        if (type === 'sales') generateSalesCSV();
        else if (type === 'users') generateUsersCSV();
        else if (type === 'products') generateProductsCSV();
        else if (type === 'financial') generateFinancialCSV();
        else if (type === 'credits') generateCreditsCSV();
      } else {
        if (type === 'sales') generateSalesPDF();
        else if (type === 'users') generateUsersPDF();
        else if (type === 'products') generateProductsPDF();
        else if (type === 'financial') generateFinancialPDF();
        else if (type === 'credits') generateCreditsPDF();
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
      description: `${orders.length} pedidos - Total: ${formatCurrency(totalSales)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      formats: ['CSV', 'PDF'],
    },
    {
      key: 'users',
      title: 'Reporte de Usuarios',
      description: `${users.length} usuarios - ${users.filter((u: any) => u.role === 'seller').length} vendedores, ${users.filter((u: any) => u.role === 'client').length} clientes`,
      icon: Users,
      color: 'bg-blue-500',
      formats: ['CSV', 'PDF'],
    },
    {
      key: 'products',
      title: 'Reporte de Productos',
      description: `${products.length} productos - Stock: ${products.reduce((s: number, p: any) => s + (p.stock || 0), 0).toLocaleString('es-PY')}`,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      formats: ['CSV', 'PDF'],
    },
    {
      key: 'financial',
      title: 'Reporte Financiero',
      description: `Comisiones: ${formatCurrency(totalCommissions)} - Cr\u00e9ditos: ${formatCurrency(totalCreditsAmount)}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      formats: ['CSV', 'PDF'],
    },
    {
      key: 'credits',
      title: 'Reporte de Cr\u00e9ditos',
      description: `${credits.length} cr\u00e9ditos - ${credits.filter((c: any) => c.status === 'active').length} activos, ${credits.filter((c: any) => c.status === 'pending').length} pendientes`,
      icon: BarChart3,
      color: 'bg-cyan-500',
      formats: ['CSV', 'PDF'],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Genera y descarga reportes del sistema</p>
        </div>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
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
            <p className="text-sm text-gray-500">Usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          ) : format === 'CSV' ? (
                            <FileText className="w-4 h-4 mr-2" />
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
