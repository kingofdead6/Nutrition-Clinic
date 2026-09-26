import { Check, Pencil, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import type { PrescriptionWithPatient } from '@clinic/shared';
import {
  useDeletePrescription,
  usePrescription,
  useUpdatePrescription,
} from '../../api/prescriptions';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { LinesEditor, RichTextEditor } from '../../components/ui/RichText';
import { LoadingBlock } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';
import { openPrint } from '../../lib/print';
import { useCanEditClinical } from '../../lib/roles';
import { PrescriptionDocument } from '../print/PrescriptionDocument';

export function PrescriptionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const rx = usePrescription(id);
  if (rx.isPending) return <LoadingBlock label={t('common.loading')} />;
  if (rx.isError) return <ErrorState error={rx.error} onRetry={() => void rx.refetch()} />;
  return <PrescriptionDetail key={rx.data.updatedAt} rx={rx.data} />;
}

function PrescriptionDetail({ rx }: { rx: PrescriptionWithPatient }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const canEdit = useCanEditClinical();
  const update = useUpdatePrescription();
  const remove = useDeletePrescription();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(rx);

  const save = () =>
    update.mutate(
      {
        id: rx.id,
        title: draft.title,
        date: draft.date,
        renderedContent: draft.renderedContent,
        recommendations: draft.recommendations,
        foodsToAvoid: draft.foodsToAvoid,
        foodsToFavor: draft.foodsToFavor,
      },
      {
        onSuccess: () => {
          toast.success(t('prescriptions.updated'));
          setEditing(false);
        },
        onError: (err) => toast.error(errorText(t, err)),
      },
    );

  return (
    <>
      <PageHeader
        title={rx.title}
        subtitle={rx.patient?.fullName}
        actions={
          <>
            <Button onClick={() => openPrint(`/print/prescription/${rx.id}`)}>
              <Printer className="h-4 w-4" aria-hidden />
              {t('prescriptions.print')}
            </Button>
            {canEdit &&
              (editing ? (
                <Button variant="secondary" loading={update.isPending} onClick={save}>
                  <Check className="h-4 w-4" aria-hidden />
                  {t('common.save')}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  {t('prescriptions.edit')}
                </Button>
              ))}
            {canEdit && (
              <Button
                variant="ghost"
                className="text-red-700 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('common.delete')}
              </Button>
            )}
          </>
        }
      />

      {editing ? (
        <Card>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="rx-title" label={t('prescriptions.fields.title')}>
                <Input
                  id="rx-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </FormField>
              <FormField id="rx-date" label={t('prescriptions.fields.date')}>
                <DatePicker
                  id="rx-date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </FormField>
            </div>
            <div>
              <p id="rx-body-label" className="mb-1.5 text-sm font-medium text-gray-700">
                {t('prescriptions.fields.body')}
              </p>
              <RichTextEditor
                id="rx-body"
                labelledBy="rx-body-label"
                value={draft.renderedContent}
                onChange={(html) => setDraft((d) => ({ ...d, renderedContent: html }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {(['recommendations', 'foodsToFavor', 'foodsToAvoid'] as const).map((key) => (
                <FormField
                  key={key}
                  id={`rx-${key}`}
                  label={t(`prescriptions.fields.${key}`)}
                  hint={t('prescriptions.fields.linesHint')}
                >
                  <LinesEditor
                    id={`rx-${key}`}
                    value={draft[key]}
                    onChange={(lines) => setDraft((d) => ({ ...d, [key]: lines }))}
                    rows={6}
                  />
                </FormField>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mx-auto max-w-[190mm] rounded-lg border border-gray-200 p-8 text-[13px]">
            <PrescriptionDocument doc={rx} patient={rx.patient} />
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t('prescriptions.deleteTitle')}
        message={t('prescriptions.deleteConfirm')}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(rx.id, {
            onSuccess: () => {
              toast.success(t('prescriptions.deleted'));
              navigate(
                rx.patient ? `/patients/${rx.patient.id}?tab=prescriptions` : '/prescriptions',
                { replace: true },
              );
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </>
  );
}
