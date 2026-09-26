import { useTranslation } from 'react-i18next';
import { dayTotals, formatDateOnly } from '@clinic/shared';
import { usePatientPlans } from '../../api/dietPlans';
import { ButtonLink } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/States';
import { InfoList } from '../patients/ProfileTab';
import { PlanStatusBadge } from './PlanStatusBadge';

/** The mockup's "current plan" card: goal, calories, duration, start date, details button. */
export function ActivePlanCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const plans = usePatientPlans(patientId);
  const active = plans.data?.find((p) => p.isActive);

  return (
    <Card className="ring-1 ring-gray-100">
      <CardTitle actions={active && <PlanStatusBadge plan={active} />}>
        {t('dashboard.panel.currentPlan')}
      </CardTitle>
      {plans.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : !active ? (
        <p className="py-4 text-center text-sm text-gray-500">
          {t('dashboard.panel.noActivePlan')}
        </p>
      ) : (
        <>
          <p className="mb-1 font-semibold text-gray-900">{active.title}</p>
          <InfoList
            rows={[
              [t('dashboard.panel.goal'), t(`enums.goal.${active.goal}`)],
              [
                t('dashboard.panel.calories'),
                `${active.dailyCalories} ${t('common.kcal')}` +
                  (active.days[0]
                    ? ` (${dayTotals(active.days[0]).calories} ${t('plans.daily')})`
                    : ''),
              ],
              [t('dashboard.panel.duration'), t('plans.weeks', { count: active.durationWeeks })],
              [
                t('dashboard.panel.startDate'),
                <span dir="ltr">{formatDateOnly(active.startDate)}</span>,
              ],
            ]}
          />
          <ButtonLink
            size="sm"
            variant="secondary"
            className="mt-3 w-full"
            to={`/diet-plans/${active.id}`}
          >
            {t('dashboard.panel.planDetails')}
          </ButtonLink>
        </>
      )}
    </Card>
  );
}
