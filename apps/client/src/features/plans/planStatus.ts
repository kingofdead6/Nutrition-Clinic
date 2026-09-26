import type { DietPlan } from '@shared';

export type PlanStatus = 'template' | 'active' | 'ended' | 'inactive';

export function planStatus(
  plan: Pick<DietPlan, 'isTemplate' | 'isActive' | 'endDate'>,
  today: string,
): PlanStatus {
  if (plan.isTemplate) return 'template';
  if (plan.endDate < today) return 'ended';
  return plan.isActive ? 'active' : 'inactive';
}
