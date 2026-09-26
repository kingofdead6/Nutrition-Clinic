import { useTranslation } from 'react-i18next';
import type { DietPlan } from '@shared';
import { cn } from '../../lib/cn';
import { useClinicToday } from '../../lib/useClinicToday';
import { planStatus, type PlanStatus } from './planStatus';

const TONE: Record<PlanStatus, string> = {
  active: 'bg-pastel-green text-status-green',
  ended: 'bg-pastel-orange text-status-orange',
  inactive: 'bg-gray-100 text-status-gray',
  template: 'bg-pastel-purple text-violet-800',
};

export function PlanStatusBadge({
  plan,
}: {
  plan: Pick<DietPlan, 'isTemplate' | 'isActive' | 'endDate'>;
}) {
  const { t } = useTranslation();
  const status = planStatus(plan, useClinicToday());
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold',
        TONE[status],
      )}
    >
      {t(`plans.status.${status}`)}
    </span>
  );
}
