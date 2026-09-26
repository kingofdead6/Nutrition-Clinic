import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppointmentWithPatient, Patient } from '@clinic/shared';
import { useAppointments } from '../../api/appointments';
import { Button } from '../../components/ui/Button';
import { AppointmentFormModal } from './AppointmentFormModal';
import { AppointmentsTable } from './AppointmentsTable';

/** A patient's appointments (all dates, newest first by date), used on the patient page and dashboard panel. */
export function PatientAppointmentsTab({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AppointmentWithPatient | 'new' | null>(null);
  const list = useAppointments({ patientId: patient.id, page, pageSize: 20 });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('appointments.new')}
        </Button>
      </div>
      <AppointmentsTable
        rows={list.data?.data}
        loading={list.isPending}
        refreshing={list.isPlaceholderData}
        error={list.error}
        onRetry={() => void list.refetch()}
        onEdit={(a) => setEditing(a)}
        showPatient={false}
        pagination={
          list.data && {
            page: list.data.page,
            pageSize: list.data.pageSize,
            total: list.data.total,
            onPageChange: setPage,
          }
        }
      />
      {editing && (
        <AppointmentFormModal
          appointment={editing === 'new' ? null : editing}
          draft={{
            patient: {
              id: patient.id,
              fullName: patient.fullName,
              fileNumber: patient.fileNumber,
              phone: patient.phone,
            },
          }}
          lockPatient
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
