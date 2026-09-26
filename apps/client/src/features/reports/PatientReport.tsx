import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { APPOINTMENT_STATUSES, formatDateOnly, type PatientReport } from '@clinic/shared';
import { usePatientReport } from '../../api/reports';
import { MetricLineChart, WaistHipChart } from '../../components/charts/ProgressCharts';
import { HorizontalBars } from '../../components/charts/ReportCharts';
import { Button } from '../../components/ui/Button';
import { Skeleton, ErrorState } from '../../components/ui/States';
import { cn } from '../../lib/cn';
import { openPrint } from '../../lib/print';
import { Letterhead, PrintFooter, PrintSheet } from '../print/PrintLayout';

const signed = (v: number | null, unit = '') =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${v}${unit ? ` ${unit}` : ''}`;

/** Per-patient progress report: tiles, charts, appointments, plans. Screen and print. */
export function PatientReportBody({
  report,
  compact = false,
}: {
  report: PatientReport;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const s = report.stats;
  const hasGirths = report.progress.series.some((p) => p.waistCm != null || p.hipCm != null);
  const tiles: Array<[string, string, string?]> = [
    [t('reports.patient.visits'), String(s.visits)],
    [
      t('reports.patient.followed'),
      s.followedDays != null ? t('reports.patient.days', { count: s.followedDays }) : '—',
      s.firstVisit && s.lastVisit
        ? t('reports.patient.firstLast', {
            first: formatDateOnly(s.firstVisit),
            last: formatDateOnly(s.lastVisit),
          })
        : undefined,
    ],
    [t('reports.patient.weightChange'), signed(s.weightChangeKg, t('common.kg'))],
    [t('reports.patient.bmiChange'), signed(s.bmiChange)],
    [t('reports.patient.goalProgress'), s.goalProgressPct != null ? `${s.goalProgressPct}%` : '—'],
    [t('reports.patient.attendance'), s.attendanceRate != null ? `${s.attendanceRate}%` : '—'],
  ];

  return (
    <div className="space-y-5">
      <dl className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3')}>
        {tiles.map(([label, value, note]) => (
          <div
            key={label}
            className="rounded-xl bg-gray-50 px-4 py-3 print:border print:border-gray-200"
          >
            <dt className="text-xs font-semibold text-gray-600">{label}</dt>
            <dd className="mt-0.5 text-lg font-bold text-gray-900" dir="auto">
              {value}
            </dd>
            {note && (
              <dd className="text-[11px] text-gray-500" dir="ltr">
                {note}
              </dd>
            )}
          </div>
        ))}
      </dl>

      <div
        className={cn(
          'grid gap-4',
          !compact && 'md:grid-cols-2',
          'break-inside-avoid print:grid-cols-2',
        )}
      >
        <MetricLineChart
          data={report.progress.series}
          metric="weightKg"
          title={t('measurements.charts.weight')}
          unit={t('common.kg')}
          height={190}
        />
        <MetricLineChart
          data={report.progress.series}
          metric="bmi"
          title={t('measurements.charts.bmi')}
          height={190}
        />
        {!compact && hasGirths && <WaistHipChart data={report.progress.series} height={190} />}
        <HorizontalBars
          title={t('reports.patient.appointments')}
          rows={APPOINTMENT_STATUSES.map((st) => ({
            key: st,
            label: t(`enums.appointmentStatus.${st}`),
            value: s.appointments[st],
          }))}
        />
      </div>

      <section className="break-inside-avoid">
        <h3 className="mb-2 text-sm font-bold text-gray-900">{t('reports.patient.plans')}</h3>
        {report.plans.length === 0 ? (
          <p className="text-sm text-gray-500">{t('reports.patient.noPlans')}</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm">
            {report.plans.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                <span className="font-semibold text-gray-900">{p.title}</span>
                {p.isActive && (
                  <span className="rounded-full bg-pastel-green px-2 py-0.5 text-xs font-bold text-status-green">
                    {t('reports.patient.active')}
                  </span>
                )}
                <span className="text-gray-600">{`${p.dailyCalories} ${t('common.kcal')}`}</span>
                <span className="ms-auto text-xs text-gray-500" dir="ltr">
                  {`${formatDateOnly(p.startDate)} → ${formatDateOnly(p.endDate)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-gray-600">
          {t('reports.patient.prescriptions')}: <b>{s.prescriptions}</b>
        </p>
      </section>
    </div>
  );
}

/** Patient page / dashboard panel "التقارير" tab. */
export function PatientReportTab({
  patientId,
  compact = false,
}: {
  patientId: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const report = usePatientReport(patientId);
  if (report.isPending) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (report.isError)
    return <ErrorState error={report.error} onRetry={() => void report.refetch()} />;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => openPrint(`/print/report/${patientId}`)}>
          <Printer className="h-4 w-4" aria-hidden />
          {t('reports.patient.print')}
        </Button>
      </div>
      <PatientReportBody report={report.data} compact={compact} />
    </div>
  );
}

/** `/print/report/:id` — the printable progress report. */
export function PrintPatientReportPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const report = usePatientReport(id);
  const r = report.data;
  return (
    <PrintSheet
      title={`${t('reports.patient.title')} — ${r?.patient.fullName ?? ''}`}
      ready={!!r}
      error={report.error}
      onRetry={() => void report.refetch()}
    >
      {r && (
        <article>
          <Letterhead date={r.generatedOn} />
          <h1 className="mb-1 text-center text-lg font-extrabold text-brand-900">
            {t('reports.patient.title')}
          </h1>
          <p className="mb-4 text-center text-sm text-gray-700">
            <b>{r.patient.fullName}</b> · <span dir="ltr">{r.patient.fileNumber}</span> ·{' '}
            {t(`enums.goal.${r.patient.goal}`)}
          </p>
          <PatientReportBody report={r} />
          <PrintFooter />
        </article>
      )}
    </PrintSheet>
  );
}
