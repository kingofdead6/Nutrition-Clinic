import { useTranslation } from 'react-i18next';
import {
  formatDateOnly,
  minutesToTime,
  nowTimeIn,
  timeToMinutes,
  weekdayKeyOf,
  type AppointmentStatus,
  type AppointmentWithPatient,
  type WorkingDay,
} from '@clinic/shared';
import { cn } from '../../lib/cn';
import { calendarRange, workingDayOf } from './workingHours';

const HOUR_PX = 56;
const SLOT_MIN = 30;

const BLOCK_TONE: Record<AppointmentStatus, string> = {
  pending: 'border-status-yellow bg-pastel-yellow',
  confirmed: 'border-status-green bg-pastel-green',
  completed: 'border-status-blue bg-pastel-blue',
  cancelled: 'border-status-red bg-pastel-red opacity-70 line-through',
  no_show: 'border-status-gray bg-gray-100 opacity-70',
};

export interface CalendarGridProps {
  days: string[];
  appointments: readonly AppointmentWithPatient[];
  workingHours: readonly WorkingDay[] | undefined;
  today: string;
  timezone: string;
  onSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (a: AppointmentWithPatient) => void;
}

/**
 * Week/day calendar: day columns (right → left in RTL, like a paper diary), hour rows
 * from the clinic's working hours. Every 30-minute slot is a keyboard-reachable button.
 */
export function CalendarGrid({
  days,
  appointments,
  workingHours,
  today,
  timezone,
  onSlotClick,
  onAppointmentClick,
}: CalendarGridProps) {
  const { t } = useTranslation();
  const base = calendarRange(workingHours);
  // Grow the range so an appointment booked outside working hours is still visible.
  const startMin = Math.min(
    base.startMin,
    ...appointments.map((a) => Math.floor(timeToMinutes(a.time) / 60) * 60),
  );
  const endMin = Math.max(
    base.endMin,
    ...appointments.map((a) => Math.ceil((timeToMinutes(a.time) + a.durationMin) / 60) * 60),
  );
  const hours = Array.from({ length: (endMin - startMin) / 60 }, (_, i) => startMin + i * 60);
  const slots = Array.from(
    { length: (endMin - startMin) / SLOT_MIN },
    (_, i) => startMin + i * SLOT_MIN,
  );
  const heightPx = ((endMin - startMin) / 60) * HOUR_PX;
  const nowMin = timeToMinutes(nowTimeIn(timezone));
  const single = days.length === 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <div
        className={cn('grid', single ? 'min-w-[20rem]' : 'min-w-[56rem]')}
        style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50" />
        {days.map((date) => {
          const isToday = date === today;
          return (
            <div
              key={date}
              className={cn(
                'border-b border-s border-gray-200 bg-gray-50 px-2 py-2 text-center text-sm',
                isToday && 'bg-brand-50',
              )}
            >
              <p className={cn('font-bold', isToday ? 'text-brand-800' : 'text-gray-800')}>
                {t(`enums.weekday.${weekdayKeyOf(date)}`)}
              </p>
              <p className="text-xs text-gray-500" dir="ltr">
                {formatDateOnly(date).slice(5)}
              </p>
            </div>
          );
        })}

        {/* Time labels */}
        <div className="relative" style={{ height: heightPx }}>
          {hours.map((m) => (
            <span
              key={m}
              className="absolute end-2 -translate-y-1/2 text-xs text-gray-500"
              style={{ top: ((m - startMin) / 60) * HOUR_PX }}
              dir="ltr"
            >
              {m === startMin ? '' : minutesToTime(m)}
            </span>
          ))}
        </div>

        {days.map((date) => {
          const workDay = workingDayOf(workingHours, date);
          const closed = workDay ? !workDay.isOpen : false;
          const dayLabel = `${t(`enums.weekday.${weekdayKeyOf(date)}`)} ${formatDateOnly(date)}`;
          const dayAppointments = appointments.filter((a) => a.date === date);
          return (
            <div
              key={date}
              className={cn('relative border-s border-gray-200', closed && 'bg-gray-50')}
              style={{ height: heightPx }}
            >
              {/* Hour lines + clickable slots */}
              {slots.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSlotClick(date, minutesToTime(m))}
                  aria-label={t('appointments.slotLabel', {
                    day: dayLabel,
                    time: minutesToTime(m),
                  })}
                  className={cn(
                    'absolute inset-x-0 block hover:bg-brand-50/70 focus-visible:z-10 focus-visible:bg-brand-50',
                    m % 60 === 0 ? 'border-t border-gray-200' : 'border-t border-gray-100',
                  )}
                  style={{
                    top: ((m - startMin) / 60) * HOUR_PX,
                    height: (SLOT_MIN / 60) * HOUR_PX,
                  }}
                />
              ))}

              {closed && (
                <span className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs font-semibold text-gray-400">
                  {t('appointments.closed')}
                </span>
              )}

              {date === today && nowMin >= startMin && nowMin <= endMin && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-red-500"
                  style={{ top: ((nowMin - startMin) / 60) * HOUR_PX }}
                  aria-hidden
                />
              )}

              {dayAppointments.map((a) => {
                const top = ((timeToMinutes(a.time) - startMin) / 60) * HOUR_PX;
                const height = Math.max(22, (a.durationMin / 60) * HOUR_PX - 2); // 2px surface gap
                const name = a.patient?.fullName ?? t('appointments.unknownPatient');
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onAppointmentClick(a)}
                    className={cn(
                      'absolute inset-x-1 z-10 overflow-hidden rounded-md border-s-4 px-2 py-1 text-start text-xs shadow-sm hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand-600',
                      BLOCK_TONE[a.status],
                    )}
                    style={{ top: top + 1, height }}
                    title={`${a.time} · ${name} · ${t(`enums.appointmentType.${a.type}`)} · ${t(`enums.appointmentStatus.${a.status}`)}`}
                  >
                    <span className="font-bold text-gray-900" dir="ltr">
                      {a.time}
                    </span>{' '}
                    <span className="font-semibold text-gray-900">{name}</span>
                    {height > 40 && (
                      <span className="block truncate text-gray-600">
                        {t(`enums.appointmentType.${a.type}`)} ·{' '}
                        {t(`enums.appointmentStatus.${a.status}`)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
