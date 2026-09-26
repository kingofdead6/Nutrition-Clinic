import { CalendarDays, TrendingDown, TrendingUp, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ageOn,
  formatDateOnly,
  PATIENT_STATUSES,
  type AppointmentWithPatient,
  type Patient,
  type PatientStatus,
} from '@clinic/shared';
import { useUpcomingAppointments } from '../../api/appointments';
import { useDashboardStats } from '../../api/dashboard';
import { usePatients } from '../../api/patients';
import { ButtonLink } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/States';
import { StatCard } from '../../components/ui/StatCard';
import { AppointmentStatusBadge, PatientStatusBadge } from '../../components/ui/StatusBadge';
import { cn } from '../../lib/cn';
import { useClinicToday } from '../../lib/useClinicToday';
import { AppointmentFormModal } from '../appointments/AppointmentFormModal';
import { PatientAvatar } from '../patients/PatientAvatar';
import { PatientQuickPanel } from './PatientQuickPanel';

const PAGE_SIZE = 8;

/** The mockup's home screen: KPI row, patient list + upcoming appointments, patient quick panel. */
export function DashboardPage() {
  const { t } = useTranslation();
  const stats = useDashboardStats();
  const s = stats.data;
  const kg = t('common.kg');

  return (
    <>
      <PageHeader title={t('dashboard.title')} />

      <section
        aria-label={t('dashboard.title')}
        className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          tone="green"
          icon={Users}
          label={t('dashboard.kpi.totalPatients')}
          value={s?.totalPatients ?? 0}
          note={s ? t('dashboard.kpi.newThisMonth', { count: s.newPatientsThisMonth }) : undefined}
          loading={stats.isPending}
        />
        <StatCard
          tone="blue"
          icon={CalendarDays}
          label={t('dashboard.kpi.todayAppointments')}
          value={s?.todayAppointments ?? 0}
          note={t('dashboard.kpi.todayHint')}
          loading={stats.isPending}
        />
        <StatCard
          tone="purple"
          icon={TrendingDown}
          label={t('dashboard.kpi.avgLoss')}
          value={s?.avgWeightLossKg ?? '—'}
          unit={s?.avgWeightLossKg != null ? kg : undefined}
          note={
            s?.avgWeightLossKg != null
              ? t('dashboard.kpi.basedOn', { count: s.weightLossPatients })
              : t('dashboard.kpi.noData')
          }
          loading={stats.isPending}
        />
        <StatCard
          tone="red"
          icon={TrendingUp}
          label={t('dashboard.kpi.avgGain')}
          value={s?.avgWeightGainKg ?? '—'}
          unit={s?.avgWeightGainKg != null ? kg : undefined}
          note={
            s?.avgWeightGainKg != null
              ? t('dashboard.kpi.basedOn', { count: s.weightGainPatients })
              : t('dashboard.kpi.noData')
          }
          loading={stats.isPending}
        />
      </section>

      {/* RTL: the first column sits on the right (lists), the second on the left (panel). */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <PatientListCard statusCounts={s?.patientsByStatus} />
          <UpcomingCard />
        </div>
        <PanelColumn />
      </div>
    </>
  );
}

/** Selected patient: `?patient=` in the URL, else the most recently visited one. */
function useSelectedPatientId() {
  const [params, setParams] = useSearchParams();
  const explicit = params.get('patient');
  const latest = usePatients({ sort: 'lastVisitDate', dir: 'desc', pageSize: 1 });
  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('patient', id);
    setParams(next, { replace: true });
  };
  return {
    id: explicit ?? latest.data?.data[0]?.id ?? null,
    loading: !explicit && latest.isPending,
    select,
  };
}

function PanelColumn() {
  const { t } = useTranslation();
  const { id, loading } = useSelectedPatientId();
  if (loading) return <Card className="h-96 animate-pulse" />;
  if (!id)
    return (
      <Card>
        <EmptyState
          icon={UserPlus}
          title={t('dashboard.noPatients')}
          action={<ButtonLink to="/patients/new">{t('dashboard.addFirst')}</ButtonLink>}
        />
      </Card>
    );
  return <PatientQuickPanel patientId={id} />;
}

function PatientListCard({
  statusCounts,
}: {
  statusCounts: Record<PatientStatus, number> | undefined;
}) {
  const { t } = useTranslation();
  const today = useClinicToday();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PatientStatus | undefined>();
  const [page, setPage] = useState(1);
  const { id: selectedId, select } = useSelectedPatientId();
  const list = usePatients({
    search: search || undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
    sort: 'lastVisitDate',
    dir: 'desc',
  });

  const columns: Column<Patient>[] = [
    {
      key: 'n',
      header: '#',
      cell: (p) => (
        <span className="whitespace-nowrap font-mono text-xs text-gray-500" dir="ltr">
          {p.fileNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('patients.columns.fullName'),
      cell: (p) => (
        <span className="flex items-center gap-2">
          <PatientAvatar patient={p} className="h-7 w-7" />
          <span className="whitespace-nowrap font-semibold text-gray-900">{p.fullName}</span>
        </span>
      ),
    },
    { key: 'age', header: t('patients.columns.age'), cell: (p) => ageOn(p.birthDate, today) },
    {
      key: 'gender',
      header: t('patients.columns.gender'),
      cell: (p) => t(`enums.gender.${p.gender}`),
    },
    {
      key: 'phone',
      header: t('patients.columns.phone'),
      cell: (p) => <span dir="ltr">{p.phone}</span>,
    },
    {
      key: 'visit',
      header: t('patients.columns.lastVisit'),
      cell: (p) => (
        <span className="whitespace-nowrap" dir="ltr">
          {formatDateOnly(p.lastVisitDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('patients.columns.status'),
      cell: (p) => <PatientStatusBadge status={p.status} />,
    },
  ];

  return (
    <Card>
      <CardTitle
        actions={
          <Link to="/patients" className="text-sm font-semibold text-brand-800 hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        }
      >
        {t('dashboard.patientList')}
      </CardTitle>
      <div className="mb-3 space-y-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          label={t('patients.searchPlaceholder')}
          placeholder={t('patients.searchPlaceholder')}
        />
        {statusCounts && (
          <div
            role="group"
            aria-label={t('dashboard.statusFilter')}
            className="flex flex-wrap gap-2"
          >
            {PATIENT_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                aria-pressed={status === st}
                onClick={() => {
                  setStatus(status === st ? undefined : st);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  status === st
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300',
                )}
              >
                {t(`enums.patientStatus.${st}`)} · {statusCounts[st]}
              </button>
            ))}
          </div>
        )}
      </div>
      <DataTable
        caption={t('dashboard.patientList')}
        columns={columns}
        rows={list.data?.data}
        rowKey={(p) => p.id}
        loading={list.isPending}
        refreshing={list.isPlaceholderData}
        error={list.error}
        onRetry={() => void list.refetch()}
        onRowClick={(p) => select(p.id)}
        selectedKey={selectedId ?? undefined}
        dense
        skeletonRows={PAGE_SIZE}
        pagination={
          list.data && {
            page: list.data.page,
            pageSize: list.data.pageSize,
            total: list.data.total,
            onPageChange: setPage,
          }
        }
        empty={
          <EmptyState
            icon={Users}
            title={search || status ? t('patients.emptyFiltered') : t('patients.empty')}
          />
        }
      />
    </Card>
  );
}

function UpcomingCard() {
  const { t } = useTranslation();
  const upcoming = useUpcomingAppointments(6);
  const [editing, setEditing] = useState<AppointmentWithPatient | null>(null);

  // One date column and one time column (the mockup's duplicated "الساعة" is fixed).
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
    {
      key: 'patient',
      header: t('appointments.fields.patient'),
      cell: (a) => (
        <span className="font-semibold text-gray-900">
          {a.patient?.fullName ?? t('appointments.unknownPatient')}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('appointments.fields.type'),
      cell: (a) => t(`enums.appointmentType.${a.type}`),
    },
    {
      key: 'status',
      header: t('appointments.fields.status'),
      cell: (a) => <AppointmentStatusBadge status={a.status} />,
    },
  ];

  return (
    <Card>
      <CardTitle
        actions={
          <Link to="/appointments" className="text-sm font-semibold text-brand-800 hover:underline">
            {t('dashboard.allAppointments')}
          </Link>
        }
      >
        {t('dashboard.upcoming')}
      </CardTitle>
      <DataTable
        caption={t('dashboard.upcoming')}
        columns={columns}
        rows={upcoming.data}
        rowKey={(a) => a.id}
        loading={upcoming.isPending}
        error={upcoming.error}
        onRetry={() => void upcoming.refetch()}
        onRowClick={(a) => setEditing(a)}
        dense
        skeletonRows={4}
        empty={<EmptyState icon={CalendarDays} title={t('dashboard.noUpcoming')} />}
      />
      {editing && <AppointmentFormModal appointment={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}
