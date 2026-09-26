import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDateOnly,
  type Measurement,
  type Patient,
  type PatientProgress,
} from '@clinic/shared';
import { useDeleteMeasurement, useMeasurements, useProgress } from '../../api/measurements';
import { MetricLineChart, WaistHipChart } from '../../components/charts/ProgressCharts';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { EmptyState, Skeleton } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { cn } from '../../lib/cn';
import { errorText } from '../../lib/errors';
import { BmiBadge } from './BmiBadge';
import { MeasurementFormModal } from './MeasurementFormModal';

/** `compact` stacks the charts in one column (the dashboard's side panel). */
export function MeasurementsTab({
  patient,
  compact = false,
}: {
  patient: Patient;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const measurements = useMeasurements(patient.id);
  const progress = useProgress(patient.id);
  const remove = useDeleteMeasurement(patient.id);
  const [editing, setEditing] = useState<Measurement | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Measurement | null>(null);

  const rows = measurements.data ? [...measurements.data].reverse() : undefined; // newest first
  const dash = <span className="text-gray-400">—</span>;
  const num = (v: number | null) => (v == null ? dash : v);

  const columns: Column<Measurement>[] = [
    {
      key: 'date',
      header: t('measurements.fields.date'),
      cell: (m) => <span dir="ltr">{formatDateOnly(m.date)}</span>,
    },
    { key: 'weight', header: t('measurements.short.weight'), cell: (m) => <b>{m.weightKg}</b> },
    { key: 'height', header: t('measurements.short.height'), cell: (m) => m.heightM },
    {
      key: 'bmi',
      header: t('measurements.short.bmi'),
      cell: (m) => (
        <span className="inline-flex items-center gap-2">
          {m.bmi}
          <BmiBadge category={m.bmiCategory} />
        </span>
      ),
    },
    { key: 'waist', header: t('measurements.short.waist'), cell: (m) => num(m.waistCm) },
    { key: 'hip', header: t('measurements.short.hip'), cell: (m) => num(m.hipCm) },
    { key: 'whr', header: t('measurements.short.whr'), cell: (m) => num(m.waistHipRatio) },
    {
      key: 'fat',
      header: t('measurements.short.fat'),
      cell: (m) => (m.bodyFatPct == null ? dash : `${m.bodyFatPct}%`),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      cell: (m) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(m)}
            aria-label={`${t('common.edit')} ${formatDateOnly(m.date)}`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            onClick={() => setDeleting(m)}
            aria-label={`${t('common.delete')} ${formatDateOnly(m.date)}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SummaryTiles progress={progress.data} goal={patient.goal} />

      {progress.data ? (
        <div className={cn('grid gap-5', !compact && 'lg:grid-cols-2')}>
          <MetricLineChart
            data={progress.data.series}
            metric="weightKg"
            title={t('measurements.charts.weight')}
            unit={t('common.kg')}
          />
          <MetricLineChart
            data={progress.data.series}
            metric="bmi"
            title={t('measurements.charts.bmi')}
          />
          <WaistHipChart data={progress.data.series} />
          <MetricLineChart
            data={progress.data.series}
            metric="bodyFatPct"
            title={t('measurements.charts.fat')}
            unit="%"
          />
        </div>
      ) : (
        <div className={cn('grid gap-5', !compact && 'lg:grid-cols-2')}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[268px] w-full rounded-2xl" />
          ))}
        </div>
      )}

      <section aria-labelledby="visits-title">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="visits-title" className="text-base font-bold text-gray-900">
            {t('measurements.visits')}
          </h3>
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('measurements.add')}
          </Button>
        </div>
        {/* The table is also the accessible, exact-value twin of the charts above. */}
        <DataTable
          caption={t('measurements.visits')}
          columns={columns}
          rows={rows}
          rowKey={(m) => m.id}
          loading={measurements.isPending}
          error={measurements.error}
          onRetry={() => void measurements.refetch()}
          dense
          empty={
            <EmptyState
              icon={Ruler}
              title={t('measurements.empty')}
              description={t('measurements.emptyHint')}
            />
          }
        />
      </section>

      {editing && (
        <MeasurementFormModal
          patientId={patient.id}
          measurement={editing === 'new' ? null : editing}
          lastHeightM={measurements.data?.[measurements.data.length - 1]?.heightM}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t('measurements.deleteTitle')}
        message={t('measurements.deleteConfirm', { date: formatDateOnly(deleting?.date) })}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success(t('measurements.deleted'));
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </div>
  );
}

/** Stat tiles: start, current, total change (colored by whether it moves toward the goal), visits. */
function SummaryTiles({
  progress,
  goal,
}: {
  progress: PatientProgress | undefined;
  goal: Patient['goal'];
}) {
  const { t } = useTranslation();
  if (!progress) return <Skeleton className="h-24 w-full rounded-2xl" />;

  const change = progress.change.weightKg;
  const good =
    change == null || change === 0
      ? null
      : goal === 'weight_loss'
        ? change < 0
        : goal === 'weight_gain'
          ? change > 0
          : null;
  const kg = t('common.kg');

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label={t('measurements.summary.start')}
        value={progress.start ? `${progress.start.weightKg} ${kg}` : '—'}
        note={
          progress.start
            ? t('measurements.summary.since', { date: formatDateOnly(progress.start.date) })
            : undefined
        }
        className="bg-pastel-blue"
      />
      <Tile
        label={t('measurements.summary.current')}
        value={progress.current ? `${progress.current.weightKg} ${kg}` : '—'}
        className="bg-pastel-green"
      />
      <Tile
        label={t('measurements.summary.change')}
        value={
          change == null ? (
            '—'
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                good === true && 'text-green-800',
                good === false && 'text-red-700',
              )}
            >
              {change > 0 ? (
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              ) : change < 0 ? (
                <ArrowDownRight className="h-5 w-5" aria-hidden />
              ) : null}
              <span dir="ltr">{`${change > 0 ? '+' : ''}${change} ${kg}`}</span>
            </span>
          )
        }
        className="bg-pastel-purple"
      />
      <Tile
        label={t('measurements.summary.visits')}
        value={String(progress.visits)}
        className="bg-pastel-orange"
      />
    </dl>
  );
}

function Tile({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl px-4 py-3', className)}>
      <dt className="text-xs font-semibold text-gray-600">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-gray-900">{value}</dd>
      {note && <dd className="text-xs text-gray-500">{note}</dd>}
    </div>
  );
}
