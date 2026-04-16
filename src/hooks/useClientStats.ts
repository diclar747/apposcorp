import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

export interface ClientStats {
  finances: {
    balance: number;
    rewardPoints: number;
    lastCredit: {
      status: string;
      amount: number;
      date: string;
    } | null;
  };
  orders: {
    totalCount: number;
    lastOrder: {
      orderNumber: string;
      status: string;
      total: number;
      date: string;
    } | null;
  };
  academy: {
    hasAccess: boolean;
    overallProgress?: number;
    coursesCount?: number;
    currentStage?: string;
    wheelProgress?: number;
  };
}

export function useClientStats() {
  return useQuery<ClientStats>({
    queryKey: ['client-stats'],
    queryFn: () => reportsApi.getClientStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });
}
