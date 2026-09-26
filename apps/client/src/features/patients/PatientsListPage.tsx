import { Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ageOn,
  formatDateOnly,
  GENDERS,
  PATIENT_GOALS,
  PATIENT_SORT_FIELDS,
  PATIENT_STATUSES,
  type Patient,
  type PatientSortField,
} from '@clinic/shared';
import { usePatients, type PatientListParams } from '../../api/patients';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Checkbox, Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/States';
import { PatientStatusBadge } from '../../components/ui/StatusBadge';
import { useClinicToday } from '../../lib/useClinicToday';
import { PatientAvatar } from './PatientAvatar';

const PAGE_SIZE = 20;

/** Reads list params from the URL so filters survive back/forward and reloads. */
function useListParams() {
  const [params, setParams] = useSearchParams();
  const pick = <T extends string>(key: string, allowed: readonly T[]) => {
    const v = params.get(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
  };
  const value: PatientListParams = {
    search: params.get('search') ?? undefined,
    status: pick('status', PATIENT_STATUSES),
    gender: pick('gender', GENDERS),
    goal: pick('goal', PATIENT_GOALS),
    archived: params.get('archived') === 'true',
    sort: pick('sort', PATIENT_SORT_FIELDS) ?? 'lastVisitDate',
    dir: pick('dir', ['asc', 'desc'] as const) ?? 'desc',
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZE,
  };
  const update = (
    patch: Partial<Record<keyof PatientListParams, string | boolean | number | undefined>>,
  ) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === false) next.delete(k);
      else next.set(k, String(v));
    }
    if (!('page' in patch)) next.delete('page'); // any filter change goes back to page 1
    setParams(next, { replace: true });
  };
  return [value, update] as const;
}

export function PatientsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = useClinicToday();
  const [q, update] = useListParams();
  const list = usePatients(q);
  const filtered = !!(q.search || q.status || q.gender || q.goal || q.archived);

  const columns: Column<Patient>[] = [
    {
      key: 'fileNumber',
      header: t('patients.columns.fileNumber'),
      sortKey: 'fileNumber',
      cell: (p) => (
        <span className="whitespace-nowrap font-mono text-xs text-gray-500" dir="ltr">
          {p.fileNumber}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: t('patients.columns.fullName'),
      sortKey: 'fullName',
      cell: (p) => (
        <span className="flex items-center gap-3">
          <PatientAvatar patient={p} className="h-8 w-8" />
          <span className="whitespace-nowrap font-semibold text-gray-900">{p.fullName}</span>
        </span>
      ),
    },
    {
      key: 'age',
      header: t('patients.columns.age'),
      cell: (p) => ageOn(p.birthDate, today),
    },
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
      key: 'lastVisit',
      header: t('patients.columns.lastVisit'),
      sortKey: 'lastVisitDate',
      cell: (p) => <span dir="ltr">{formatDateOnly(p.lastVisitDate)}</span>,
    },
    {
      key: 'status',
      header: t('patients.columns.status'),
      cell: (p) => <PatientStatusBadge status={p.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('patients.title')}
        subtitle={t('patients.subtitle')}
        actions={
          <ButtonLink to="/patients/new">
            <Plus className="h-4 w-4" aria-hidden />
            {t('patients.add')}
          </ButtonLink>
        }
      />

      <Card>
        <div role="search" className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            value={q.search ?? ''}
            onChange={(search) => update({ search })}
            placeholder={t('patients.searchPlaceholder')}
            label={t('patients.searchPlaceholder')}
            className="w-full sm:w-72"
          />
          <FilterSelect
            label={t('patients.filter.status')}
            value={q.status}
            options={PATIENT_STATUSES.map((s) => ({
              value: s,
              label: t(`enums.patientStatus.${s}`),
            }))}
            onChange={(status) => update({ status })}
          />
          <FilterSelect
            label={t('patients.filter.gender')}
            value={q.gender}
            options={GENDERS.map((g) => ({ value: g, label: t(`enums.gender.${g}`) }))}
            onChange={(gender) => update({ gender })}
          />
          <FilterSelect
            label={t('patients.filter.goal')}
            value={q.goal}
            options={PATIENT_GOALS.map((g) => ({ value: g, label: t(`enums.goal.${g}`) }))}
            onChange={(goal) => update({ goal })}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={!!q.archived}
              onChange={(e) => update({ archived: e.target.checked })}
            />
            {t('patients.showArchived')}
          </label>
        </div>

        <DataTable
          caption={t('patients.title')}
          columns={columns}
          rows={list.data?.data}
          rowKey={(p) => p.id}
          loading={list.isPending}
          refreshing={list.isPlaceholderData}
          error={list.error}
          onRetry={() => void list.refetch()}
          sort={{ key: q.sort ?? 'lastVisitDate', dir: q.dir ?? 'desc' }}
          onSortChange={(s) => update({ sort: s.key as PatientSortField, dir: s.dir })}
          onRowClick={(p) => navigate(`/patients/${p.id}`)}
          pagination={
            list.data && {
              page: list.data.page,
              pageSize: list.data.pageSize,
              total: list.data.total,
              onPageChange: (page) => update({ page }),
            }
          }
          empty={
            <EmptyState
              icon={Users}
              title={filtered ? t('patients.emptyFiltered') : t('patients.empty')}
              description={filtered ? undefined : t('patients.emptyHint')}
            />
          }
        />
      </Card>
    </>
  );
}

function FilterSelect<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V | undefined;
  options: { value: V; label: string }[];
  onChange: (value: V | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="w-full sm:w-44">
      <Select
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || undefined) as V | undefined)}
      >
        <option value="">{`${label}: ${t('common.all')}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
