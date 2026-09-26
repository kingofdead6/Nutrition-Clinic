import { useQuery } from '@tanstack/react-query';
import type { DashboardStats } from '@shared';
import { apiClient } from '../lib/apiClient';

export const DASHBOARD_KEY = ['dashboard'] as const;

export function useDashboardStats() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'stats'],
    queryFn: ({ signal }) => apiClient.get<DashboardStats>('/dashboard/stats', { signal }),
  });
}
