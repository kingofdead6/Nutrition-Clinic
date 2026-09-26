import { CalendarDays, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  APPOINTMENT_STATUSES,
  formatDateOnly,
  type AppointmentStatus,
  type AppointmentWithPatient,
} from '@shared';
import { useSetAppointmentStatus } from '../../api/appointments';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column, type PaginationState } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';

/** Quick status change right in the row. */
function StatusSelect({ appointment }: { appointment: AppointmentWithPatient }) {
  const { t } = useTranslation();
  const toast = useToast();
  const setStatus = useSetAppointmentStatus();
  return (
    <Select
      value={appointment.status}
      disabled={setStatus.isPending}
      aria-label={t('appointments.quickStatus', {
        patient: appointment.patient?.fullName ?? t('appointments.unknownPatient'),
      })}
      className="h-8 w-32 text-xs"
      onChange={(e) =>
        setStatus.mutate(
          { id: appointment.id, status: e.target.value as AppointmentStatus },
          {
            onSuccess: () => toast.success(t('appointments.statusChanged')),
            onError: (err) => toast.error(errorText(t, err)),
          },
        )
      }
    >
      {APPOINTMENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`enums.appointmentStatus.${s}`)}
        </option>
      ))}
    </Select>
  );
}

export function AppointmentsTable({
  rows,
  loading,
  refreshing,
  error,
  onRetry,
  onEdit,
  pagination,
  showPatient = true,
  emptyText,
}: {
  rows: AppointmentWithPatient[] | undefined;
  loading: boolean;
  refreshing?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onEdit: (a: AppointmentWithPatient) => void;
  pagination?: PaginationState;
  showPatient?: boolean;
  emptyText?: string;
}) {
  const { t } = useTranslation();
  const columns: Column<AppointmentWithPatient>[] = [
    {
      key: 'date',
      header: t('appointments.fields.date'),
      cell: (a) => <span dir="ltr">{formatDateOnly(a.date)}</span>,
    },
    {
      key: 'time',
      header: t('appointments.fields.time'),
      cell: (a) => <span dir="ltr">{a.time}</span>,
    },
    ...(showPatient
      ? [
          {
            key: 'patient',
            header: t('appointments.fields.patient'),
            cell: (a: AppointmentWithPatient) =>
              a.patient ? (
                <Link
                  to={`/patients/${a.patient.id}`}
                  className="font-semibold text-gray-900 hover:text-brand-800 hover:underline"
                >
                  {a.patient.fullName}
                </Link>
              ) : (
                <span className="text-gray-400">{t('appointments.unknownPatient')}</span>
              ),
          },
        ]
      : []),
    {
      key: 'type',
      header: t('appointments.fields.type'),
      cell: (a) => t(`enums.appointmentType.${a.type}`),
    },
    {
      key: 'duration',
      header: t('appointments.fields.duration'),
      cell: (a) => t('appointments.minutes', { count: a.durationMin }),
    },
    {
      key: 'status',
      header: t('appointments.fields.status'),
      cell: (a) => <StatusSelect appointment={a} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-end',
      cell: (a) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(a)}
            aria-label={`${t('common.edit')} ${a.date} ${a.time}`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      caption={t('appointments.title')}
      columns={columns}
      rows={rows}
      rowKey={(a) => a.id}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onRetry={onRetry}
      dense
      pagination={pagination}
      empty={<EmptyState icon={CalendarDays} title={emptyText ?? t('appointments.empty')} />}
    />
  );
}
