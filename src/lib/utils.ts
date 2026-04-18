import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear moneda (Guaraníes Paraguayos)
export function formatCurrency(amount: number, currency: string = 'PYG'): string {
  const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  if (currency === 'PYG') {
    return `Gs. ${Math.round(validAmount).toLocaleString('es-PY')}`;
  }
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency,
  }).format(validAmount);
}

// Formatear fecha
export function getSafeDate(date: Date | string | number): Date {
  if (!date) return new Date();
  
  if (typeof date === 'string') {
    // Si detectamos formato YYYY-MM-DD (sin hora), evitamos el desplazamiento UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Date(date.replace(/-/g, '/'));
    }
    // Si es un ISO string pero termina en medianoche exacta 00:00:00.000Z
    // Suele ser una fecha de base de datos que se guardó sin hora.
    if (date.includes('T00:00:00')) {
      return new Date(date.split('T')[0].replace(/-/g, '/'));
    }
  }
  
  const d = new Date(date);
  // Si d.getHours() es 0, d.getMinutes() es 0 y el string original termina en Z, 
  // es muy probable que sea una fecha "atrasada" por zona horaria.
  // Pero lo anterior con .includes('T00:00:00') ya debería cubrir el 99% de los casos.
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = getSafeDate(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return d.toLocaleDateString('es-PY', defaultOptions);
}

// Formatear fecha corta
export function formatShortDate(date: Date | string): string {
  const d = getSafeDate(date);
  return d.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formatear hora
export function formatTime(date: Date | string): string {
  const d = getSafeDate(date);
  return d.toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formatear fecha y hora
export function formatDateTime(date: Date | string): string {
  const d = getSafeDate(date);
  return `${formatShortDate(d)} ${formatTime(d)}`;
}

// Formatear número de teléfono
export function formatPhone(phone: string): string {
  // Formato: +595 981 123456
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('595')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generar slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Generar número de orden
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
}

// Calcular porcentaje
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Calcular cambio porcentual
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Formatear número con separadores
export function formatNumber(num: number | string): string {
  if (num === undefined || num === null || num === '') return '';
  const parsed = typeof num === 'string' ? Number(num.toString().replace(/\D/g, '')) : num;
  return parsed.toLocaleString('es-PY');
}

// Parsear número formateado (quitar puntos, etc)
export function parseFormattedNumber(formatted: string): number {
  if (!formatted) return 0;
  return Number(formatted.toString().replace(/\D/g, ''));
}

// Formatear número compacto (K, M)
export function formatCompactNumber(val: number): string {
  const absVal = Math.abs(val);
  if (absVal >= 1000000) {
    const formatted = val / 1000000;
    return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1)}M`;
  }
  if (absVal >= 1000) {
    const formatted = val / 1000;
    return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1)}K`;
  }
  return val.toLocaleString('es-PY');
}

// Formatear duración (minutos a horas:minutos)
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Obtener iniciales de nombre
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Verificar si una tienda está abierta
export function isStoreOpen(businessHours: any): boolean {
  if (!businessHours) return true; // Default to "open" when no hours configured

  try {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[now.getDay()];
    const dayHours = businessHours[dayName];

    if (!dayHours?.isOpen) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  } catch {
    return true; // Default to "open" on any error
  }
}

// Obtener estado de pedido con color
export function getOrderStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  const s = status?.toLowerCase() || 'pending';
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    preparing: { label: 'En preparación', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ready: { label: 'Listo', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    in_transit: { label: 'En camino', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    'in-transit': { label: 'En camino', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    shipped: { label: 'En camino', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    delivered: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
    refunded: { label: 'Reembolsado', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };
  return statuses[s] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

// Función para traducir estados que vienen en texto plano (ej: notificaciones)
export function translateStatusInText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bin_transit\b/gi, 'En camino')
    .replace(/\bready\b/gi, 'Listo')
    .replace(/\bpreparing\b/gi, 'En preparación')
    .replace(/\bpending\b/gi, 'Pendiente')
    .replace(/\bconfirmed\b/gi, 'Confirmado')
    .replace(/\bdelivered\b/gi, 'Entregado')
    .replace(/\bcancelled\b/gi, 'Cancelado')
    .replace(/\bshipped\b/gi, 'En camino');
}

// Obtener estado de pago con color
export function getPaymentStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  const s = status?.toLowerCase() || 'pending';
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    unpaid: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    pending: { label: 'Procesando', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    paid: { label: 'Pagado', color: 'text-green-700', bgColor: 'bg-green-100' },
    failed: { label: 'Fallido', color: 'text-red-700', bgColor: 'bg-red-100' },
    refunded: { label: 'Reembolsado', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };
  return statuses[s] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

// Obtener tipo de transacción con color
export function getTransactionTypeInfo(type: string): { label: string; color: string; sign: string } {
  const types: Record<string, { label: string; color: string; sign: string }> = {
    income: { label: 'Ingreso', color: 'text-green-600', sign: '+' },
    expense: { label: 'Egreso', color: 'text-red-600', sign: '-' },
    transfer_in: { label: 'Transferencia recibida', color: 'text-green-600', sign: '+' },
    transfer_out: { label: 'Transferencia enviada', color: 'text-red-600', sign: '-' },
    purchase: { label: 'Compra', color: 'text-red-600', sign: '-' },
    sale: { label: 'Venta', color: 'text-green-600', sign: '+' },
    withdrawal: { label: 'Retiro', color: 'text-red-600', sign: '-' },
    deposit: { label: 'Depósito', color: 'text-green-600', sign: '+' },
    commission: { label: 'Comisión', color: 'text-orange-600', sign: '-' },
    credit: { label: 'Crédito', color: 'text-blue-600', sign: '+' },
    fee: { label: 'Tarifa', color: 'text-red-600', sign: '-' },
  };
  return types[type] || { label: type, color: 'text-gray-600', sign: '' };
}

// Obtener estado de transacción/retiro con color
export function getTransactionStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  const s = status?.toLowerCase() || 'pending';
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    processing: { label: 'En Proceso', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    completed: { label: 'Completado', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejected: { label: 'Rechazado', color: 'text-red-700', bgColor: 'bg-red-100' },
    cancelled: { label: 'Cancelado', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };
  return statuses[s] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

// Obtener estado de crédito con color
export function getCreditStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  const s = status?.toLowerCase() || 'pending';
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    approved: { label: 'Aprobado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    active: { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-100' },
    completed: { label: 'Finalizado', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    rejected: { label: 'Rechazado', color: 'text-red-700', bgColor: 'bg-red-100' },
  };
  return statuses[s] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

// Obtener estado de suscripción con color
export function getSubscriptionStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  const s = status?.toLowerCase() || 'pending';
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Solicitado', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
    pending_payment: { label: 'Pendiente de Pago', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    pending_approval: { label: 'Pendiente de Aprobación', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    active: { label: 'Activo', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    revoked: { label: 'Revocado', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    expired: { label: 'Vencido', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/50' },
    cancelled: { label: 'Cancelado', color: 'text-rose-700 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
  };
  return statuses[s] || { label: status, color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/50' };
}

// Obtener nombre de rol
export function getRoleName(role: string): string {
  const roles: Record<string, string> = {
    client: 'Cliente',
    seller: 'Vendedor',
    superadmin: 'Administrador',
    ingenio: 'Ingenio',
  };
  return roles[role] || role;
}

// Obtener color de rol
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    client: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    seller: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    ingenio: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

// Obtener estado de cuenta con color
export function getAccountStatusInfo(isActive: boolean): { label: string; color: string; bgColor: string } {
  return isActive 
    ? { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-100' }
    : { label: 'Inactivo', color: 'text-red-700', bgColor: 'bg-red-100' };
}

// Delay helper
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Debounce
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Exportar a Excel
export function exportToExcel(data: any[], filename: string): void {
  // Esta función requeriría la librería xlsx
  // Por ahora es un placeholder
  console.log('Exporting to Excel:', filename, data);
}

// Exportar a PDF
export function exportToPDF(data: any[], filename: string): void {
  // Esta función requeriría la librería jspdf
  // Por ahora es un placeholder
  console.log('Exporting to PDF:', filename, data);
}

// Generar Reporte PDF (HTML a Ventana de Impresión)
export function generateReportPDF(title: string, statsHtml: string, tableHtml: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#333;font-size:12px}
      h1{font-size:20px;margin-bottom:4px}
      .date{color:#666;font-size:11px;margin-bottom:16px}
      .stats{display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap}
      .stat{background:#f5f5f5;padding:10px 14px;border-radius:8px;min-width:120px}
      .stat-label{font-size:10px;color:#666}
      .stat-value{font-size:16px;font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}
      th{background:#f0f0f0;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd}
      td{padding:5px 8px;border-bottom:1px solid #eee}
      tr:nth-child(even){background:#fafafa}
      .text-right{text-align:right}
      .text-green{color:#16a34a}
      .text-red{color:#dc2626}
      .badge{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold;text-transform:uppercase}
      .badge-green{background:#dcfce7;color:#16a34a}
      .badge-blue{background:#dbeafe;color:#2563eb}
      .badge-yellow{background:#fef9c3;color:#854d0e}
      .badge-red{background:#fee2e2;color:#dc2626}
      .badge-gray{background:#f3f4f6;color:#4b5563}
      @media print{body{padding:0}.no-print{display:none}}
    </style></head><body>
    <h1>${title} - Oscorp Platform</h1>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY')}</p>
    ${statsHtml}
    ${tableHtml}
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`;
  
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
