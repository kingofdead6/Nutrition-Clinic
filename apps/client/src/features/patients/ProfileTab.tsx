import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ageOn, formatDateOnly, type Patient } from '@clinic/shared';
import { useMeasurements, useProgress } from '../../api/measurements';
import { MetricLineChart, WaistHipChart } from '../../components/charts/ProgressCharts';
import { Card, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/States';
import { formatDate } from '../../lib/dates';
import { useClinicToday } from '../../lib/useClinicToday';
import { BmiBadge } from './BmiBadge';

/** Full profile tab of the patient page. The cards are reused by the dashboard panel. */
export function ProfileTab({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <BasicInfoCard patient={patient} />
      <CurrentMeasurementsCard patientId={patient.id} />
      <WeightChart patientId={patient.id} />
      <WaistHipCard patientId={patient.id} />
      <HealthCard patient={patient} />
      <GoalsCard patient={patient} />
    </div>
  );
}

function useNone() {
  const { t } = useTranslation();
  return <span className="text-gray-400">{t('common.none')}</span>;
}

export function BasicInfoCard({
  patient: p,
  compact = false,
}: {
  patient: Patient;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const today = useClinicToday();
  const none = useNone();
  const f = (k: string) => t(`patients.fields.${k}` as 'patients.fields.phone');
  const rows: Array<[string, ReactNode]> = [
    [f('fileNumber'), <span dir="ltr">{p.fileNumber}</span>],
    [f('age'), `${ageOn(p.birthDate, today)} ${t('common.years')}`],
    [f('birthDate'), <span dir="ltr">{formatDateOnly(p.birthDate)}</span>],
    [f('gender'), t(`enums.gender.${p.gender}`)],
    [f('phone'), <span dir="ltr">{p.phone}</span>],
    [f('goal'), t(`enums.goal.${p.goal}`)],
  ];
  if (!compact) {
    rows.push(
      [f('email'), p.email ? <span dir="ltr">{p.email}</span> : none],
      [f('address'), p.address || none],
      [f('occupation'), p.occupation || none],
      [f('registeredOn'), <span dir="ltr">{formatDate(p.createdAt)}</span>],
    );
  }
  return (
    <Card className="ring-1 ring-gray-100">
      <CardTitle>{t('patients.profile.basicInfo')}</CardTitle>
      <InfoList rows={rows} />
    </Card>
  );
}

export function CurrentMeasurementsCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const measurements = useMeasurements(patientId);
  const none = useNone();
  const latest = measurements.data?.[measurements.data.length - 1];
  return (
    <Card className="ring-1 ring-gray-100">
      <CardTitle
        actions={
          latest && (
            <span className="text-xs text-gray-500">
              {t('patients.profile.lastMeasured', { date: formatDateOnly(latest.date) })}
            </span>
          )
        }
      >
        {t('patients.profile.currentMeasurements')}
      </CardTitle>
      {measurements.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : !latest ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {t('patients.profile.noMeasurements')}
        </p>
      ) : (
        <InfoList
          rows={[
            [t('measurements.short.weight'), `${latest.weightKg} ${t('common.kg')}`],
            [t('measurements.short.height'), `${latest.heightM} ${t('common.m')}`],
            [
              t('measurements.fields.bmi'),
              <span className="inline-flex items-center gap-2">
                <span className="font-bold">{latest.bmi}</span>
                <BmiBadge category={latest.bmiCategory} />
              </span>,
            ],
            [
              t('measurements.short.waist'),
              latest.waistCm != null ? `${latest.waistCm} ${t('common.cm')}` : none,
            ],
            [
              t('measurements.short.hip'),
              latest.hipCm != null ? `${latest.hipCm} ${t('common.cm')}` : none,
            ],
            [t('measurements.fields.whr'), latest.waistHipRatio ?? none],
            [
              t('measurements.short.fat'),
              latest.bodyFatPct != null ? `${latest.bodyFatPct}%` : none,
            ],
          ]}
        />
      )}
    </Card>
  );
}

const ChartSkeleton = () => <Skeleton className="h-[268px] w-full rounded-2xl" />;

export function WeightChart({ patientId, height }: { patientId: string; height?: number }) {
  const { t } = useTranslation();
  const progress = useProgress(patientId);
  if (!progress.data) return <ChartSkeleton />;
  return (
    <MetricLineChart
      data={progress.data.series}
      metric="weightKg"
      title={t('measurements.charts.weight')}
      unit={t('common.kg')}
      height={height}
    />
  );
}

export function WaistHipCard({ patientId, height }: { patientId: string; height?: number }) {
  const progress = useProgress(patientId);
  if (!progress.data) return <ChartSkeleton />;
  return <WaistHipChart data={progress.data.series} height={height} />;
}

export function HealthCard({ patient: p }: { patient: Patient }) {
  const { t } = useTranslation();
  const none = useNone();
  const f = (k: string) => t(`patients.fields.${k}` as 'patients.fields.phone');
  return (
    <Card className="ring-1 ring-gray-100">
      <CardTitle>{t('patients.profile.healthInfo')}</CardTitle>
      <InfoList
        rows={[
          [
            f('chronicConditions'),
            p.chronicConditions.length
              ? p.chronicConditions.map((c) => t(`enums.chronicCondition.${c}`)).join('، ')
              : none,
          ],
          [f('allergies'), p.allergies.length ? p.allergies.join('، ') : none],
          [f('medications'), p.medications.length ? p.medications.join('، ') : none],
          [f('activityLevel'), t(`enums.activityLevel.${p.activityLevel}`)],
          [
            f('medicalNotes'),
            p.medicalNotes ? <span className="whitespace-pre-line">{p.medicalNotes}</span> : none,
          ],
        ]}
      />
    </Card>
  );
}

export function GoalsCard({ patient: p }: { patient: Patient }) {
  const { t } = useTranslation();
  const measurements = useMeasurements(p.id);
  const current = measurements.data?.[measurements.data.length - 1]?.weightKg;
  const remaining =
    p.targetWeightKg != null && current != null
      ? Math.round((current - p.targetWeightKg) * 10) / 10
      : null;
  return (
    <Card className="ring-1 ring-gray-100">
      <CardTitle>{t('patients.profile.goals')}</CardTitle>
      <InfoList
        rows={[
          [t('patients.fields.goal'), t(`enums.goal.${p.goal}`)],
          [
            t('patients.fields.targetWeightKg'),
            p.targetWeightKg != null ? `${p.targetWeightKg} ${t('common.kg')}` : t('common.none'),
          ],
          [
            t('patients.profile.toTarget'),
            remaining == null
              ? t('common.none')
              : Math.abs(remaining) < 0.05
                ? t('patients.profile.reached')
                : `${Math.abs(remaining)} ${t('common.kg')}`,
          ],
        ]}
      />
    </Card>
  );
}

export function InfoList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="divide-y divide-gray-100 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 py-2">
          <dt className="shrink-0 text-gray-500">{label}</dt>
          <dd className="text-end font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
