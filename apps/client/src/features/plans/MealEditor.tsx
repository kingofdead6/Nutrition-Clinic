import { ArrowDown, ArrowUp, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MEAL_TYPES, type MealType } from '@clinic/shared';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { FoodPicker } from './FoodPicker';
import { itemFromFood, itemTotals, mealStateTotals, type MealState } from './planState';

const fmt = (v: number) => (Math.round(v * 10) / 10).toString();

export function MealEditor({
  meal,
  index,
  count,
  readOnly,
  onChange,
  onRemove,
  onMove,
}: {
  meal: MealState;
  index: number;
  count: number;
  readOnly: boolean;
  onChange: (meal: MealState) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const { t } = useTranslation();
  const totals = mealStateTotals(meal);
  const mealLabel = t(`enums.mealType.${meal.mealType}`);

  return (
    <section className="rounded-xl border border-gray-200" aria-label={mealLabel}>
      <header className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
        <Select
          aria-label={t('plans.mealType')}
          value={meal.mealType}
          disabled={readOnly}
          onChange={(e) => onChange({ ...meal, mealType: e.target.value as MealType })}
          className="h-9 w-48 font-semibold"
        >
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m}>
              {t(`enums.mealType.${m}`)}
            </option>
          ))}
        </Select>
        <Input
          type="time"
          ltr
          aria-label={`${t('plans.mealTime')} — ${mealLabel}`}
          value={meal.time ?? ''}
          disabled={readOnly}
          onChange={(e) => onChange({ ...meal, time: e.target.value || null })}
          className="h-9 w-32"
        />
        <span className="ms-auto whitespace-nowrap text-xs text-gray-600" dir="ltr">
          <b className="text-sm text-gray-900">{Math.round(totals.calories)}</b> {t('common.kcal')}{' '}
          · P {fmt(totals.proteinG)} · C {fmt(totals.carbsG)} · F {fmt(totals.fatG)}
        </span>
        {!readOnly && (
          <div className="flex">
            <Button
              size="sm"
              variant="ghost"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              aria-label={`${t('common.moveUp')} — ${mealLabel}`}
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
              aria-label={`${t('common.moveDown')} — ${mealLabel}`}
            >
              <ArrowDown className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              onClick={onRemove}
              aria-label={`${t('plans.removeMeal')} — ${mealLabel}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        )}
      </header>

      <div className="space-y-2 p-3">
        {meal.items.length === 0 ? (
          <p className="text-center text-xs text-gray-400">{t('plans.noItems')}</p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">{mealLabel}</caption>
            <thead className="text-xs text-gray-500">
              <tr>
                <th scope="col" className="pb-1 text-start font-semibold">
                  {t('plans.item.food')}
                </th>
                <th scope="col" className="pb-1 text-start font-semibold">
                  {t('plans.item.quantity')}
                </th>
                <th scope="col" className="pb-1 text-end font-semibold">
                  {t('common.kcal')}
                </th>
                <th scope="col" className="hidden pb-1 text-end font-semibold sm:table-cell">
                  P
                </th>
                <th scope="col" className="hidden pb-1 text-end font-semibold sm:table-cell">
                  C
                </th>
                <th scope="col" className="hidden pb-1 text-end font-semibold sm:table-cell">
                  F
                </th>
                <th scope="col" className="w-8 pb-1">
                  <span className="sr-only">{t('common.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {meal.items.map((item) => {
                const n = itemTotals(item);
                return (
                  <tr key={item.key}>
                    <td className="py-1.5 font-medium text-gray-900">{item.foodName}</td>
                    <td className="py-1.5">
                      <span className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          ltr
                          aria-label={`${t('plans.item.quantity')} — ${item.foodName}`}
                          value={Number.isFinite(item.quantity) ? item.quantity : ''}
                          disabled={readOnly}
                          onChange={(e) =>
                            onChange({
                              ...meal,
                              items: meal.items.map((i) =>
                                i.key === item.key
                                  ? {
                                      ...i,
                                      quantity:
                                        e.target.value === '' ? Number.NaN : Number(e.target.value),
                                    }
                                  : i,
                              ),
                            })
                          }
                          className="h-8 w-20"
                        />
                        <span className="text-xs text-gray-500">
                          {t(`enums.servingUnit.${item.unit}`)}
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 text-end font-semibold tabular-nums">
                      {Math.round(n.calories)}
                    </td>
                    <td className="hidden py-1.5 text-end tabular-nums text-gray-600 sm:table-cell">
                      {fmt(n.proteinG)}
                    </td>
                    <td className="hidden py-1.5 text-end tabular-nums text-gray-600 sm:table-cell">
                      {fmt(n.carbsG)}
                    </td>
                    <td className="hidden py-1.5 text-end tabular-nums text-gray-600 sm:table-cell">
                      {fmt(n.fatG)}
                    </td>
                    <td className="py-1.5 text-end">
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...meal,
                              items: meal.items.filter((i) => i.key !== item.key),
                            })
                          }
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-700"
                          aria-label={t('plans.item.remove', { name: item.foodName })}
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!readOnly && (
          <FoodPicker
            label={`${t('plans.addFood')} — ${mealLabel}`}
            onPick={(food) => onChange({ ...meal, items: [...meal.items, itemFromFood(food)] })}
          />
        )}
      </div>
    </section>
  );
}
