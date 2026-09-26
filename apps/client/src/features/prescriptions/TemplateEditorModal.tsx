import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRESCRIPTION_PLACEHOLDERS,
  PRESCRIPTION_TYPES,
  type PrescriptionTemplate,
  type PrescriptionType,
} from '@clinic/shared';
import { useCreateTemplate, useUpdateTemplate } from '../../api/prescriptions';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  LinesEditor,
  RichTextEditor,
  type RichTextEditorHandle,
} from '../../components/ui/RichText';
import { Alert } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';

export function TemplateEditorModal({
  template,
  onClose,
}: {
  template: PrescriptionTemplate | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const mutation = template ? update : create;
  const editor = useRef<RichTextEditorHandle>(null);
  const [name, setName] = useState(template?.name ?? '');
  const [type, setType] = useState<PrescriptionType>(template?.type ?? 'custom');
  const [body, setBody] = useState(template?.bodyRichText ?? '');
  const [recommendations, setRecommendations] = useState(template?.recommendations ?? []);
  const [foodsToAvoid, setFoodsToAvoid] = useState(template?.foodsToAvoid ?? []);
  const [foodsToFavor, setFoodsToFavor] = useState(template?.foodsToFavor ?? []);
  const [nameError, setNameError] = useState<string | undefined>();

  const save = () => {
    if (!name.trim()) return setNameError('validation.required');
    const input = {
      name: name.trim(),
      type,
      bodyRichText: body,
      recommendations,
      foodsToAvoid,
      foodsToFavor,
    };
    const done = {
      onSuccess: () => {
        toast.success(
          t(template ? 'prescriptions.templates.updated' : 'prescriptions.templates.created'),
        );
        onClose();
      },
      onError: (err: unknown) => toast.error(errorText(t, err)),
    };
    if (template) update.mutate({ id: template.id, ...input }, done);
    else create.mutate(input, done);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={template ? t('prescriptions.templates.edit') : t('prescriptions.templates.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={mutation.isPending} onClick={save}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {mutation.error && <Alert>{errorText(t, mutation.error)}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="tpl-name"
            label={t('prescriptions.fields.name')}
            error={nameError}
            required
          >
            <Input
              id="tpl-name"
              value={name}
              invalid={!!nameError}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(undefined);
              }}
            />
          </FormField>
          <FormField id="tpl-type" label={t('prescriptions.fields.type')}>
            <Select
              id="tpl-type"
              value={type}
              onChange={(e) => setType(e.target.value as PrescriptionType)}
            >
              {PRESCRIPTION_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`enums.prescriptionType.${v}`)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div>
          <p id="tpl-body-label" className="mb-1.5 text-sm font-medium text-gray-700">
            {t('prescriptions.fields.body')}
          </p>
          <RichTextEditor
            ref={editor}
            id="tpl-body"
            labelledBy="tpl-body-label"
            value={body}
            onChange={setBody}
          />
          <div className="mt-2 rounded-lg bg-pastel-blue p-3">
            <p className="text-xs font-bold text-gray-800">
              {t('prescriptions.templates.placeholders')}
            </p>
            <p className="mb-2 text-xs text-gray-600">
              {t('prescriptions.templates.placeholdersHint')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESCRIPTION_PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.current?.insertText(`{{${p}}}`)}
                  className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-800 ring-1 ring-blue-200 hover:bg-blue-50"
                  title={`{{${p}}}`}
                >
                  {t(`prescriptions.placeholder.${p}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              ['recommendations', recommendations, setRecommendations],
              ['foodsToFavor', foodsToFavor, setFoodsToFavor],
              ['foodsToAvoid', foodsToAvoid, setFoodsToAvoid],
            ] as const
          ).map(([key, value, setter]) => (
            <FormField
              key={key}
              id={`tpl-${key}`}
              label={t(`prescriptions.fields.${key}`)}
              hint={t('prescriptions.fields.linesHint')}
            >
              <LinesEditor id={`tpl-${key}`} value={value} onChange={setter} rows={6} />
            </FormField>
          ))}
        </div>
      </div>
    </Modal>
  );
}
