import { useTranslation } from 'react-i18next';
import type { AppointmentStatus, PatientStatus } from '@shared';
import { cn } from '../../lib/cn';

type Tone = 'green' | 'blue' | 'orange' | 'yellow' | 'red' | 'gray';

const TONES: Record<Tone, string> = {
  green: 'bg-pastel-green text-status-green',
  blue: 'bg-pastel-blue text-status-blue',
  orange: 'bg-pastel-orange text-status-orange',
  yellow: 'bg-pastel-yellow text-status-yellow',
  red: 'bg-pastel-red text-status-red',
  gray: 'bg-gray-100 text-status-gray',
};

const DOTS: Record<Tone, string> = {
  green: 'bg-status-green',
  blue: 'bg-status-blue',
  orange: 'bg-status-orange',
  yellow: 'bg-status-yellow',
  red: 'bg-status-red',
  gray: 'bg-status-gray',
};

/** Status colors from the spec: always paired with the text label, never color alone. */
const PATIENT_TONE: Record<PatientStatus, Tone> = {
  follow_up: 'green',
  new_plan: 'blue',
  plan_ended: 'orange',
  inactive: 'gray',
};

const APPOINTMENT_TONE: Record<AppointmentStatus, Tone> = {
  pending: 'yellow',
  confirmed: 'green',
  completed: 'blue',
  cancelled: 'red',
  no_show: 'gray',
};

function Badge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold',
        TONES[tone],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[tone])} aria-hidden />
      {children}
    </span>
  );
}

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  const { t } = useTranslation();
  return <Badge tone={PATIENT_TONE[status]}>{t(`enums.patientStatus.${status}`)}</Badge>;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation();
  return <Badge tone={APPOINTMENT_TONE[status]}>{t(`enums.appointmentStatus.${status}`)}</Badge>;
}
