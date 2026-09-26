import { useTranslation } from 'react-i18next';
import type { BmiCategory } from '@shared';
import { cn } from '../../lib/cn';

const TONE: Record<BmiCategory, string> = {
  underweight: 'bg-pastel-blue text-status-blue',
  normal: 'bg-pastel-green text-status-green',
  overweight: 'bg-pastel-orange text-status-orange',
  obese_1: 'bg-pastel-red text-status-red',
  obese_2: 'bg-pastel-red text-status-red',
  obese_3: 'bg-pastel-red text-status-red',
};

/** WHO BMI category, always written out (never color alone). */
export function BmiBadge({ category }: { category: BmiCategory }) {
  const { t } = useTranslation();
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', TONE[category])}>
      {t(`enums.bmiCategory.${category}`)}
    </span>
  );
}
