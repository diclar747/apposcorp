import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear moneda (Guaraníes Paraguayos)
export function formatCurrency(amount: number, currency: string = 'PYG'): string {
  if (currency === 'PYG') {
    return `₲ ${amount.toLocaleString('es-PY')}`;
  }
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Formatear fecha
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
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
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formatear hora
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formatear fecha y hora
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
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
export function formatNumber(num: number): string {
  return num.toLocaleString('es-PY');
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
}

// Obtener estado de pedido con color
export function getOrderStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    preparing: { label: 'En preparación', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ready: { label: 'Listo', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    in_transit: { label: 'En camino', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    delivered: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
    refunded: { label: 'Reembolsado', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };
  return statuses[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
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

// Obtener nombre de rol
export function getRoleName(role: string): string {
  const roles: Record<string, string> = {
    client: 'Cliente',
    seller: 'Vendedor',
    superadmin: 'Administrador',
  };
  return roles[role] || role;
}

// Obtener color de rol
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    client: 'bg-blue-100 text-blue-800',
    seller: 'bg-green-100 text-green-800',
    superadmin: 'bg-purple-100 text-purple-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
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
