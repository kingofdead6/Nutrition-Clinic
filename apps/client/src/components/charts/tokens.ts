/**
 * Chart tokens (validated with the dataviz palette checker against the white card
 * surface: green/blue pass lightness, chroma, CVD ΔE 23 and contrast ≥ 3:1).
 * Marks carry the series color; all text uses ink tokens.
 */
export const CHART = {
  series1: '#15803d', // brand green
  series2: '#2a78d6', // blue
  surface: '#ffffff',
  grid: '#e5e7eb',
  axis: '#d1d5db',
  muted: '#6b7280',
  ink: '#111827',
  font: 'Cairo, Tahoma, system-ui, sans-serif',
} as const;
