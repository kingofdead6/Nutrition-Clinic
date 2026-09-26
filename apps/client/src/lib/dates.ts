import { format, parseISO } from 'date-fns';
import { DISPLAY_DATE_FORMAT } from '@shared';

/** Formats a `YYYY-MM-DD` date or an ISO timestamp as `yyyy/MM/dd`. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : format(date, DISPLAY_DATE_FORMAT);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : format(date, `${DISPLAY_DATE_FORMAT} HH:mm`);
}
