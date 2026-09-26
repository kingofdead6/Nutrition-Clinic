import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { clinicSettingsInputSchema, type ClinicSettingsResponse } from '@clinic/shared';
import { useUpdateSettings } from '../../api/settings';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Checkbox, Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/useToast';
import { applyServerErrors, errorText, translateMessage } from '../../lib/errors';

const schema = clinicSettingsInputSchema.pick({
  practitionerName: true,
  practitionerTitle: true,
  defaultAppointmentDurationMin: true,
  workingHours: true,
});

export function PractitionerTab({
  settings,
  readOnly,
}: {
  settings: ClinicSettingsResponse;
  readOnly: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateSettings();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      practitionerName: settings.practitionerName,
      practitionerTitle: settings.practitionerTitle,
      defaultAppointmentDurationMin: settings.defaultAppointmentDurationMin,
      workingHours: settings.workingHours,
    },
  });
  const hours = useWatch({ control, name: 'workingHours' });
  const title = useWatch({ control, name: 'practitionerTitle' });

  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: (saved) => {
        reset(schema.parse(saved));
        toast.success(t('common.saved'));
      },
      onError: (err) => {
        if (!applyServerErrors(err, setError)) toast.error(errorText(t, err));
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset disabled={readOnly} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="s-pname"
            label={t('settings.practitioner.practitionerName')}
            error={errors.practitionerName?.message}
          >
            <Input id="s-pname" {...register('practitionerName')} />
          </FormField>
          <FormField
            id="s-ptitle"
            label={t('settings.practitioner.practitionerTitle')}
            hint={t('settings.practitioner.titleHint', { title: title || '…' })}
            error={errors.practitionerTitle?.message}
          >
            <Input id="s-ptitle" {...register('practitionerTitle')} />
          </FormField>
          <FormField
            id="s-duration"
            label={t('settings.practitioner.defaultDuration')}
            error={errors.defaultAppointmentDurationMin?.message}
          >
            <Input
              id="s-duration"
              type="number"
              min={5}
              max={240}
              step={5}
              ltr
              invalid={!!errors.defaultAppointmentDurationMin}
              {...register('defaultAppointmentDurationMin', { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-gray-900">
            {t('settings.practitioner.workingHours')}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2 text-start font-semibold">
                    {t('settings.practitioner.day')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-semibold">
                    {t('settings.practitioner.open')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-semibold">
                    {t('settings.practitioner.from')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-semibold">
                    {t('settings.practitioner.to')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settings.workingHours.map((wd, i) => {
                  const isOpen = hours?.[i]?.isOpen ?? wd.isOpen;
                  const dayLabel = t(`enums.weekday.${wd.day}`);
                  const closeError = errors.workingHours?.[i]?.close?.message;
                  return (
                    <tr key={wd.day}>
                      <th scope="row" className="px-4 py-2 text-start font-medium text-gray-800">
                        {dayLabel}
                      </th>
                      <td className="px-4 py-2">
                        <label className="inline-flex items-center gap-2">
                          <Checkbox {...register(`workingHours.${i}.isOpen`)} />
                          <span className="text-gray-600">
                            {isOpen ? '' : t('settings.practitioner.closed')}
                          </span>
                          <span className="sr-only">{`${t('settings.practitioner.open')} — ${dayLabel}`}</span>
                        </label>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="time"
                          ltr
                          disabled={!isOpen}
                          aria-label={`${t('settings.practitioner.from')} — ${dayLabel}`}
                          className="w-32"
                          {...register(`workingHours.${i}.open`)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="time"
                          ltr
                          disabled={!isOpen}
                          invalid={!!closeError}
                          aria-label={`${t('settings.practitioner.to')} — ${dayLabel}`}
                          className="w-32"
                          {...register(`workingHours.${i}.close`)}
                        />
                        {closeError && (
                          <p role="alert" className="mt-1 text-xs text-red-600">
                            {translateMessage(t, closeError)}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </fieldset>
      {!readOnly && (
        <Button type="submit" loading={update.isPending} disabled={!isDirty}>
          {t('common.save')}
        </Button>
      )}
    </form>
  );
}
