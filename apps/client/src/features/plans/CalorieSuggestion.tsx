import { Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ageOn, suggestCalories, type PatientGoal } from '@shared';
import { useMeasurements } from '../../api/measurements';
import { usePatient } from '../../api/patients';
import { Button } from '../../components/ui/Button';
import { useClinicToday } from '../../lib/useClinicToday';

/** Mifflin-St Jeor suggestion from the patient's latest visit. Shown only; never applied automatically. */
export function CalorieSuggestion({
  patientId,
  goal,
  onUse,
}: {
  patientId: string | undefined;
  goal: PatientGoal;
  onUse: (kcal: number) => void;
}) {
  const { t } = useTranslation();
  const today = useClinicToday();
  const patient = usePatient(patientId);
  const measurements = useMeasurements(patientId ?? '');
  const latest = measurements.data?.[measurements.data.length - 1];

  const box = 'rounded-xl bg-pastel-blue p-4 text-sm';
  if (!patientId || !patient.data || !latest) {
    return (
      <div className={box}>
        <p className="flex items-center gap-2 font-bold text-gray-900">
          <Calculator className="h-4 w-4" aria-hidden />
          {t('plans.suggestion.title')}
        </p>
        <p className="mt-1 text-gray-600">{t('plans.suggestion.needs')}</p>
      </div>
    );
  }

  const p = patient.data;
  const s = suggestCalories({
    gender: p.gender,
    weightKg: latest.weightKg,
    heightM: latest.heightM,
    age: ageOn(p.birthDate, today),
    activityLevel: p.activityLevel,
    goal,
  });
  const kcal = t('common.kcal');
  const rows: Array<[string, string]> = [
    [t('plans.suggestion.bmr'), `${s.bmr} ${kcal}`],
    [
      t('plans.suggestion.factor'),
      `× ${s.activityFactor} (${t(`enums.activityLevel.${p.activityLevel}`)})`,
    ],
    [t('plans.suggestion.tdee'), `${s.tdee} ${kcal}`],
    [t('plans.suggestion.adjustment'), `${s.adjustment > 0 ? '+' : ''}${s.adjustment} ${kcal}`],
  ];

  return (
    <div className={box}>
      <p className="flex items-center gap-2 font-bold text-gray-900">
        <Calculator className="h-4 w-4" aria-hidden />
        {t('plans.suggestion.title')}
      </p>
      <dl className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-gray-600">{label}</dt>
            <dd className="font-semibold text-gray-900" dir="ltr">
              {value}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-blue-200 pt-1">
          <dt className="font-bold text-gray-900">{t('plans.suggestion.suggested')}</dt>
          <dd
            className="text-base font-extrabold text-gray-900"
            dir="ltr"
          >{`${s.suggested} ${kcal}`}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-gray-500">{t('plans.suggestion.note')}</p>
      <Button size="sm" variant="secondary" className="mt-2" onClick={() => onUse(s.suggested)}>
        {t('plans.suggestion.use')}
      </Button>
    </div>
  );
}
