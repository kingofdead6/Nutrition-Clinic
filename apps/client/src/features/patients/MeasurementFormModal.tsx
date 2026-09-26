import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  bmiCategory,
  computeBmi,
  measurementCreateSchema,
  type Measurement,
  type MeasurementFormValues,
} from '@clinic/shared';
import { useCreateMeasurement, useUpdateMeasurement } from '../../api/measurements';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { applyServerErrors, errorText } from '../../lib/errors';
import { useClinicToday } from '../../lib/useClinicToday';

const toNumberOrNull = (v: unknown) => (v === '' || v == null ? null : Number(v));
const toNumber = (v: unknown) => (v === '' || v == null ? undefined : Number(v));

type NumericField =
  | 'weightKg'
  | 'heightM'
  | 'waistCm'
  | 'hipCm'
  | 'bodyFatPct'
  | 'muscleMassKg'
  | 'visceralFat'
  | 'waterPct';
const OPTIONAL: readonly NumericField[] = [
  'waistCm',
  'hipCm',
  'bodyFatPct',
  'muscleMassKg',
  'visceralFat',
  'waterPct',
];

export function MeasurementFormModal({
  patientId,
  measurement,
  lastHeightM,
  onClose,
}: {
  patientId: string;
  measurement: Measurement | null;
  /** Height rarely changes between visits: prefill it from the last one. */
  lastHeightM?: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const today = useClinicToday();
  const create = useCreateMeasurement(patientId);
  const update = useUpdateMeasurement(patientId);
  const mutation = measurement ? update : create;

  const defaults: MeasurementFormValues = measurement
    ? {
        date: measurement.date,
        weightKg: measurement.weightKg,
        heightM: measurement.heightM,
        waistCm: measurement.waistCm,
        hipCm: measurement.hipCm,
        bodyFatPct: measurement.bodyFatPct,
        muscleMassKg: measurement.muscleMassKg,
        visceralFat: measurement.visceralFat,
        waterPct: measurement.waterPct,
        notes: measurement.notes,
      }
    : { date: today, weightKg: Number.NaN, heightM: lastHeightM ?? Number.NaN, notes: '' };

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(measurementCreateSchema), defaultValues: defaults });

  const [weight, height] = useWatch({ control, name: ['weightKg', 'heightM'] });
  let preview: string | null = null;
  if (Number(weight) > 0 && Number(height) >= 0.4 && Number(height) <= 2.5) {
    const bmi = computeBmi(Number(weight), Number(height));
    preview = t('measurements.bmiPreview', {
      bmi,
      category: t(`enums.bmiCategory.${bmiCategory(bmi)}`),
    });
  }

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: () => {
        toast.success(t(measurement ? 'measurements.updated' : 'measurements.created'));
        onClose();
      },
      onError: (err: unknown) => {
        applyServerErrors(err, setError);
      },
    };
    if (measurement) update.mutate({ id: measurement.id, ...values }, options);
    else create.mutate(values, options);
  });

  const numberField = (
    name: NumericField,
    opts: { step: string; required?: boolean; hint?: string },
  ) => (
    <FormField
      id={`m-${name}`}
      label={t(`measurements.fields.${name}`)}
      error={errors[name]?.message}
      hint={opts.hint}
      required={opts.required}
      optional={!opts.required}
    >
      <Input
        id={`m-${name}`}
        type="number"
        inputMode="decimal"
        step={opts.step}
        ltr
        invalid={!!errors[name]}
        {...register(name, { setValueAs: OPTIONAL.includes(name) ? toNumberOrNull : toNumber })}
      />
    </FormField>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={measurement ? t('measurements.edit') : t('measurements.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="measurement-form" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="measurement-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {mutation.error && !Object.keys(errors).length && (
          <Alert>{errorText(t, mutation.error)}</Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="m-date"
            label={t('measurements.fields.date')}
            error={errors.date?.message}
            required
          >
            <DatePicker id="m-date" max={today} invalid={!!errors.date} {...register('date')} />
          </FormField>
          {numberField('weightKg', { step: '0.1', required: true })}
          {numberField('heightM', {
            step: '0.01',
            required: true,
            hint: t('measurements.heightHint'),
          })}
          {numberField('waistCm', { step: '0.5' })}
          {numberField('hipCm', { step: '0.5' })}
          {numberField('bodyFatPct', { step: '0.1' })}
          {numberField('muscleMassKg', { step: '0.1' })}
          {numberField('visceralFat', { step: '1' })}
          {numberField('waterPct', { step: '0.1' })}
        </div>
        <p aria-live="polite" className="min-h-5 text-sm font-semibold text-brand-800">
          {preview}
        </p>
        <FormField id="m-notes" label={t('measurements.fields.notes')} optional>
          <Textarea id="m-notes" rows={2} {...register('notes')} />
        </FormField>
      </form>
    </Modal>
  );
}
