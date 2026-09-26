import { Eye, Printer, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { PrescriptionPreview } from '@clinic/shared';
import { usePatientPlans } from '../../api/dietPlans';
import { usePatient } from '../../api/patients';
import {
  useCreatePrescription,
  usePreviewPrescription,
  usePrescriptionTemplates,
} from '../../api/prescriptions';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Alert, InfoNote } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';
import { openPrint } from '../../lib/print';
import { useClinicToday } from '../../lib/useClinicToday';
import { PatientCombobox, type PatientChoice } from '../appointments/PatientCombobox';
import { PrescriptionDocument } from '../print/PrescriptionDocument';

/** Issue flow: patient + template (+ plan, date) → preview → save (and print). */
export function IssuePrescriptionPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const today = useClinicToday();
  const [params] = useSearchParams();
  const preset = usePatient(params.get('patientId') ?? undefined).data;
  const templates = usePrescriptionTemplates();
  const previewer = usePreviewPrescription();
  const create = useCreatePrescription();

  const [picked, setPicked] = useState<PatientChoice | null | undefined>(undefined);
  const patient: PatientChoice | null =
    picked !== undefined
      ? picked
      : preset
        ? {
            id: preset.id,
            fullName: preset.fullName,
            fileNumber: preset.fileNumber,
            phone: preset.phone,
          }
        : null;
  const plans = usePatientPlans(patient?.id);
  const [templateId, setTemplateId] = useState('');
  const [dietPlanId, setDietPlanId] = useState('');
  const [date, setDate] = useState(today);
  const [preview, setPreview] = useState<PrescriptionPreview | null>(null);
  const fullPatient = usePatient(patient?.id).data;

  const input =
    patient && templateId
      ? { patientId: patient.id, templateId, dietPlanId: dietPlanId || null, date }
      : null;
  const reset = () => setPreview(null);

  const save = (andPrint: boolean) =>
    input &&
    create.mutate(input, {
      onSuccess: (rx) => {
        toast.success(t('prescriptions.created'));
        if (andPrint) openPrint(`/print/prescription/${rx.id}`);
        navigate(`/prescriptions/${rx.id}`, { replace: true });
      },
      onError: (err) => toast.error(errorText(t, err)),
    });

  return (
    <>
      <PageHeader title={t('prescriptions.issueTitle')} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="self-start">
          <div className="space-y-4">
            <FormField id="rx-patient" label={t('prescriptions.fields.patient')} required>
              <PatientCombobox
                id="rx-patient"
                value={patient}
                onChange={(p) => {
                  setPicked(p);
                  setDietPlanId('');
                  reset();
                }}
              />
            </FormField>
            <FormField id="rx-template" label={t('prescriptions.fields.template')} required>
              <Select
                id="rx-template"
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  reset();
                }}
              >
                <option value="">—</option>
                {templates.data?.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="rx-plan" label={t('prescriptions.fields.plan')}>
              <Select
                id="rx-plan"
                value={dietPlanId}
                disabled={!patient}
                onChange={(e) => {
                  setDietPlanId(e.target.value);
                  reset();
                }}
              >
                <option value="">{t('prescriptions.fields.planAuto')}</option>
                {plans.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {`${p.title} · ${p.dailyCalories} ${t('common.kcal')}`}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="rx-date" label={t('prescriptions.fields.date')}>
              <DatePicker
                id="rx-date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  reset();
                }}
              />
            </FormField>
            {previewer.error && <Alert>{errorText(t, previewer.error)}</Alert>}
            <Button
              variant="secondary"
              className="w-full"
              disabled={!input}
              loading={previewer.isPending}
              onClick={() => input && previewer.mutate(input, { onSuccess: setPreview })}
            >
              <Eye className="h-4 w-4" aria-hidden />
              {t('prescriptions.preview')}
            </Button>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!preview}
                loading={create.isPending}
                onClick={() => save(false)}
              >
                <Save className="h-4 w-4" aria-hidden />
                {t('prescriptions.save')}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!preview}
                loading={create.isPending}
                onClick={() => save(true)}
              >
                <Printer className="h-4 w-4" aria-hidden />
                {t('prescriptions.saveAndPrint')}
              </Button>
            </div>
          </div>
        </Card>

        <Card aria-live="polite">
          <CardTitle>{t('prescriptions.preview')}</CardTitle>
          {preview ? (
            <div className="mx-auto max-w-[190mm] rounded-lg border border-gray-200 p-8 text-[13px] shadow-sm">
              <PrescriptionDocument doc={preview} patient={fullPatient ?? null} />
            </div>
          ) : (
            <InfoNote>{t('prescriptions.previewHint')}</InfoNote>
          )}
        </Card>
      </div>
    </>
  );
}
