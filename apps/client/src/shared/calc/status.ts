import { INACTIVE_AFTER_DAYS, NEW_PLAN_WINDOW_DAYS } from '../constants';
import type { PatientStatus } from '../enums';
import { daysBetween } from './dateOnly';

export interface StatusInput {
  archived: boolean;
  statusOverride: PatientStatus | null;
  /** The patient's active diet plan, if any. */
  activePlan: { startDate: string; endDate: string } | null;
  lastVisitDate: string | null;
  /** Date the patient was registered (`YYYY-MM-DD`), used when there is no visit yet. */
  createdDate: string;
  /** Today in the clinic timezone. */
  today: string;
}

/**
 * The patient's effective status:
 * 1. a manual override always wins;
 * 2. archived patients are inactive;
 * 3. with an active plan: ended (end date passed) → plan_ended; started within the last
 *    7 days (or starting later) → new_plan; otherwise follow_up;
 * 4. without an active plan: seen (or registered) within the last 60 days → follow_up,
 *    else inactive.
 */
export function computePatientStatus(input: StatusInput): PatientStatus {
  if (input.statusOverride) return input.statusOverride;
  if (input.archived) return 'inactive';

  const { activePlan, today } = input;
  if (activePlan) {
    if (activePlan.endDate < today) return 'plan_ended';
    if (daysBetween(activePlan.startDate, today) < NEW_PLAN_WINDOW_DAYS) return 'new_plan';
    return 'follow_up';
  }

  const reference = input.lastVisitDate ?? input.createdDate;
  return daysBetween(reference, today) <= INACTIVE_AFTER_DAYS ? 'follow_up' : 'inactive';
}
