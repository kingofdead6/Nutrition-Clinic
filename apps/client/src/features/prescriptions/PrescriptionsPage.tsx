import { FileText, PackagePlus, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDateOnly, type PrescriptionTemplate, type PrescriptionWithPatient } from '@shared';
import {
  useDeleteTemplate,
  useInstallDefaultTemplates,
  usePrescriptions,
  usePrescriptionTemplates,
} from '../../api/prescriptions';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/States';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';
import { openPrint } from '../../lib/print';
import { useCanEditClinical } from '../../lib/roles';
import { TemplateEditorModal } from './TemplateEditorModal';

type Tab = 'issued' | 'templates';

export function PrescriptionsPage() {
  const { t } = useTranslation();
  const canEdit = useCanEditClinical();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'templates' ? 'templates' : 'issued';

  return (
    <>
      <PageHeader
        title={t('prescriptions.title')}
        subtitle={t('prescriptions.subtitle')}
        actions={
          canEdit && (
            <ButtonLink to="/prescriptions/new">
              <Plus className="h-4 w-4" aria-hidden />
              {t('prescriptions.issue')}
            </ButtonLink>
          )
        }
      />
      <Card>
        <Tabs
          items={[
            { id: 'issued', label: t('prescriptions.tabs.issued') },
            { id: 'templates', label: t('prescriptions.tabs.templates') },
          ]}
          value={tab}
          onChange={(id) => setParams(id === 'issued' ? {} : { tab: id }, { replace: true })}
          idPrefix="rx"
          label={t('prescriptions.title')}
        />
        {tab === 'issued' ? <IssuedList /> : <TemplatesList canEdit={canEdit} />}
      </Card>
    </>
  );
}

export function PrescriptionRows({
  rows,
  loading,
  error,
  onRetry,
  showPatient = true,
  pagination,
}: {
  rows: PrescriptionWithPatient[] | undefined;
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
  showPatient?: boolean;
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (p: number) => void };
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const columns: Column<PrescriptionWithPatient>[] = [
    {
      key: 'date',
      header: t('prescriptions.columns.date'),
      cell: (r) => <span dir="ltr">{formatDateOnly(r.date)}</span>,
    },
    ...(showPatient
      ? [
          {
            key: 'patient',
            header: t('prescriptions.columns.patient'),
            cell: (r: PrescriptionWithPatient) => r.patient?.fullName ?? '—',
          },
        ]
      : []),
    {
      key: 'title',
      header: t('prescriptions.columns.title'),
      cell: (r) => <span className="font-semibold text-gray-900">{r.title}</span>,
    },
    {
      key: 'type',
      header: t('prescriptions.columns.type'),
      cell: (r) => t(`enums.prescriptionType.${r.type}`),
    },
    {
      key: 'print',
      header: t('common.actions'),
      headerClassName: 'text-end',
      cell: (r) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openPrint(`/print/prescription/${r.id}`);
            }}
            aria-label={`${t('prescriptions.print')} — ${r.title}`}
          >
            <Printer className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <DataTable
      caption={t('prescriptions.tabs.issued')}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      onRowClick={(r) => navigate(`/prescriptions/${r.id}`)}
      dense
      pagination={pagination}
      empty={<EmptyState icon={FileText} title={t('prescriptions.empty')} />}
    />
  );
}

function IssuedList() {
  const [page, setPage] = useState(1);
  const list = usePrescriptions({ page, pageSize: 20 });
  return (
    <PrescriptionRows
      rows={list.data?.data}
      loading={list.isPending}
      error={list.error}
      onRetry={() => void list.refetch()}
      pagination={
        list.data && {
          page: list.data.page,
          pageSize: list.data.pageSize,
          total: list.data.total,
          onPageChange: setPage,
        }
      }
    />
  );
}

function TemplatesList({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  const templates = usePrescriptionTemplates();
  const install = useInstallDefaultTemplates();
  const remove = useDeleteTemplate();
  const [editing, setEditing] = useState<PrescriptionTemplate | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PrescriptionTemplate | null>(null);

  const columns: Column<PrescriptionTemplate>[] = [
    {
      key: 'name',
      header: t('prescriptions.fields.name'),
      cell: (x) => <span className="font-semibold text-gray-900">{x.name}</span>,
    },
    {
      key: 'type',
      header: t('prescriptions.fields.type'),
      cell: (x) => t(`enums.prescriptionType.${x.type}`),
    },
    {
      key: 'recs',
      header: t('prescriptions.fields.recommendations'),
      cell: (x) => x.recommendations.length,
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: t('common.actions'),
            headerClassName: 'text-end',
            cell: (x: PrescriptionTemplate) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(x)}
                  aria-label={`${t('common.edit')} ${x.name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-50"
                  onClick={() => setDeleting(x)}
                  aria-label={`${t('common.delete')} ${x.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            loading={install.isPending}
            onClick={() =>
              install.mutate(undefined, {
                onSuccess: ({ added }) =>
                  toast.success(
                    added
                      ? t('prescriptions.installed', { count: added })
                      : t('prescriptions.noneMissing'),
                  ),
                onError: (err) => toast.error(errorText(t, err)),
              })
            }
          >
            <PackagePlus className="h-4 w-4" aria-hidden />
            {t('prescriptions.installDefaults')}
          </Button>
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('prescriptions.templates.add')}
          </Button>
        </div>
      )}
      <DataTable
        caption={t('prescriptions.tabs.templates')}
        columns={columns}
        rows={templates.data}
        rowKey={(x) => x.id}
        loading={templates.isPending}
        error={templates.error}
        onRetry={() => void templates.refetch()}
        onRowClick={canEdit ? (x) => setEditing(x) : undefined}
        dense
        empty={<EmptyState icon={FileText} title={t('prescriptions.emptyTemplates')} />}
      />
      {editing && (
        <TemplateEditorModal
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={t('common.delete')}
        message={t('prescriptions.templates.deleteConfirm', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success(t('prescriptions.templates.deleted'));
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </div>
  );
}
