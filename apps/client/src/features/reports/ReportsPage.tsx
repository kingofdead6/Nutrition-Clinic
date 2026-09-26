import { CalendarCheck, Scale, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  APPOINTMENT_STATUSES,
  formatDateOnly,
  monthStart,
  OUTCOME_BUCKETS,
  type ReportRangeQuery,
} from '@shared';
import { useReportsOverview } from '../../api/reports';
import {
  HorizontalBars,
  MonthlyColumns,
  OutcomeHistogram,
} from '../../components/charts/ReportCharts';
import { CHART } from '../../components/charts/tokens';
import { Card } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { PageHeader } from '../../components/ui/PageHeader';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { StatCard } from '../../components/ui/StatCard';
import { cn } from '../../lib/cn';
import { useClinicToday } from '../../lib/useClinicToday';

type Preset = '3m' | '6m' | '12m' | 'year';
const PRESETS: readonly Preset[] = ['3m', '6m', '12m', 'year'];

function presetRange(preset: Preset, today: string): Required<ReportRangeQuery> {
  if (preset === 'year') return { from: `${today.slice(0, 4)}-01-01`, to: today };
  const months = { '3m': 2, '6m': 5, '12m': 11 }[preset];
  return { from: monthStart(today, months), to: today };
}

const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function ReportsPage() {
  const { t } = useTranslation();
  const today = useClinicToday();
  const [params, setParams] = useSearchParams();
  const [showTables, setShowTables] = useState(false);

  const preset = PRESETS.includes(params.get('preset') as Preset)
    ? (params.get('preset') as Preset)
    : null;
  const custom = isDate(params.get('from')) && isDate(params.get('to'));
  const range: Required<ReportRangeQuery> = custom
    ? { from: params.get('from') as string, to: params.get('to') as string }
    : presetRange(preset ?? '6m', today);
  const report = useReportsOverview(range);
  const r = report.data;
  const kg = t('common.kg');

  const selectPreset = (p: Preset) => setParams(p === '6m' ? {} : { preset: p }, { replace: true });
  const setCustom = (key: 'from' | 'to', value: string) =>
    value && setParams({ from: range.from, to: range.to, [key]: value }, { replace: true });

  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />

      {/* Filters: one row above everything they scope. */}
      <Card className="mb-6">
        <div
          role="group"
          aria-label={t('reports.range.label')}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="inline-flex flex-wrap rounded-lg bg-gray-100 p-1">
            {PRESETS.map((p) => {
              const active = !custom && (preset ?? '6m') === p;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectPreset(p)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold',
                    active
                      ? 'bg-white text-brand-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  {t(`reports.range.presets.${p}`)}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            {t('reports.range.from')}
            <DatePicker
              className="w-40"
              value={range.from}
              max={range.to}
              onChange={(e) => setCustom('from', e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            {t('reports.range.to')}
            <DatePicker
              className="w-40"
              value={range.to}
              min={range.from}
              onChange={(e) => setCustom('to', e.target.value)}
            />
          </label>
          <span
            className="ms-auto text-sm font-semibold text-gray-700"
            dir="ltr"
            aria-live="polite"
          >
            {t('reports.range.period', {
              from: formatDateOnly(range.from),
              to: formatDateOnly(range.to),
            })}
          </span>
        </div>
      </Card>

      {report.isError && !r ? (
        <Card>
          <ErrorState error={report.error} onRetry={() => void report.refetch()} />
        </Card>
      ) : !r ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        // Refetch keeps the frame: previous results stay, dimmed, while a new range loads.
        <div
          className={cn('space-y-6 transition-opacity', report.isPlaceholderData && 'opacity-60')}
        >
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              tone="green"
              icon={UserPlus}
              label={t('reports.totals.newPatients')}
              value={r.totals.newPatients}
            />
            <StatCard
              tone="blue"
              icon={Users}
              label={t('reports.totals.visits')}
              value={r.totals.visits}
              note={t('reports.totals.patientsSeen', { count: r.totals.patientsSeen })}
            />
            <StatCard
              tone="purple"
              icon={CalendarCheck}
              label={t('reports.totals.attendance')}
              value={r.totals.attendanceRate ?? '—'}
              unit={r.totals.attendanceRate != null ? '%' : undefined}
              note={t('reports.totals.attendanceHint')}
            />
            <StatCard
              tone="red"
              icon={Scale}
              label={t('reports.totals.avgChange')}
              value={
                r.outcomes.avgChangeKg != null ? (
                  <span dir="ltr">{`${r.outcomes.avgChangeKg > 0 ? '+' : ''}${r.outcomes.avgChangeKg}`}</span>
                ) : (
                  '—'
                )
              }
              unit={r.outcomes.avgChangeKg != null ? kg : undefined}
              note={
                r.outcomes.patients
                  ? t('reports.totals.avgChangeHint', { count: r.outcomes.patients })
                  : t('reports.totals.noData')
              }
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <MonthlyColumns
              data={r.months}
              dataKey="newPatients"
              title={t('reports.charts.newPatients')}
              color={CHART.series1}
            />
            <MonthlyColumns
              data={r.months}
              dataKey="visits"
              title={t('reports.charts.visits')}
              color={CHART.series2}
            />
            <HorizontalBars
              title={t('reports.charts.appointments')}
              rows={APPOINTMENT_STATUSES.map((s) => ({
                key: s,
                label: t(`enums.appointmentStatus.${s}`),
                value: r.appointmentStatus[s],
              }))}
            />
            <OutcomeHistogram
              buckets={r.outcomes.buckets}
              title={t('reports.charts.outcomes')}
              subtitle={t('reports.charts.outcomesHint')}
            />
          </div>

          <Card>
            <button
              type="button"
              aria-expanded={showTables}
              onClick={() => setShowTables((v) => !v)}
              className="text-sm font-semibold text-brand-800 hover:underline"
            >
              {t('reports.charts.tableView')}
            </button>
            {showTables && <ReportTables report={r} />}
          </Card>
        </div>
      )}
    </>
  );
}

/** The charts' exact values (the accessible twin of every chart above). */
function ReportTables({
  report: r,
}: {
  report: NonNullable<ReturnType<typeof useReportsOverview>['data']>;
}) {
  const { t } = useTranslation();
  const th = 'border-b border-gray-200 px-3 py-2 text-start font-semibold';
  const td = 'border-b border-gray-100 px-3 py-1.5 tabular-nums';
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-3">
      <table className="w-full text-sm">
        <caption className="mb-2 text-start font-bold text-gray-900">
          {t('reports.charts.newPatients')} / {t('reports.charts.visits')}
        </caption>
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th scope="col" className={th}>
              {t('reports.charts.month')}
            </th>
            <th scope="col" className={th}>
              {t('reports.totals.newPatients')}
            </th>
            <th scope="col" className={th}>
              {t('reports.totals.visits')}
            </th>
          </tr>
        </thead>
        <tbody>
          {r.months.map((m) => (
            <tr key={m.month}>
              <td className={td} dir="ltr">
                {m.month.replace('-', '/')}
              </td>
              <td className={td}>{m.newPatients}</td>
              <td className={td}>{m.visits}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full text-sm">
        <caption className="mb-2 text-start font-bold text-gray-900">
          {t('reports.charts.outcomes')}
        </caption>
        <tbody>
          {OUTCOME_BUCKETS.map((b) => (
            <tr key={b}>
              <th scope="row" className={`${td} text-start font-normal text-gray-700`}>
                {t(`reports.buckets.${b}`)}
              </th>
              <td className={td}>{r.outcomes.buckets[b]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full text-sm">
        <caption className="mb-2 text-start font-bold text-gray-900">
          {t('reports.byGoal.title')}
        </caption>
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th scope="col" className={th}>
              {t('reports.byGoal.goal')}
            </th>
            <th scope="col" className={th}>
              {t('reports.byGoal.patients')}
            </th>
            <th scope="col" className={th}>
              {t('reports.byGoal.avgChange')}
            </th>
          </tr>
        </thead>
        <tbody>
          {r.outcomes.byGoal.map((g) => (
            <tr key={g.goal}>
              <td className={td}>{t(`enums.goal.${g.goal}`)}</td>
              <td className={td}>{g.patients}</td>
              <td className={td} dir="ltr">
                {g.avgChangeKg ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
