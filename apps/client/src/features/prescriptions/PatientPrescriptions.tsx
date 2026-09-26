import { FileText, Plus, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatDateOnly, type Patient } from '@clinic/shared';
import { usePatientPrescriptions } from '../../api/prescriptions';
import { ButtonLink } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/States';
import { openPrint } from '../../lib/print';
import { useCanEditClinical } from '../../lib/roles';
import { PrescriptionRows } from './PrescriptionsPage';

/** Patient page / panel tab: the patient's prescriptions + "issue". */
export function PatientPrescriptionsTab({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const canEdit = useCanEditClinical();
  const list = usePatientPrescriptions(patient.id);
  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <ButtonLink to={`/prescriptions/new?patientId=${patient.id}`}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('prescriptions.issue')}
          </ButtonLink>
        </div>
      )}
      <PrescriptionRows
        rows={list.data}
        loading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        showPatient={false}
      />
    </div>
  );
}

/** The mockup's "recent prescriptions" card in the dashboard panel. */
export function RecentPrescriptionsCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const list = usePatientPrescriptions(patientId);
  const recent = list.data?.slice(0, 4) ?? [];
  return (
    <Card className="ring-1 ring-gray-100">
      <CardTitle>{t('dashboard.panel.recentPrescriptions')}</CardTitle>
      {list.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          {t('dashboard.panel.noPrescriptions')}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recent.map((rx) => (
            <li key={rx.id} className="flex items-center gap-2 py-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
              <Link
                to={`/prescriptions/${rx.id}`}
                className="min-w-0 flex-1 truncate font-semibold text-gray-900 hover:underline"
              >
                {rx.title}
              </Link>
              <span className="text-xs text-gray-500" dir="ltr">
                {formatDateOnly(rx.date)}
              </span>
              <button
                type="button"
                onClick={() => openPrint(`/print/prescription/${rx.id}`)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label={`${t('prescriptions.print')} — ${rx.title}`}
              >
                <Printer className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
