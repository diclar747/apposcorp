import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

export interface AdminStats {
  metrics: {
    users: { current: number; previous: number };
    sellers: { current: number; previous: number };
    products: { current: number; previous: number };
    credits: { current: number; previous: number };
  };
  finances: {
    salesToday: number;
    income30Days: number;
  };
  orderDistribution: {
    status: string;
    count: number;
  }[];
  salesSeries: {
    name: string;
    ventas: number;
    comisiones: number;
  }[];
  userSeries: {
    name: string;
    clientes: number;
    vendedores: number;
  }[];
  recentActivity: {
    orders: {
      id: string;
      orderNumber: string;
      buyer: string;
      store: string;
      total: number;
      status: string;
      date: string;
    }[];
    transactions: {
      id: string;
      type: string;
      user: string;
      email: string;
      amount: number;
      status: string;
      date: string;
    }[];
  };
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => reportsApi.getAdminStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });
}
