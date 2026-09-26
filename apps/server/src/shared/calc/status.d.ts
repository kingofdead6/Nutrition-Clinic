// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import type { PatientStatus } from '../enums.js';
export interface StatusInput {
  archived: boolean;
  statusOverride: PatientStatus | null;
  /** The patient's active diet plan, if any. */
  activePlan: {
    startDate: string;
    endDate: string;
  } | null;
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
export declare function computePatientStatus(input: StatusInput): PatientStatus;
