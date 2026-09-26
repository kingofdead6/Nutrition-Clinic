import { Archive, ArchiveRestore, Camera, Pencil, Phone, Printer, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ageOn, UPLOAD_IMAGE_MIME_TYPES, UPLOAD_MAX_BYTES, type Patient } from '@clinic/shared';
import { useMe } from '../../api/auth';
import {
  useArchivePatient,
  useDeletePatient,
  usePatient,
  useRemovePatientPhoto,
  useUploadPatientPhoto,
} from '../../api/patients';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingBlock } from '../../components/ui/Spinner';
import { ErrorState, InfoNote } from '../../components/ui/States';
import { PatientStatusBadge } from '../../components/ui/StatusBadge';
import { TabPanel, Tabs, type TabItem } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';
import { useClinicToday } from '../../lib/useClinicToday';
import { PatientAppointmentsTab } from '../appointments/PatientAppointmentsTab';
import { PatientPlansTab } from '../plans/PatientPlansTab';
import { PatientPrescriptionsTab } from '../prescriptions/PatientPrescriptions';
import { PatientReportTab } from '../reports/PatientReport';
import { openPrint } from '../../lib/print';
import { MeasurementsTab } from './MeasurementsTab';
import { PatientAvatar } from './PatientAvatar';
import { ProfileTab } from './ProfileTab';

type TabId =
  'profile' | 'measurements' | 'dietPlans' | 'appointments' | 'prescriptions' | 'reports';
/** Tabs whose content later phases build. */

const TAB_IDS: readonly TabId[] = [
  'profile',
  'measurements',
  'dietPlans',
  'appointments',
  'prescriptions',
  'reports',
];

export function PatientDetailPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const patient = usePatient(id);
  const [params, setParams] = useSearchParams();

  if (patient.isPending) return <LoadingBlock label={t('common.loading')} />;
  if (patient.isError)
    return <ErrorState error={patient.error} onRetry={() => void patient.refetch()} />;
  const p = patient.data;

  const requested = params.get('tab') as TabId | null;
  const active: TabId = requested && TAB_IDS.includes(requested) ? requested : 'profile';
  const tabs: TabItem<TabId>[] = TAB_IDS.map((tab) => ({
    id: tab,
    label: t(`patients.detail.tabs.${tab}`),
  }));

  return (
    <>
      <PageHeader title={p.fullName} />
      <div className="space-y-6">
        <PatientHeaderCard patient={p} />
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <Tabs
            items={tabs}
            value={active}
            onChange={(tab) => setParams({ tab }, { replace: true })}
            idPrefix="patient"
            label={p.fullName}
          />
          <TabPanel idPrefix="patient" id={active}>
            {active === 'profile' && <ProfileTab patient={p} />}
            {active === 'measurements' && <MeasurementsTab patient={p} />}
            {active === 'appointments' && <PatientAppointmentsTab patient={p} />}
            {active === 'dietPlans' && <PatientPlansTab patient={p} />}
            {active === 'prescriptions' && <PatientPrescriptionsTab patient={p} />}
            {active === 'reports' && <PatientReportTab patientId={p.id} />}
          </TabPanel>
        </div>
      </div>
    </>
  );
}

function PatientHeaderCard({ patient: p }: { patient: Patient }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const today = useClinicToday();
  const isAdmin = useMe().data?.role === 'admin';
  const archive = useArchivePatient(p.id);
  const remove = useDeletePatient();
  const upload = useUploadPatientPhoto(p.id);
  const removePhoto = useRemovePatientPhoto(p.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!(UPLOAD_IMAGE_MIME_TYPES as readonly string[]).includes(file.type))
      return toast.error(t('errors.imageType'));
    if (file.size > UPLOAD_MAX_BYTES) return toast.error(t('errors.fileTooLarge'));
    upload.mutate(file, {
      onSuccess: () => toast.success(t('patients.detail.photoUpdated')),
      onError: (err) => toast.error(errorText(t, err)),
    });
  };

  const toggleArchive = () =>
    archive.mutate(!p.archived, {
      onSuccess: () => {
        setConfirm(null);
        toast.success(t(p.archived ? 'patients.detail.unarchived' : 'patients.detail.archived'));
      },
      onError: (err) => toast.error(errorText(t, err)),
    });

  return (
    <Card>
      {p.archived && (
        <div className="mb-4">
          <InfoNote>{t('patients.detail.archivedBanner')}</InfoNote>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <PatientAvatar patient={p} className="h-20 w-20" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -end-1 rounded-full bg-white p-1.5 text-brand-800 shadow ring-1 ring-black/10 hover:bg-brand-50"
            aria-label={t('patients.detail.changePhoto')}
            title={t('patients.detail.changePhoto')}
          >
            <Camera className="h-4 w-4" aria-hidden />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={UPLOAD_IMAGE_MIME_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-bold text-gray-900">{p.fullName}</p>
            <PatientStatusBadge status={p.status} />
            <span className="font-mono text-xs text-gray-500" dir="ltr">
              {p.fileNumber}
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>{`${ageOn(p.birthDate, today)} ${t('common.years')}`}</span>
            <span>{t(`enums.gender.${p.gender}`)}</span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span dir="ltr">{p.phone}</span>
            </span>
            <span>{t(`enums.goal.${p.goal}`)}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/patients/${p.id}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden />
            {t('patients.detail.edit')}
          </ButtonLink>
          <Button variant="secondary" onClick={() => openPrint(`/print/patient/${p.id}`)}>
            <Printer className="h-4 w-4" aria-hidden />
            {t('dashboard.panel.printSummary')}
          </Button>
          {p.photoPath && (
            <Button
              variant="ghost"
              loading={removePhoto.isPending}
              onClick={() =>
                removePhoto.mutate(undefined, {
                  onSuccess: () => toast.success(t('patients.detail.photoRemoved')),
                })
              }
            >
              {t('patients.detail.removePhoto')}
            </Button>
          )}
          {p.archived ? (
            <Button variant="secondary" loading={archive.isPending} onClick={toggleArchive}>
              <ArchiveRestore className="h-4 w-4" aria-hidden />
              {t('patients.detail.unarchive')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setConfirm('archive')}>
              <Archive className="h-4 w-4" aria-hidden />
              {t('patients.detail.archive')}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              onClick={() => setConfirm('delete')}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('patients.detail.delete')}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'archive'}
        title={t('patients.detail.archive')}
        message={t('patients.detail.archiveConfirm')}
        confirmLabel={t('patients.detail.archive')}
        loading={archive.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={toggleArchive}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={t('patients.detail.delete')}
        message={t('patients.detail.deleteConfirm', { name: p.fullName })}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          remove.mutate(p.id, {
            onSuccess: () => {
              toast.success(t('patients.detail.deleted'));
              navigate('/patients', { replace: true });
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </Card>
  );
}
