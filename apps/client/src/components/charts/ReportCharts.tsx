import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OUTCOME_BUCKETS, type OutcomeBucket } from '@shared';
import { ChartCard } from './ProgressCharts';
import { CHART } from './tokens';

/**
 * Diverging scale for weight outcomes: a blue arm (loss) and a red arm (gain), each a
 * validated one-hue ordinal ramp (monotone lightness, light end ≥ 2:1 on white), with a
 * neutral gray midpoint for "stable". Every bar carries a visible count label (the gray
 * midpoint is light), and a table view exists.
 */
const OUTCOME_COLORS: Record<OutcomeBucket, string> = {
  lost5: '#184f95',
  lost3: '#2a78d6',
  lost1: '#86b6ef',
  stable: '#c3c2b7',
  gained1: '#f2a09f',
  gained3: '#e34948',
  gained5: '#a92f2e',
};

const axis = {
  tick: { fill: CHART.muted, fontSize: 12, fontFamily: CHART.font },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
} as const;

/** `YYYY-MM` → short Arabic month name (+ 2-digit year in January or on the first bar). */
function useMonthLabel() {
  const { i18n } = useTranslation();
  const fmt = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, {
    month: 'short',
    timeZone: 'UTC',
  });
  return (month: string, index = 1) => {
    const [y, m] = month.split('-').map(Number) as [number, number];
    const name = fmt.format(new Date(Date.UTC(y, m - 1, 1)));
    return index === 0 || m === 1 ? `${name} ${String(y).slice(2)}` : name;
  };
}

interface TooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ value?: unknown }>;
}

function CountTooltip({ active, label, payload, title }: TooltipProps & { title: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/10">
      <p className="mb-0.5 text-gray-500">{String(label)}</p>
      <p>
        <b className="text-sm text-gray-900">{String(payload[0]?.value ?? 0)}</b>{' '}
        <span className="text-gray-500">{title}</span>
      </p>
    </div>
  );
}

/** One measure per month: single-series columns (≤ 24 px, 4 px rounded caps), no legend. */
export function MonthlyColumns({
  data,
  dataKey,
  title,
  color,
  height = 220,
}: {
  data: ReadonlyArray<{ month: string; newPatients: number; visits: number }>;
  dataKey: 'newPatients' | 'visits';
  title: string;
  color: string;
  height?: number;
}) {
  const label = useMonthLabel();
  const rows = data.map((d, i) => ({ ...d, label: label(d.month, i) }));
  return (
    <ChartCard title={title}>
      <div dir="ltr" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 20, right: 12, bottom: 4, left: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...axis} interval={0} />
            <YAxis {...axis} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(17,24,39,0.04)' }}
              content={(p: TooltipProps) => <CountTooltip {...p} title={title} />}
            />
            <Bar
              dataKey={dataKey}
              fill={color}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/** Weight-change histogram on a diverging scale, loss → gain, with count labels on every bar. */
export function OutcomeHistogram({
  buckets,
  title,
  subtitle,
  height = 240,
}: {
  buckets: Record<OutcomeBucket, number>;
  title: string;
  subtitle?: string;
  height?: number;
}) {
  const { t } = useTranslation();
  const rows = OUTCOME_BUCKETS.map((b) => ({
    key: b,
    label: t(`reports.buckets.${b}`),
    count: buckets[b],
  }));
  return (
    <ChartCard
      title={title}
      legend={subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
    >
      <div dir="ltr" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 22, right: 8, bottom: 4, left: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...axis} interval={0} tick={{ ...axis.tick, fontSize: 11 }} />
            <YAxis {...axis} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(17,24,39,0.04)' }}
              content={(p: TooltipProps) => (
                <CountTooltip {...p} title={t('reports.byGoal.patients')} />
              )}
            />
            <Bar dataKey="count" maxBarSize={36} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.key} fill={OUTCOME_COLORS[r.key]} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                fill={CHART.ink}
                fontSize={12}
                fontWeight={700}
                fontFamily={CHART.font}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/**
 * Nominal categories (appointment statuses) as horizontal bars in one color, drawn in
 * HTML: label, bar, value at the tip. Readable, printable and screen-reader friendly.
 */
export function HorizontalBars({
  title,
  rows,
}: {
  title: string;
  rows: ReadonlyArray<{ key: string; label: string; value: number }>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ChartCard title={title}>
      <dl className="space-y-2.5 py-1">
        {rows.map((r) => (
          <div
            key={r.key}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 text-sm"
          >
            <dt className="truncate text-gray-700">{r.label}</dt>
            <dd className="flex items-center gap-2">
              <span
                className="h-3.5 rounded-e"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  minWidth: r.value ? 4 : 0,
                  background: CHART.series1,
                }}
                aria-hidden
              />
              <span className="font-bold tabular-nums text-gray-900">{r.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </ChartCard>
  );
}
