import { FileUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FoodImportResult } from '@clinic/shared';
import { useImportFoods } from '../../api/foods';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert, InfoNote } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText, translateMessage } from '../../lib/errors';

/** Two steps: check the file (dry run), then import. */
export function FoodImportModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const importer = useImportFoods();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FoodImportResult | null>(null);

  const run = (dryRun: boolean) => {
    if (!file) return;
    importer.mutate(
      { file, dryRun },
      {
        onSuccess: (result) => {
          if (dryRun) setPreview(result);
          else {
            toast.success(
              t('foods.importResult', { imported: result.imported, skipped: result.skipped }),
            );
            onClose();
          }
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('foods.importTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="secondary"
            disabled={!file}
            loading={importer.isPending && !preview}
            onClick={() => run(true)}
          >
            {t('foods.check')}
          </Button>
          <Button
            disabled={!preview || preview.imported === 0}
            loading={importer.isPending && !!preview}
            onClick={() => run(false)}
          >
            {t('foods.doImport')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <InfoNote>
          <p>{t('foods.importHint')}</p>
          <p className="mt-1 text-xs" dir="ltr">
            {t('foods.categoriesHint')}
          </p>
        </InfoNote>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 hover:bg-gray-50">
          <FileUp className="h-6 w-6 text-brand-700" aria-hidden />
          <span className="text-sm font-semibold text-gray-800">
            {file ? file.name : t('foods.chooseFile')}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              importer.reset();
            }}
          />
        </label>

        {importer.error && <Alert>{errorText(t, importer.error)}</Alert>}

        {preview && (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm font-semibold text-gray-900">
              {t('foods.dryRunResult', {
                imported: preview.imported,
                skipped: preview.skipped,
                errors: preview.errors.length,
              })}
            </p>
            {preview.errors.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-800">
                {preview.errors.map((e) => (
                  <li key={e.line}>
                    <b>{t('foods.errorLine', { line: e.line })}</b>:{' '}
                    {translateMessage(t, e.message)}
                    {e.details && (
                      <span className="ms-1 text-red-600" dir="ltr">
                        ({e.details})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
