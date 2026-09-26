import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  clinicSettingsInputSchema,
  UPLOAD_IMAGE_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  type ClinicSettingsResponse,
} from '@clinic/shared';
import { useRemoveLogo, useUpdateSettings, useUploadLogo } from '../../api/settings';
import { ClinicLogo } from '../../components/layout/ClinicLogo';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField } from '../../components/ui/FormField';
import { Input, Textarea } from '../../components/ui/Input';
import { useToast } from '../../components/ui/useToast';
import { applyServerErrors, errorText } from '../../lib/errors';

const schema = clinicSettingsInputSchema.pick({
  clinicName: true,
  tagline: true,
  address: true,
  phone: true,
  email: true,
  printFooterText: true,
});

export function ClinicInfoTab({
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
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      clinicName: settings.clinicName,
      tagline: settings.tagline,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      printFooterText: settings.printFooterText,
    },
  });

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
    <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="s-clinicName"
            label={t('settings.clinic.clinicName')}
            error={errors.clinicName?.message}
            required
          >
            <Input id="s-clinicName" invalid={!!errors.clinicName} {...register('clinicName')} />
          </FormField>
          <FormField
            id="s-tagline"
            label={t('settings.clinic.tagline')}
            error={errors.tagline?.message}
          >
            <Input id="s-tagline" {...register('tagline')} />
          </FormField>
          <FormField id="s-phone" label={t('settings.clinic.phone')} error={errors.phone?.message}>
            <Input id="s-phone" type="tel" ltr {...register('phone')} />
          </FormField>
          <FormField id="s-email" label={t('settings.clinic.email')} error={errors.email?.message}>
            <Input id="s-email" type="email" ltr {...register('email')} />
          </FormField>
          <FormField
            id="s-address"
            label={t('settings.clinic.address')}
            error={errors.address?.message}
            className="sm:col-span-2"
          >
            <Input id="s-address" {...register('address')} />
          </FormField>
          <FormField
            id="s-footer"
            label={t('settings.clinic.printFooterText')}
            hint={t('settings.clinic.printFooterHint')}
            error={errors.printFooterText?.message}
            className="sm:col-span-2"
          >
            <Textarea id="s-footer" rows={2} {...register('printFooterText')} />
          </FormField>
        </fieldset>
        {!readOnly && (
          <Button type="submit" loading={update.isPending} disabled={!isDirty}>
            {t('common.save')}
          </Button>
        )}
      </form>

      <LogoCard settings={settings} readOnly={readOnly} />
    </div>
  );
}

function LogoCard({ settings, readOnly }: { settings: ClinicSettingsResponse; readOnly: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  const upload = useUploadLogo();
  const remove = useRemoveLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!(UPLOAD_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t('errors.imageType'));
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      toast.error(t('errors.fileTooLarge'));
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(t('settings.clinic.logoUpdated')),
      onError: (err) => toast.error(errorText(t, err)),
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 p-5 text-center">
      <p className="text-sm font-semibold text-gray-800">{t('settings.clinic.logo')}</p>
      <ClinicLogo logoUrl={settings.logoUrl} className="h-28 w-28 ring-1 ring-gray-200" />
      <p className="text-xs text-gray-500">{t('settings.clinic.logoHint')}</p>
      {!readOnly && (
        <div className="flex flex-wrap justify-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={UPLOAD_IMAGE_MIME_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {t('settings.clinic.changeLogo')}
          </Button>
          {settings.logoUrl && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('settings.clinic.removeLogo')}
            </Button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={t('settings.clinic.removeLogo')}
        message={t('settings.clinic.removeLogoConfirm')}
        confirmLabel={t('common.remove')}
        danger
        loading={remove.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmOpen(false);
              toast.success(t('settings.clinic.logoRemoved'));
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </div>
  );
}
