import { DEFAULT_SETTINGS, todayIn } from '@shared';
import { useAuthStatus } from '../api/auth';

/** Today (`YYYY-MM-DD`) in the clinic's timezone, e.g. for ages and date limits. */
export function useClinicToday(): string {
  const timezone = useAuthStatus().data?.clinic.timezone ?? DEFAULT_SETTINGS.timezone;
  return todayIn(timezone);
}
