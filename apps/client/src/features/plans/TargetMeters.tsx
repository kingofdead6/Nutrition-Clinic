import { useTranslation } from 'react-i18next';
import { macroGrams, type MacroTargets, type NutritionTotals } from '@shared';
import { cn } from '../../lib/cn';

/**
 * Progress vs target. The fill carries the state and the track is a lighter step of the
 * same ramp: under (< 90 %) light green, on target (90–110 %) green, over (> 110 %)
 * orange. The numbers are always printed, so state never relies on color alone.
 */
function Meter({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const { t } = useTranslation();
  const ratio = target > 0 ? value / target : 0;
  const state = ratio > 1.1 ? 'over' : ratio >= 0.9 ? 'ok' : 'under';
  const pct = Math.round(ratio * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="tabular-nums text-gray-900" dir="ltr">
          {t('plans.progress.of', { value: Math.round(value), target })} {unit}
          <span className="ms-1 text-gray-500">({pct}%)</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${Math.round(value)} / ${target} ${unit} (${pct}%)`}
        className={cn(
          'h-2.5 overflow-hidden rounded-full',
          state === 'over' ? 'bg-orange-100' : 'bg-brand-100',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            state === 'over' ? 'bg-orange-500' : state === 'ok' ? 'bg-brand-600' : 'bg-brand-400',
          )}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function TargetMeters({
  totals,
  dailyCalories,
  macroTargets,
  className,
}: {
  totals: NutritionTotals;
  dailyCalories: number;
  macroTargets: MacroTargets;
  className?: string;
}) {
  const { t } = useTranslation();
  const grams = macroGrams(dailyCalories || 0, macroTargets);
  const g = t('common.g');
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <Meter
        label={t('plans.progress.calories')}
        value={totals.calories}
        target={dailyCalories || 0}
        unit={t('common.kcal')}
      />
      <Meter
        label={t('plans.progress.protein')}
        value={totals.proteinG}
        target={grams.proteinG}
        unit={g}
      />
      <Meter
        label={t('plans.progress.carbs')}
        value={totals.carbsG}
        target={grams.carbsG}
        unit={g}
      />
      <Meter label={t('plans.progress.fat')} value={totals.fatG} target={grams.fatG} unit={g} />
    </div>
  );
}
