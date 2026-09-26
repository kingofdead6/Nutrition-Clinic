import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  addDays,
  APPOINTMENT_STATUSES,
  DEFAULT_SETTINGS,
  formatDateOnly,
  startOfWeek,
  type AppointmentStatus,
  type AppointmentWithPatient,
} from '@shared';
import { useAppointments } from '../../api/appointments';
import { useAuthStatus } from '../../api/auth';
import { useSettings } from '../../api/settings';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { cn } from '../../lib/cn';
import { useClinicToday } from '../../lib/useClinicToday';
import { AppointmentFormModal, type AppointmentDraft } from './AppointmentFormModal';
import { AppointmentsTable } from './AppointmentsTable';
import { CalendarGrid } from './CalendarGrid';

type View = 'week' | 'day' | 'list';
const VIEWS: readonly View[] = ['week', 'day', 'list'];
const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function AppointmentsPage() {
  const { t } = useTranslation();
  const today = useClinicToday();
  const timezone = useAuthStatus().data?.clinic.timezone ?? DEFAULT_SETTINGS.timezone;
  const workingHours = useSettings().data?.workingHours;
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<{
    appointment: AppointmentWithPatient | null;
    draft?: AppointmentDraft;
  } | null>(null);

  const view: View = VIEWS.includes(params.get('view') as View)
    ? (params.get('view') as View)
    : 'week';
  const date = isDate(params.get('date')) ? (params.get('date') as string) : today;
  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  const weekStart = startOfWeek(date);
  const days = view === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const step = view === 'day' ? 1 : 7;

  // List view has its own range + status filters (defaults: the current week).
  const listFrom = isDate(params.get('from')) ? (params.get('from') as string) : weekStart;
  const listTo = isDate(params.get('to')) ? (params.get('to') as string) : addDays(weekStart, 6);
  const listStatus = APPOINTMENT_STATUSES.includes(params.get('status') as AppointmentStatus)
    ? (params.get('status') as AppointmentStatus)
    : undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const calendar = useAppointments(
    { from: days[0], to: days[days.length - 1], pageSize: 500 },
    view !== 'list',
  );
  const list = useAppointments(
    { from: listFrom, to: listTo, status: listStatus, page, pageSize: 50 },
    view === 'list',
  );

  const rangeLabel =
    view === 'day'
      ? formatDateOnly(date)
      : t('appointments.weekOf', { from: formatDateOnly(days[0]), to: formatDateOnly(days[6]) });

  return (
    <>
      <PageHeader
        title={t('appointments.title')}
        subtitle={t('appointments.subtitle')}
        actions={
          <Button
            onClick={() =>
              setEditing({ appointment: null, draft: { date: view === 'list' ? today : date } })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('appointments.new')}
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t('appointments.viewLabel')}
            className="inline-flex rounded-lg bg-gray-100 p-1"
          >
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => set({ view: v === 'week' ? undefined : v, page: undefined })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-semibold',
                  view === v
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {t(`appointments.views.${v}`)}
              </button>
            ))}
          </div>

          {view !== 'list' ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => set({ date: undefined })}>
                <CalendarCheck className="h-4 w-4" aria-hidden />
                {t('appointments.today')}
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set({ date: addDays(date, -step) })}
                  aria-label={
                    view === 'day' ? t('appointments.previousDay') : t('appointments.previousWeek')
                  }
                >
                  <ChevronRight className="h-4 w-4 ltr:rotate-180" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set({ date: addDays(date, step) })}
                  aria-label={
                    view === 'day' ? t('appointments.nextDay') : t('appointments.nextWeek')
                  }
                >
                  <ChevronLeft className="h-4 w-4 ltr:rotate-180" aria-hidden />
                </Button>
              </div>
              <p className="text-sm font-bold text-gray-800" dir="ltr" aria-live="polite">
                {rangeLabel}
              </p>
              <div className="ms-auto w-40">
                <DatePicker
                  aria-label={t('appointments.fields.date')}
                  value={date}
                  onChange={(e) => set({ date: e.target.value || undefined })}
                />
              </div>
            </>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                {t('appointments.from')}
                <DatePicker
                  className="w-40"
                  value={listFrom}
                  onChange={(e) => set({ from: e.target.value || undefined, page: undefined })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                {t('appointments.to')}
                <DatePicker
                  className="w-40"
                  value={listTo}
                  onChange={(e) => set({ to: e.target.value || undefined, page: undefined })}
                />
              </label>
              <div className="w-44">
                <Select
                  aria-label={t('appointments.fields.status')}
                  value={listStatus ?? ''}
                  onChange={(e) => set({ status: e.target.value || undefined, page: undefined })}
                >
                  <option value="">{`${t('appointments.fields.status')}: ${t('common.all')}`}</option>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`enums.appointmentStatus.${s}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}
        </div>

        {view === 'list' ? (
          <AppointmentsTable
            rows={list.data?.data}
            loading={list.isPending}
            refreshing={list.isPlaceholderData}
            error={list.error}
            onRetry={() => void list.refetch()}
            onEdit={(a) => setEditing({ appointment: a })}
            pagination={
              list.data && {
                page: list.data.page,
                pageSize: list.data.pageSize,
                total: list.data.total,
                onPageChange: (p) => set({ page: String(p) }),
              }
            }
          />
        ) : calendar.isError ? (
          <ErrorState error={calendar.error} onRetry={() => void calendar.refetch()} />
        ) : calendar.isPending ? (
          <Skeleton className="h-[36rem] w-full" />
        ) : (
          <div className={cn('transition-opacity', calendar.isPlaceholderData && 'opacity-60')}>
            <CalendarGrid
              days={days}
              appointments={calendar.data.data}
              workingHours={workingHours}
              today={today}
              timezone={timezone}
              onSlotClick={(d, time) => setEditing({ appointment: null, draft: { date: d, time } })}
              onAppointmentClick={(a) => setEditing({ appointment: a })}
            />
          </div>
        )}
      </Card>

      {editing && (
        <AppointmentFormModal
          appointment={editing.appointment}
          draft={editing.draft}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
