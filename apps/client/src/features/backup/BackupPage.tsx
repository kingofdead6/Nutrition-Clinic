import { DatabaseBackup, Download, FileUp, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BACKUP_COLLECTIONS, type BackupImportResult, type StoredBackup } from '@shared';
import { useMe, useLogout } from '../../api/auth';
import {
  downloadStoredBackup,
  useBackupInfo,
  useExportBackup,
  useImportBackup,
} from '../../api/backup';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { Alert, EmptyState, InfoNote } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { formatDateTime } from '../../lib/dates';
import { errorText, translateMessage } from '../../lib/errors';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface RecordError {
  collection: string;
  index: number;
  path: string;
  message: string;
}
const recordErrors = (error: unknown): RecordError[] => {
  const details = (error as { details?: unknown } | null)?.details;
  return Array.isArray(details) ? (details as RecordError[]) : [];
};

export function BackupPage() {
  const { t } = useTranslation();
  const isAdmin = useMe().data?.role === 'admin';

  return (
    <>
      <PageHeader title={t('backup.title')} subtitle={t('backup.subtitle')} />
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ExportCard />
          <ImportCard />
        </div>
      ) : (
        <Card>
          <EmptyState icon={ShieldAlert} title={t('backup.adminOnly')} />
        </Card>
      )}
    </>
  );
}

function ExportCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const info = useBackupInfo();
  const exporter = useExportBackup();
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (name: string) => {
    setDownloading(name);
    try {
      await downloadStoredBackup(name);
    } catch (err) {
      toast.error(errorText(t, err));
    } finally {
      setDownloading(null);
    }
  };

  const columns: Column<StoredBackup>[] = [
    {
      key: 'name',
      header: t('backup.file'),
      cell: (b) => (
        <span dir="ltr" className="font-mono text-xs">
          {b.name}
        </span>
      ),
    },
    { key: 'date', header: t('backup.date'), cell: (b) => formatDateTime(b.createdAt) },
    {
      key: 'size',
      header: t('backup.size'),
      cell: (b) => <span dir="ltr">{formatSize(b.size)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (b) => (
        <Button
          size="sm"
          variant="ghost"
          loading={downloading === b.name}
          onClick={() => void download(b.name)}
          aria-label={t('backup.downloadFile', { name: b.name })}
        >
          <Download className="h-4 w-4" aria-hidden />
          {t('backup.download')}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardTitle>{t('backup.exportTitle')}</CardTitle>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t('backup.exportHint')}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-4">
          <div>
            <p className="text-xs text-gray-600">{t('backup.lastBackup')}</p>
            <p className="font-bold text-gray-900">
              {info.data?.lastBackupAt ? formatDateTime(info.data.lastBackupAt) : t('backup.never')}
            </p>
          </div>
          <Button
            loading={exporter.isPending}
            onClick={() =>
              exporter.mutate(undefined, {
                onSuccess: (name) => toast.success(t('backup.exported', { name })),
                onError: (err) => toast.error(errorText(t, err)),
              })
            }
          >
            <DatabaseBackup className="h-4 w-4" aria-hidden />
            {t('backup.export')}
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={info.data?.backups}
          rowKey={(b) => b.name}
          caption={t('backup.stored')}
          loading={info.isPending}
          error={info.error}
          onRetry={() => void info.refetch()}
          empty={<EmptyState icon={DatabaseBackup} title={t('backup.noBackups')} />}
          dense
        />
      </div>
    </Card>
  );
}

function ImportCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const logout = useLogout();
  const importer = useImportBackup();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BackupImportResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  const check = () => {
    if (!file) return;
    importer.mutate({ file, dryRun: true }, { onSuccess: setPreview });
  };

  const restore = () => {
    if (!file) return;
    importer.mutate(
      { file, dryRun: false },
      {
        onSuccess: () => {
          setConfirming(false);
          toast.success(t('backup.restored'));
          // Accounts and sessions now come from the backup: sign in again.
          logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
        },
        onError: () => setConfirming(false),
      },
    );
  };

  const errors = recordErrors(importer.error);

  return (
    <Card>
      <CardTitle>{t('backup.importTitle')}</CardTitle>
      <div className="space-y-4">
        <Alert>{t('backup.importWarning')}</Alert>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 focus-within:ring-2 focus-within:ring-brand-600 hover:bg-gray-50">
          <FileUp className="h-6 w-6 text-brand-700" aria-hidden />
          <span className="text-sm font-semibold text-gray-800">
            {file ? file.name : t('backup.chooseFile')}
          </span>
          <input
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              importer.reset();
            }}
          />
        </label>

        {importer.error && !confirming && (
          <Alert>
            <p>{errorText(t, importer.error)}</p>
            {errors.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                {errors.map((e, i) => (
                  <li key={i}>
                    <b>
                      {t(`backup.collections.${e.collection}` as 'backup.collections.patients', {
                        defaultValue: e.collection,
                      })}
                    </b>{' '}
                    #{e.index + 1}
                    {e.path && (
                      <span dir="ltr" className="ms-1 font-mono">
                        ({e.path})
                      </span>
                    )}
                    : {translateMessage(t, e.message) || e.message}
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {preview && (
          <div className="space-y-3" aria-live="polite">
            <InfoNote>
              {t('backup.previewOf', {
                date: formatDateTime(preview.createdAt),
                version: preview.appVersion || '—',
              })}
            </InfoNote>
            <table className="w-full text-sm">
              <caption className="sr-only">{t('backup.contents')}</caption>
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th scope="col" className="py-2 text-start font-semibold">
                    {t('backup.collection')}
                  </th>
                  <th scope="col" className="py-2 text-end font-semibold">
                    {t('backup.count')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {BACKUP_COLLECTIONS.map((c) => (
                  <tr key={c} className="border-b border-gray-100">
                    <th scope="row" className="py-1.5 text-start font-normal text-gray-700">
                      {t(`backup.collections.${c}`)}
                    </th>
                    <td className="py-1.5 text-end font-semibold tabular-nums text-gray-900">
                      {preview.counts[c]}
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-1.5 text-start font-normal text-gray-700">
                    {t('backup.files')}
                  </th>
                  <td className="py-1.5 text-end font-semibold tabular-nums text-gray-900">
                    {preview.files}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            disabled={!file}
            loading={importer.isPending && !preview}
            onClick={check}
          >
            {t('backup.check')}
          </Button>
          <Button variant="danger" disabled={!preview} onClick={() => setConfirming(true)}>
            {t('backup.restore')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={t('backup.confirmTitle')}
        message={t('backup.confirmMessage')}
        confirmLabel={t('backup.restore')}
        danger
        loading={importer.isPending}
        onConfirm={restore}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
