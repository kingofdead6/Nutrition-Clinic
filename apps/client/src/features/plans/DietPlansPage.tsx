import { LayoutTemplate, Plus, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDateOnly, type DietPlanWithPatient } from '@shared';
import { useDietPlans } from '../../api/dietPlans';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Checkbox } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/States';
import { Tabs } from '../../components/ui/Tabs';
import { useCanEditClinical } from '../../lib/roles';
import { PlanStatusBadge } from './PlanStatusBadge';

type Tab = 'plans' | 'templates';

export function DietPlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canEdit = useCanEditClinical();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'templates' ? 'templates' : 'plans';
  const activeOnly = params.get('active') === 'true';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const list = useDietPlans({
    isTemplate: tab === 'templates',
    isActive: tab === 'plans' && activeOnly ? true : undefined,
    page,
    pageSize: 20,
  });
  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  const columns: Column<DietPlanWithPatient>[] = [
    {
      key: 'title',
      header: t('plans.columns.title'),
      cell: (p) => <span className="font-semibold text-gray-900">{p.title}</span>,
    },
    ...(tab === 'plans'
      ? [
          {
            key: 'patient',
            header: t('plans.columns.patient'),
            cell: (p: DietPlanWithPatient) => p.patient?.fullName ?? '—',
          },
        ]
      : []),
    { key: 'goal', header: t('plans.columns.goal'), cell: (p) => t(`enums.goal.${p.goal}`) },
    {
      key: 'kcal',
      header: t('plans.columns.calories'),
      cell: (p) => <span className="tabular-nums">{`${p.dailyCalories} ${t('common.kcal')}`}</span>,
    },
    {
      key: 'period',
      header: t('plans.columns.period'),
      cell: (p) =>
        tab === 'templates' ? (
          t('plans.weeks', { count: p.durationWeeks })
        ) : (
          <span
            className="whitespace-nowrap"
            dir="ltr"
          >{`${formatDateOnly(p.startDate)} → ${formatDateOnly(p.endDate)}`}</span>
        ),
    },
    { key: 'status', header: t('plans.columns.status'), cell: (p) => <PlanStatusBadge plan={p} /> },
  ];

  return (
    <>
      <PageHeader
        title={t('plans.title')}
        subtitle={t('plans.subtitle')}
        actions={
          canEdit && (
            <>
              <ButtonLink variant="secondary" to="/diet-plans/new?template=1">
                <LayoutTemplate className="h-4 w-4" aria-hidden />
                {t('plans.newTemplate')}
              </ButtonLink>
              <ButtonLink to="/diet-plans/new">
                <Plus className="h-4 w-4" aria-hidden />
                {t('plans.new')}
              </ButtonLink>
            </>
          )
        }
      />
      <Card>
        <Tabs
          items={[
            { id: 'plans', label: t('plans.tabs.plans') },
            { id: 'templates', label: t('plans.tabs.templates') },
          ]}
          value={tab}
          onChange={(id) =>
            set({ tab: id === 'plans' ? undefined : id, page: undefined, active: undefined })
          }
          idPrefix="plans"
          label={t('plans.title')}
        />
        {tab === 'plans' && (
          <label className="mb-3 flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={activeOnly}
              onChange={(e) =>
                set({ active: e.target.checked ? 'true' : undefined, page: undefined })
              }
            />
            {t('plans.activeOnly')}
          </label>
        )}
        <DataTable
          caption={t('plans.title')}
          columns={columns}
          rows={list.data?.data}
          rowKey={(p) => p.id}
          loading={list.isPending}
          refreshing={list.isPlaceholderData}
          error={list.error}
          onRetry={() => void list.refetch()}
          onRowClick={(p) => navigate(`/diet-plans/${p.id}`)}
          pagination={
            list.data && {
              page: list.data.page,
              pageSize: list.data.pageSize,
              total: list.data.total,
              onPageChange: (p) => set({ page: String(p) }),
            }
          }
          empty={
            <EmptyState
              icon={UtensilsCrossed}
              title={tab === 'templates' ? t('plans.emptyTemplates') : t('plans.empty')}
            />
          }
        />
      </Card>
    </>
  );
}
