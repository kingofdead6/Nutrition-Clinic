import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  ageOn,
  dayTotals,
  formatDateOnly,
  macroGrams,
  mealTotals,
  type DietPlanWithPatient,
  type PlanDay,
} from '@clinic/shared';
import { usePatientPlans, useDietPlan } from '../../api/dietPlans';
import { useMeasurements, useProgress } from '../../api/measurements';
import { usePatient } from '../../api/patients';
import { usePrescription } from '../../api/prescriptions';
import { useSettings } from '../../api/settings';
import { MetricLineChart, WaistHipChart } from '../../components/charts/ProgressCharts';
import { useClinicToday } from '../../lib/useClinicToday';
import { BmiBadge } from '../patients/BmiBadge';
import { InfoList } from '../patients/ProfileTab';
import { Letterhead, PrintFooter, PrintSection, PrintSheet } from './PrintLayout';
import { PrescriptionDocument } from './PrescriptionDocument';

export function PrintPrescriptionPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const rx = usePrescription(id);
  const settings = useSettings();
  return (
    <PrintSheet
      title={`${t('prescriptions.editTitle')} — ${rx.data?.patient?.fullName ?? ''}`}
      ready={!!rx.data && !!settings.data}
      error={rx.error}
      onRetry={() => void rx.refetch()}
    >
      {rx.data && <PrescriptionDocument doc={rx.data} patient={rx.data.patient} />}
    </PrintSheet>
  );
}

const fmt = (v: number) => (Math.round(v * 10) / 10).toString();

function PlanDayTable({ day, plan }: { day: PlanDay; plan: DietPlanWithPatient }) {
  const { t } = useTranslation();
  const total = dayTotals(day);
  const cell = 'border border-gray-300 px-2 py-1';
  return (
    <table className="mb-4 w-full border-collapse text-[12px]">
      {day.day !== 'daily' && (
        <caption className="mb-1 text-start text-sm font-bold text-brand-900">
          {t(`enums.weekday.${day.day}`)}
        </caption>
      )}
      <thead className="bg-brand-50">
        <tr>
          <th scope="col" className={`${cell} text-start`}>
            {t('print.plan.meal')}
          </th>
          <th scope="col" className={`${cell} text-start`}>
            {t('print.plan.food')}
          </th>
          <th scope="col" className={`${cell} text-start`}>
            {t('print.plan.quantity')}
          </th>
          <th scope="col" className={`${cell} text-end`}>
            {t('common.kcal')}
          </th>
          <th scope="col" className={`${cell} text-end`}>
            P
          </th>
          <th scope="col" className={`${cell} text-end`}>
            C
          </th>
          <th scope="col" className={`${cell} text-end`}>
            F
          </th>
        </tr>
      </thead>
      <tbody>
        {day.meals.map((meal, mi) => {
          const mt = mealTotals(meal);
          const rows = Math.max(1, meal.items.length) + 1;
          return (
            <Fragment key={mi}>
              {(meal.items.length ? meal.items : [null]).map((item, ii) => (
                <tr key={ii} className="break-inside-avoid">
                  {ii === 0 && (
                    <th
                      scope="rowgroup"
                      rowSpan={rows}
                      className={`${cell} w-28 bg-gray-50 text-start align-top font-bold`}
                    >
                      {t(`enums.mealType.${meal.mealType}`)}
                      {meal.time && (
                        <span className="block text-[11px] font-normal text-gray-500" dir="ltr">
                          {meal.time}
                        </span>
                      )}
                    </th>
                  )}
                  <td className={cell}>{item?.foodName ?? '—'}</td>
                  <td className={cell}>
                    {item ? `${item.quantity} ${t(`enums.servingUnit.${item.unit}`)}` : ''}
                  </td>
                  <td className={`${cell} text-end tabular-nums`}>
                    {item ? Math.round(item.calories) : ''}
                  </td>
                  <td className={`${cell} text-end tabular-nums`}>
                    {item ? fmt(item.proteinG) : ''}
                  </td>
                  <td className={`${cell} text-end tabular-nums`}>
                    {item ? fmt(item.carbsG) : ''}
                  </td>
                  <td className={`${cell} text-end tabular-nums`}>{item ? fmt(item.fatG) : ''}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className={cell} colSpan={2}>
                  {t('print.plan.total')}
                </td>
                <td className={`${cell} text-end tabular-nums`}>{Math.round(mt.calories)}</td>
                <td className={`${cell} text-end tabular-nums`}>{fmt(mt.proteinG)}</td>
                <td className={`${cell} text-end tabular-nums`}>{fmt(mt.carbsG)}</td>
                <td className={`${cell} text-end tabular-nums`}>{fmt(mt.fatG)}</td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="bg-brand-50 font-bold">
          <td className={cell} colSpan={3}>
            {t('print.plan.dayTotal')} (
            {t('plans.progress.of', {
              value: Math.round(total.calories),
              target: plan.dailyCalories,
            })}
            )
          </td>
          <td className={`${cell} text-end tabular-nums`}>{Math.round(total.calories)}</td>
          <td className={`${cell} text-end tabular-nums`}>{fmt(total.proteinG)}</td>
          <td className={`${cell} text-end tabular-nums`}>{fmt(total.carbsG)}</td>
          <td className={`${cell} text-end tabular-nums`}>{fmt(total.fatG)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export function PrintDietPlanPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const plan = useDietPlan(id);
  const settings = useSettings();
  const patient = usePatient(plan.data?.patientId ?? undefined);
  const today = useClinicToday();
  const p = plan.data;
  const ready = !!p && !!settings.data && (!p.patientId || !!patient.data);
  const grams = p ? macroGrams(p.dailyCalories, p.macroTargets) : null;

  return (
    <PrintSheet
      title={`${t('print.plan.title')} — ${p?.title ?? ''}`}
      ready={ready}
      error={plan.error}
      onRetry={() => void plan.refetch()}
    >
      {p && grams && (
        <article>
          <Letterhead date={today} />
          <h1 className="mb-1 text-center text-lg font-extrabold text-brand-900">{p.title}</h1>
          <p className="mb-4 text-center text-sm text-gray-600">{t('print.plan.title')}</p>
          <div className="mb-4 grid grid-cols-2 gap-x-8 rounded-lg bg-gray-50 px-4 py-2 text-sm">
            {patient.data && (
              <p>
                <span className="text-gray-500">{t('print.patient')}: </span>
                <b>{patient.data.fullName}</b> (
                {`${ageOn(patient.data.birthDate, today)} ${t('common.years')}`})
              </p>
            )}
            <p>
              <span className="text-gray-500">{t('print.plan.goal')}: </span>
              <b>{t(`enums.goal.${p.goal}`)}</b>
            </p>
            <p>
              <span className="text-gray-500">{t('print.plan.calories')}: </span>
              <b>{`${p.dailyCalories} ${t('common.kcal')}`}</b>
            </p>
            <p>
              <span className="text-gray-500">{t('print.plan.macros')}: </span>
              <b dir="ltr">{`P ${p.macroTargets.proteinPct}% (${grams.proteinG} g) · C ${p.macroTargets.carbsPct}% (${grams.carbsG} g) · F ${p.macroTargets.fatPct}% (${grams.fatG} g)`}</b>
            </p>
            <p className="col-span-2">
              <span className="text-gray-500">{t('print.plan.period')}: </span>
              <b dir="ltr">{`${formatDateOnly(p.startDate)} → ${formatDateOnly(p.endDate)}`}</b> (
              {t('plans.weeks', { count: p.durationWeeks })})
            </p>
          </div>
          {p.days.map((d) => (
            <PlanDayTable key={d.day} day={d} plan={p} />
          ))}
          {p.notes && (
            <PrintSection title={t('print.plan.notes')}>
              <p className="whitespace-pre-line">{p.notes}</p>
            </PrintSection>
          )}
          <PrintFooter />
        </article>
      )}
    </PrintSheet>
  );
}

export function PrintPatientSummaryPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const today = useClinicToday();
  const patient = usePatient(id);
  const measurements = useMeasurements(id ?? '');
  const progress = useProgress(id ?? '');
  const plans = usePatientPlans(id);
  const settings = useSettings();
  const p = patient.data;
  const visits = measurements.data ?? [];
  const latest = visits[visits.length - 1];
  const active = plans.data?.find((x) => x.isActive);
  const ready = !!p && !!measurements.data && !!progress.data && !!plans.data && !!settings.data;
  const none = t('common.none');

  return (
    <PrintSheet
      title={`${t('print.summary.title')} — ${p?.fullName ?? ''}`}
      ready={ready}
      error={patient.error}
      onRetry={() => void patient.refetch()}
    >
      {p && progress.data && (
        <article>
          <Letterhead date={today} />
          <h1 className="mb-4 text-center text-lg font-extrabold text-brand-900">
            {t('print.summary.title')} — {p.fullName}
          </h1>
          <div className="grid grid-cols-2 gap-6">
            <PrintSection title={t('print.summary.identity')}>
              <InfoList
                rows={[
                  [t('patients.fields.fileNumber'), <span dir="ltr">{p.fileNumber}</span>],
                  [t('patients.fields.age'), `${ageOn(p.birthDate, today)} ${t('common.years')}`],
                  [t('patients.fields.gender'), t(`enums.gender.${p.gender}`)],
                  [t('patients.fields.phone'), <span dir="ltr">{p.phone}</span>],
                  [t('patients.fields.goal'), t(`enums.goal.${p.goal}`)],
                  [t('patients.fields.targetWeightKg'), p.targetWeightKg ?? none],
                ]}
              />
            </PrintSection>
            <PrintSection title={t('print.summary.current')}>
              {latest ? (
                <InfoList
                  rows={[
                    [
                      t('measurements.fields.date'),
                      <span dir="ltr">{formatDateOnly(latest.date)}</span>,
                    ],
                    [t('measurements.short.weight'), `${latest.weightKg} ${t('common.kg')}`],
                    [t('measurements.short.height'), `${latest.heightM} ${t('common.m')}`],
                    [
                      t('measurements.fields.bmi'),
                      <span className="inline-flex items-center gap-2">
                        {latest.bmi} <BmiBadge category={latest.bmiCategory} />
                      </span>,
                    ],
                    [t('measurements.fields.whr'), latest.waistHipRatio ?? none],
                    [
                      t('measurements.short.fat'),
                      latest.bodyFatPct != null ? `${latest.bodyFatPct}%` : none,
                    ],
                  ]}
                />
              ) : (
                <p className="text-gray-500">{t('patients.profile.noMeasurements')}</p>
              )}
            </PrintSection>
          </div>

          {visits.length > 0 && (
            <>
              <div className="mb-4 grid break-inside-avoid grid-cols-2 gap-4">
                <MetricLineChart
                  data={progress.data.series}
                  metric="weightKg"
                  title={t('measurements.charts.weight')}
                  unit={t('common.kg')}
                  height={180}
                />
                <WaistHipChart data={progress.data.series} height={180} />
              </div>
              <PrintSection title={t('print.summary.progress')}>
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-brand-50">
                    <tr>
                      {[
                        t('measurements.fields.date'),
                        t('measurements.short.weight'),
                        t('measurements.short.bmi'),
                        t('measurements.short.waist'),
                        t('measurements.short.hip'),
                        t('measurements.short.whr'),
                        t('measurements.short.fat'),
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="border border-gray-300 px-2 py-1 text-start"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((m) => (
                      <tr key={m.id} className="break-inside-avoid">
                        <td className="border border-gray-300 px-2 py-1" dir="ltr">
                          {formatDateOnly(m.date)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{m.weightKg}</td>
                        <td className="border border-gray-300 px-2 py-1">{m.bmi}</td>
                        <td className="border border-gray-300 px-2 py-1">{m.waistCm ?? '—'}</td>
                        <td className="border border-gray-300 px-2 py-1">{m.hipCm ?? '—'}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          {m.waistHipRatio ?? '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {m.bodyFatPct != null ? `${m.bodyFatPct}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {progress.data.change.weightKg != null && (
                  <p className="mt-2 text-sm">
                    {t('measurements.summary.change')}:{' '}
                    <b dir="ltr">{`${progress.data.change.weightKg > 0 ? '+' : ''}${progress.data.change.weightKg} ${t('common.kg')}`}</b>
                  </p>
                )}
              </PrintSection>
            </>
          )}

          <div className="grid grid-cols-2 gap-6">
            <PrintSection title={t('print.summary.plan')}>
              {active ? (
                <InfoList
                  rows={[
                    [t('plans.fields.title'), active.title],
                    [
                      t('plans.fields.dailyCalories'),
                      `${active.dailyCalories} ${t('common.kcal')}`,
                    ],
                    [
                      t('print.plan.period'),
                      <span dir="ltr">{`${formatDateOnly(active.startDate)} → ${formatDateOnly(active.endDate)}`}</span>,
                    ],
                  ]}
                />
              ) : (
                <p className="text-gray-500">{t('print.summary.noPlan')}</p>
              )}
            </PrintSection>
            <PrintSection title={t('print.summary.health')}>
              <InfoList
                rows={[
                  [
                    t('patients.fields.chronicConditions'),
                    p.chronicConditions.length
                      ? p.chronicConditions.map((c) => t(`enums.chronicCondition.${c}`)).join('، ')
                      : none,
                  ],
                  [
                    t('patients.fields.allergies'),
                    p.allergies.length ? p.allergies.join('، ') : none,
                  ],
                  [
                    t('patients.fields.medications'),
                    p.medications.length ? p.medications.join('، ') : none,
                  ],
                  [t('patients.fields.activityLevel'), t(`enums.activityLevel.${p.activityLevel}`)],
                ]}
              />
            </PrintSection>
          </div>
          <p className="mt-4 text-[11px] text-gray-500">
            {t('print.summary.generatedOn', { date: formatDateOnly(today) })}
          </p>
          <PrintFooter />
        </article>
      )}
    </PrintSheet>
  );
}
