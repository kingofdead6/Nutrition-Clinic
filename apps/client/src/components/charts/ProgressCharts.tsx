import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDateOnly, type ProgressPoint } from '@clinic/shared';
import { CHART } from './tokens';

const shortDate = (date: string) => formatDateOnly(date).slice(5); // MM/dd
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const axisProps = {
  tick: { fill: CHART.muted, fontSize: 12, fontFamily: CHART.font },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
} as const;

export function ChartCard({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="rounded-2xl bg-white p-4 shadow-card">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">{title}</span>
        {legend}
      </figcaption>
      {children}
    </figure>
  );
}

interface TooltipRow {
  name: string;
  value: number;
  color: string;
  unit?: string;
}

/** Value first (strong), series name second, keyed by a short line in the series color. */
function TooltipBox({ label, rows }: { label: string; rows: TooltipRow[] }) {
  return (
    <div dir="rtl" className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/10">
      <p className="mb-1 text-gray-500">{formatDateOnly(label)}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-3 rounded"
            style={{ background: r.color }}
            aria-hidden
          />
          <span className="text-sm font-bold text-gray-900">
            {fmt(r.value)}
            {r.unit && <span className="ms-0.5 text-xs font-normal text-gray-500">{r.unit}</span>}
          </span>
          <span className="text-gray-500">{r.name}</span>
        </p>
      ))}
    </div>
  );
}

interface RechartsTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ value?: unknown; dataKey?: unknown; color?: string }>;
}

function NotEnough() {
  const { t } = useTranslation();
  return (
    <p className="flex h-[220px] items-center justify-center text-sm text-gray-500">
      {t('measurements.charts.notEnough')}
    </p>
  );
}

/**
 * One metric over visits. Single series → no legend box (the title names it);
 * the latest value is labeled directly at the line end.
 */
export function MetricLineChart({
  data,
  metric,
  title,
  unit,
  height = 220,
}: {
  data: readonly ProgressPoint[];
  metric: 'weightKg' | 'bmi' | 'bodyFatPct';
  title: string;
  unit?: string;
  height?: number;
}) {
  const points = data.filter((p) => p[metric] != null);
  const lastIndex = points.length - 1;

  return (
    <ChartCard title={title}>
      {points.length === 0 ? (
        <NotEnough />
      ) : (
        // Charts keep a left-to-right time axis inside the RTL page (like the mockup's Excel charts).
        <div dir="ltr" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 22, right: 28, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                {...axisProps}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                {...axisProps}
                width={40}
                domain={[(min: number) => Math.floor(min - 2), (max: number) => Math.ceil(max + 2)]}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
                content={(p: RechartsTooltipProps) =>
                  p.active && p.payload?.length ? (
                    <TooltipBox
                      label={String(p.label)}
                      rows={[
                        {
                          name: title,
                          value: Number(p.payload[0]?.value),
                          color: CHART.series1,
                          unit,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={CHART.series1}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: CHART.series1, stroke: CHART.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: CHART.series1, stroke: CHART.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey={metric}
                  content={(props: {
                    x?: number | string;
                    y?: number | string;
                    value?: unknown;
                    index?: number;
                  }) =>
                    props.index === lastIndex ? (
                      <text
                        x={Number(props.x)}
                        y={Number(props.y) - 10}
                        textAnchor="middle"
                        fill={CHART.ink}
                        fontSize={12}
                        fontWeight={700}
                        fontFamily={CHART.font}
                      >
                        {fmt(Number(props.value))}
                      </text>
                    ) : null
                  }
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

/** Waist vs hip per visit: grouped columns, legend + tooltip (two series). */
export function WaistHipChart({
  data,
  height = 220,
}: {
  data: readonly ProgressPoint[];
  height?: number;
}) {
  const { t } = useTranslation();
  const points = data.filter((p) => p.waistCm != null || p.hipCm != null);
  const waist = t('measurements.charts.waist');
  const hip = t('measurements.charts.hip');

  const legend = (
    <ul className="flex items-center gap-3 text-xs text-gray-600">
      {[
        { label: waist, color: CHART.series1 },
        { label: hip, color: CHART.series2 },
      ].map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );

  return (
    <ChartCard title={t('measurements.charts.waistHip')} legend={legend}>
      {points.length === 0 ? (
        <NotEnough />
      ) : (
        <div dir="ltr" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={points}
              margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
              barGap={2}
              barCategoryGap="30%"
            >
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} />
              <YAxis {...axisProps} width={40} allowDecimals={false} domain={[0, 'auto']} />
              <Tooltip
                cursor={{ fill: 'rgba(17,24,39,0.04)' }}
                content={(p: RechartsTooltipProps) =>
                  p.active && p.payload?.length ? (
                    <TooltipBox
                      label={String(p.label)}
                      rows={p.payload
                        .filter((row) => row.value != null)
                        .map((row) => ({
                          name: row.dataKey === 'waistCm' ? waist : hip,
                          value: Number(row.value),
                          color: row.dataKey === 'waistCm' ? CHART.series1 : CHART.series2,
                          unit: t('common.cm'),
                        }))}
                    />
                  ) : null
                }
              />
              <Bar
                dataKey="waistCm"
                name={waist}
                fill={CHART.series1}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="hipCm"
                name={hip}
                fill={CHART.series2}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
