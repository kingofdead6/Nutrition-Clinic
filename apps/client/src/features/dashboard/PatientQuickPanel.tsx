import { ExternalLink, FileText, Pencil, Phone, Printer } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePatientPrescriptions } from '../../api/prescriptions';
import { openPrint } from '../../lib/print';
import { RecentPrescriptionsCard } from '../prescriptions/PatientPrescriptions';
import { PatientReportTab } from '../reports/PatientReport';
import { ageOn, type Patient } from '@shared';
import { usePatient } from '../../api/patients';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { PatientStatusBadge } from '../../components/ui/StatusBadge';
import { TabPanel, Tabs, type TabItem } from '../../components/ui/Tabs';
import { useClinicToday } from '../../lib/useClinicToday';
import { PatientAppointmentsTab } from '../appointments/PatientAppointmentsTab';
import { MeasurementsTab } from '../patients/MeasurementsTab';
import { ActivePlanCard } from '../plans/ActivePlanCard';
import { PatientPlansTab } from '../plans/PatientPlansTab';
import { PatientAvatar } from '../patients/PatientAvatar';
import {
  BasicInfoCard,
  CurrentMeasurementsCard,
  WaistHipCard,
  WeightChart,
} from '../patients/ProfileTab';

type TabId = 'profile' | 'measurements' | 'plan' | 'appointments' | 'reports';
const TAB_IDS: readonly TabId[] = ['profile', 'measurements', 'plan', 'appointments', 'reports'];

/** The mockup's left-hand panel for the patient selected in the list. */
export function PatientQuickPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const patient = usePatient(patientId);
  const [tab, setTab] = useState<TabId>('profile');

  if (patient.isPending) return <Skeleton className="h-[40rem] w-full rounded-2xl" />;
  if (patient.isError)
    return (
      <Card>
        <ErrorState error={patient.error} onRetry={() => void patient.refetch()} />
      </Card>
    );
  const p = patient.data;
  const tabs: TabItem<TabId>[] = TAB_IDS.map((id) => ({
    id,
    label: t(`dashboard.panel.tabs.${id}`),
  }));

  return (
    <section aria-label={p.fullName} className="space-y-4 xl:sticky xl:top-20">
      <PanelHeader patient={p} />
      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} idPrefix="panel" label={p.fullName} />
        <TabPanel idPrefix="panel" id={tab}>
          {tab === 'profile' && <PanelProfile patient={p} />}
          {tab === 'measurements' && <MeasurementsTab patient={p} compact />}
          {tab === 'appointments' && <PatientAppointmentsTab patient={p} />}
          {tab === 'plan' && <PatientPlansTab patient={p} />}
          {tab === 'reports' && <PatientReportTab patientId={p.id} compact />}
        </TabPanel>
      </Card>
    </section>
  );
}

function PanelHeader({ patient: p }: { patient: Patient }) {
  const { t } = useTranslation();
  const today = useClinicToday();
  const navigate = useNavigate();
  const prescriptions = usePatientPrescriptions(p.id);
  const latestRx = prescriptions.data?.[0];
  return (
    <Card>
      <div className="flex items-center gap-4">
        <PatientAvatar patient={p} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-bold text-gray-900">{p.fullName}</p>
            <PatientStatusBadge status={p.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>{`${ageOn(p.birthDate, today)} ${t('common.years')}`}</span>
            <span>{t(`enums.gender.${p.gender}`)}</span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span dir="ltr">{p.phone}</span>
            </span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink size="sm" to={`/patients/${p.id}/edit`}>
          <Pencil className="h-4 w-4" aria-hidden />
          {t('patients.detail.edit')}
        </ButtonLink>
        <Button
          size="sm"
          variant="secondary"
          title={t('dashboard.panel.printPrescriptionHint')}
          disabled={prescriptions.isPending}
          onClick={() =>
            latestRx
              ? openPrint(`/print/prescription/${latestRx.id}`)
              : navigate(`/prescriptions/new?patientId=${p.id}`)
          }
        >
          <FileText className="h-4 w-4" aria-hidden />
          {t('dashboard.panel.printPrescription')}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openPrint(`/print/patient/${p.id}`)}>
          <Printer className="h-4 w-4" aria-hidden />
          {t('dashboard.panel.printSummary')}
        </Button>
        <ButtonLink size="sm" variant="ghost" to={`/patients/${p.id}`} className="ms-auto">
          <ExternalLink className="h-4 w-4" aria-hidden />
          {t('dashboard.panel.openFile')}
        </ButtonLink>
      </div>
    </Card>
  );
}

function PanelProfile({ patient: p }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 2xl:grid-cols-2">
        <BasicInfoCard patient={p} compact />
        <CurrentMeasurementsCard patientId={p.id} />
      </div>
      <WeightChart patientId={p.id} height={200} />
      <WaistHipCard patientId={p.id} height={200} />
      <div className="grid gap-4 2xl:grid-cols-2">
        <ActivePlanCard patientId={p.id} />
        <RecentPrescriptionsCard patientId={p.id} />
      </div>
    </div>
  );
}
