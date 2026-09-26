import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Skeleton } from './States';

export type StatTone = 'green' | 'blue' | 'purple' | 'red';

const TONES: Record<StatTone, { card: string; circle: string }> = {
  green: { card: 'bg-pastel-green', circle: 'bg-brand-600' },
  blue: { card: 'bg-pastel-blue', circle: 'bg-blue-600' },
  purple: { card: 'bg-pastel-purple', circle: 'bg-violet-600' },
  red: { card: 'bg-pastel-red', circle: 'bg-red-600' },
};

/**
 * KPI tile from the mockup: soft pastel card, icon in a colored circle, label, value
 * (proportional figures) and an optional note. Text stays in ink colors.
 */
export function StatCard({
  label,
  value,
  unit,
  note,
  icon: Icon,
  tone,
  loading = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: string;
  icon: LucideIcon;
  tone: StatTone;
  loading?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-4 rounded-2xl p-5 shadow-card', TONES[tone].card)}>
      <span
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-sm',
          TONES[tone].circle,
        )}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-20" />
        ) : (
          <p className="text-3xl font-extrabold leading-tight text-gray-900">
            {value}
            {unit && <span className="ms-1 text-base font-bold text-gray-700">{unit}</span>}
          </p>
        )}
        {note && !loading && <p className="truncate text-xs text-gray-600">{note}</p>}
      </div>
    </div>
  );
}
