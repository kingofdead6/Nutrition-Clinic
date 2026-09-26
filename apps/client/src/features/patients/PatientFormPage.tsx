import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ACTIVITY_LEVELS,
  ageOn,
  CHRONIC_CONDITIONS,
  GENDERS,
  PATIENT_GOALS,
  PATIENT_STATUSES,
  patientCreateSchema,
  type Patient,
  type PatientCreateFormValues,
} from '@clinic/shared';
import { useCreatePatient, usePatient, useUpdatePatient } from '../../api/patients';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingBlock } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';
import { TagInput } from '../../components/ui/TagInput';
import { useToast } from '../../components/ui/useToast';
import { applyServerErrors, errorText } from '../../lib/errors';
import { useClinicToday } from '../../lib/useClinicToday';

const EMPTY: PatientCreateFormValues = {
  firstName: '',
  lastName: '',
  gender: 'female',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  occupation: '',
  chronicConditions: [],
  medicalNotes: '',
  allergies: [],
  medications: [],
  activityLevel: 'sedentary',
  goal: 'weight_loss',
  targetWeightKg: null,
  statusOverride: null,
};

const toFormValues = (p: Patient): PatientCreateFormValues => ({
  firstName: p.firstName,
  lastName: p.lastName,
  gender: p.gender,
  birthDate: p.birthDate,
  phone: p.phone,
  email: p.email,
  address: p.address,
  occupation: p.occupation,
  chronicConditions: p.chronicConditions,
  medicalNotes: p.medicalNotes,
  allergies: p.allergies,
  medications: p.medications,
  activityLevel: p.activityLevel,
  goal: p.goal,
  targetWeightKg: p.targetWeightKg,
  statusOverride: p.statusOverride,
});

/** `/patients/new` and `/patients/:id/edit`. */
export function PatientFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const patient = usePatient(id);

  if (!id) return <PatientForm />;
  if (patient.isPending) return <LoadingBlock label={t('common.loading')} />;
  if (patient.isError)
    return <ErrorState error={patient.error} onRetry={() => void patient.refetch()} />;
  return <PatientForm patient={patient.data} />;
}

const emptyToNull = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

function PatientForm({ patient }: { patient?: Patient }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const today = useClinicToday();
  const create = useCreatePatient();
  const update = useUpdatePatient(patient?.id ?? '');
  const mutation = patient ? update : create;

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: patient ? toFormValues(patient) : EMPTY,
  });
  const birthDate = useWatch({ control, name: 'birthDate' });
  const age =
    birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && birthDate <= today
      ? ageOn(birthDate, today)
      : null;

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: (saved: Patient) => {
        toast.success(t(patient ? 'patients.form.updated' : 'patients.form.created'));
        navigate(`/patients/${saved.id}`, { replace: !!patient });
      },
      onError: (err: unknown) => {
        if (!applyServerErrors(err, setError)) toast.error(errorText(t, err));
      },
    };
    if (patient) update.mutate(values, options);
    else create.mutate(values, options);
  });

  const title = patient ? t('patients.form.editTitle') : t('patients.form.newTitle');
  const f = (key: keyof PatientCreateFormValues) => t(`patients.fields.${key}`);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={patient ? `${patient.fullName} · ${patient.fileNumber}` : undefined}
      />
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>{t('patients.form.identity')}</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="pf-first"
              label={f('firstName')}
              error={errors.firstName?.message}
              required
            >
              <Input
                id="pf-first"
                autoFocus
                invalid={!!errors.firstName}
                {...register('firstName')}
              />
            </FormField>
            <FormField id="pf-last" label={f('lastName')} error={errors.lastName?.message} required>
              <Input id="pf-last" invalid={!!errors.lastName} {...register('lastName')} />
            </FormField>
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-gray-700">
                {f('gender')}{' '}
                <span className="text-red-600" aria-hidden>
                  *
                </span>
              </legend>
              <div className="flex h-10 items-center gap-5">
                {GENDERS.map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value={g}
                      className="h-4 w-4 accent-brand-700"
                      {...register('gender')}
                    />
                    {t(`enums.gender.${g}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <FormField
              id="pf-birth"
              label={f('birthDate')}
              error={errors.birthDate?.message}
              hint={age !== null ? t('patients.form.ageHint', { age }) : undefined}
              required
            >
              <DatePicker
                id="pf-birth"
                max={today}
                invalid={!!errors.birthDate}
                {...register('birthDate')}
              />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardTitle>{t('patients.form.contact')}</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="pf-phone" label={f('phone')} error={errors.phone?.message} required>
              <Input
                id="pf-phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                ltr
                placeholder="0555123456"
                invalid={!!errors.phone}
                {...register('phone')}
              />
            </FormField>
            <FormField id="pf-email" label={f('email')} error={errors.email?.message} optional>
              <Input
                id="pf-email"
                type="email"
                ltr
                invalid={!!errors.email}
                {...register('email')}
              />
            </FormField>
            <FormField
              id="pf-address"
              label={f('address')}
              error={errors.address?.message}
              optional
            >
              <Input id="pf-address" {...register('address')} />
            </FormField>
            <FormField
              id="pf-occupation"
              label={f('occupation')}
              error={errors.occupation?.message}
              optional
            >
              <Input id="pf-occupation" {...register('occupation')} />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardTitle>{t('patients.form.health')}</CardTitle>
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-gray-700">
                {f('chronicConditions')}
              </legend>
              <Controller
                control={control}
                name="chronicConditions"
                render={({ field }) => {
                  const selected = field.value ?? [];
                  return (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {CHRONIC_CONDITIONS.map((c) => (
                        <label key={c} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selected.includes(c)}
                            onChange={(e) =>
                              field.onChange(
                                e.target.checked
                                  ? [...selected, c]
                                  : selected.filter((x) => x !== c),
                              )
                            }
                          />
                          {t(`enums.chronicCondition.${c}`)}
                        </label>
                      ))}
                    </div>
                  );
                }}
              />
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="pf-allergies" label={f('allergies')}>
                <Controller
                  control={control}
                  name="allergies"
                  render={({ field }) => (
                    <TagInput
                      id="pf-allergies"
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormField>
              <FormField id="pf-meds" label={f('medications')}>
                <Controller
                  control={control}
                  name="medications"
                  render={({ field }) => (
                    <TagInput id="pf-meds" value={field.value ?? []} onChange={field.onChange} />
                  )}
                />
              </FormField>
            </div>
            <FormField id="pf-activity" label={f('activityLevel')}>
              <Select id="pf-activity" {...register('activityLevel')}>
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a} value={a}>
                    {t(`enums.activityLevel.${a}`)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="pf-notes"
              label={f('medicalNotes')}
              error={errors.medicalNotes?.message}
              optional
            >
              <Textarea id="pf-notes" rows={3} {...register('medicalNotes')} />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardTitle>{t('patients.form.goals')}</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="pf-goal" label={f('goal')} required>
              <Select id="pf-goal" {...register('goal')}>
                {PATIENT_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {t(`enums.goal.${g}`)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="pf-target"
              label={f('targetWeightKg')}
              error={errors.targetWeightKg?.message}
              optional
            >
              <Input
                id="pf-target"
                type="number"
                step="0.1"
                inputMode="decimal"
                ltr
                invalid={!!errors.targetWeightKg}
                {...register('targetWeightKg', { setValueAs: emptyToNull })}
              />
            </FormField>
            <FormField
              id="pf-status"
              label={f('statusOverride')}
              hint={t('patients.form.statusHint')}
              className="sm:col-span-2"
            >
              <Select
                id="pf-status"
                {...register('statusOverride', { setValueAs: (v) => v || null })}
              >
                <option value="">{t('patients.fields.statusAuto')}</option>
                {PATIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`enums.patientStatus.${s}`)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </Card>

        <div className="flex gap-3 xl:col-span-2">
          <Button type="submit" loading={mutation.isPending}>
            {patient ? t('common.save') : t('patients.add')}
          </Button>
          <ButtonLink variant="secondary" to={patient ? `/patients/${patient.id}` : '/patients'}>
            {t('common.cancel')}
          </ButtonLink>
        </div>
      </form>
    </>
  );
}
