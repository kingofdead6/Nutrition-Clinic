import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  appointmentCreateSchema,
  formatDateOnly,
  type AppointmentConflictDetails,
  type AppointmentWithPatient,
} from '@shared';
import {
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from '../../api/appointments';
import { useSettings } from '../../api/settings';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { ApiError } from '../../lib/apiClient';
import { applyServerErrors, errorText } from '../../lib/errors';
import { useClinicToday } from '../../lib/useClinicToday';
import { PatientCombobox, type PatientChoice } from './PatientCombobox';
import { hoursWarning } from './workingHours';

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

export interface AppointmentDraft {
  date?: string;
  time?: string;
  patient?: PatientChoice | null;
}

export function AppointmentFormModal({
  appointment,
  draft,
  lockPatient = false,
  onClose,
}: {
  appointment: AppointmentWithPatient | null;
  /** Prefill for a new appointment (a clicked calendar slot, or the current patient). */
  draft?: AppointmentDraft;
  lockPatient?: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const today = useClinicToday();
  const settings = useSettings().data;
  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const remove = useDeleteAppointment();
  const mutation = appointment ? update : create;
  const [patient, setPatient] = useState<PatientChoice | null>(
    appointment?.patient ?? draft?.patient ?? null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentCreateSchema),
    defaultValues: {
      patientId: appointment?.patientId ?? draft?.patient?.id ?? '',
      date: appointment?.date ?? draft?.date ?? today,
      time: appointment?.time ?? draft?.time ?? '09:00',
      durationMin: appointment?.durationMin ?? settings?.defaultAppointmentDurationMin ?? 30,
      type: appointment?.type ?? 'follow_up',
      status: appointment?.status ?? 'pending',
      notes: appointment?.notes ?? '',
    },
  });
  const [date, time, duration] = useWatch({ control, name: ['date', 'time', 'durationMin'] });
  const warning = hoursWarning(settings?.workingHours, date, time, Number(duration));

  const onError = (err: unknown) => {
    if (err instanceof ApiError && err.message === 'errors.appointmentConflict') {
      const d = err.details as AppointmentConflictDetails;
      setError('time', {
        type: 'server',
        message: `errors.appointmentConflict|${JSON.stringify({
          time: d.time,
          patient: d.patientName ?? t('appointments.unknownPatient'),
        })}`,
      });
      return;
    }
    if (!applyServerErrors(err, setError)) toast.error(errorText(t, err));
  };

  const onSubmit = handleSubmit((values) => {
    const done = {
      onSuccess: () => {
        toast.success(t(appointment ? 'appointments.updated' : 'appointments.created'));
        onClose();
      },
      onError,
    };
    if (appointment) update.mutate({ id: appointment.id, ...values }, done);
    else create.mutate(values, done);
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={appointment ? t('appointments.edit') : t('appointments.new')}
      footer={
        <>
          {appointment && (
            <Button
              variant="ghost"
              className="me-auto text-red-700 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('common.delete')}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="appointment-form" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {mutation.error && !Object.keys(errors).length && (
          <Alert>{errorText(t, mutation.error)}</Alert>
        )}

        <FormField
          id="a-patient"
          label={t('appointments.fields.patient')}
          error={errors.patientId?.message}
          required
        >
          <Controller
            control={control}
            name="patientId"
            render={() => (
              <PatientCombobox
                id="a-patient"
                value={patient}
                disabled={lockPatient}
                invalid={!!errors.patientId}
                onChange={(p) => {
                  setPatient(p);
                  setValue('patientId', p?.id ?? '', { shouldValidate: !!p });
                }}
              />
            )}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="a-date"
            label={t('appointments.fields.date')}
            error={errors.date?.message}
            required
          >
            <DatePicker id="a-date" invalid={!!errors.date} {...register('date')} />
          </FormField>
          <FormField
            id="a-time"
            label={t('appointments.fields.time')}
            error={errors.time?.message}
            required
          >
            <Input
              id="a-time"
              type="time"
              step={300}
              ltr
              invalid={!!errors.time}
              {...register('time')}
            />
          </FormField>
          <FormField id="a-duration" label={t('appointments.fields.duration')}>
            <Select id="a-duration" {...register('durationMin', { valueAsNumber: true })}>
              {DURATIONS.map((m) => (
                <option key={m} value={m}>
                  {t('appointments.minutes', { count: m })}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {warning && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg bg-pastel-yellow px-3 py-2 text-sm text-yellow-900"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {warning === 'closed' ? t('appointments.closedDay') : t('appointments.outsideHours')}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="a-type" label={t('appointments.fields.type')}>
            <Select id="a-type" {...register('type')}>
              {APPOINTMENT_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`enums.appointmentType.${v}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="a-status" label={t('appointments.fields.status')}>
            <Select id="a-status" {...register('status')}>
              {APPOINTMENT_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {t(`enums.appointmentStatus.${v}`)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField id="a-notes" label={t('appointments.fields.notes')} optional>
          <Textarea id="a-notes" rows={2} {...register('notes')} />
        </FormField>
      </form>

      {appointment && (
        <ConfirmDialog
          open={confirmDelete}
          title={t('appointments.deleteTitle')}
          message={t('appointments.deleteConfirm', {
            patient: appointment.patient?.fullName ?? t('appointments.unknownPatient'),
            date: formatDateOnly(appointment.date),
            time: appointment.time,
          })}
          confirmLabel={t('common.delete')}
          danger
          loading={remove.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            remove.mutate(appointment.id, {
              onSuccess: () => {
                toast.success(t('appointments.deleted'));
                onClose();
              },
              onError: (err) => toast.error(errorText(t, err)),
            })
          }
        />
      )}
    </Modal>
  );
}
