import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

export interface SellerStats {
  stats: {
    totalRevenue: number;
    totalSales: number;
    totalPurchases: number;
    pendingOrders: number;
    currentBalance: number;
    storeName: string;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    buyer: string;
    total: number;
    status: string;
    date: string;
  }[];
  chartData: {
    date: string;
    revenue: number;
  }[];
}

export function useSellerStats() {
  return useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: () => reportsApi.getSellerStats(),
    staleTime: 0, // Always consider data stale to force refresh on mount
    refetchInterval: 1000 * 30, // Polling each 30 seconds
    retry: 2
  });
}
