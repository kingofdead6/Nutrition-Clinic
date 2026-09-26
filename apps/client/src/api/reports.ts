import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PatientReport, ReportRangeQuery, ReportsOverview } from '@clinic/shared';
import { apiClient } from '../lib/apiClient';

export const REPORTS_KEY = ['reports'] as const;

export function useReportsOverview(range: ReportRangeQuery) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'overview', range],
    queryFn: ({ signal }) =>
      apiClient.get<ReportsOverview>('/reports/overview', { query: { ...range }, signal }),
    // Keep the previous charts on screen (dimmed) while a new range loads.
    placeholderData: keepPreviousData,
  });
}

export function usePatientReport(patientId: string | undefined) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'patient', patientId],
    queryFn: ({ signal }) =>
      apiClient.get<PatientReport>(`/reports/patient/${patientId}`, { signal }),
    enabled: !!patientId,
  });
}
