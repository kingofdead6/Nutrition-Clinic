import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_SETTINGS, setupSchema } from '@shared';
import { useSetup } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { describedBy } from '../../lib/a11y';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Alert } from '../../components/ui/States';
import { applyServerErrors, errorText } from '../../lib/errors';
import { AuthLayout } from './AuthLayout';

export function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setup = useSetup();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      admin: { name: '', email: '', password: '' },
      clinic: {
        clinicName: DEFAULT_SETTINGS.clinicName,
        tagline: DEFAULT_SETTINGS.tagline,
        practitionerName: '',
        practitionerTitle: DEFAULT_SETTINGS.practitionerTitle,
        phone: '',
        address: '',
      },
    },
  });

  useEffect(() => {
    document.title = t('app.name');
  }, [t]);

  const onSubmit = handleSubmit((values) =>
    setup.mutate(values, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (err) => applyServerErrors(err, setError),
    }),
  );

  const a = errors.admin;
  const c = errors.clinic;

  return (
    <AuthLayout wide>
      <h1 className="text-xl font-bold text-gray-900">
        {t('auth.setup.title', { clinicName: t('app.name') })}
      </h1>
      <p className="mb-6 mt-1 text-sm text-gray-600">{t('auth.setup.subtitle')}</p>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {setup.error && <Alert>{errorText(t, setup.error)}</Alert>}

        <fieldset className="space-y-4">
          <legend className="mb-3 text-base font-bold text-brand-900">
            {t('auth.setup.adminSection')}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="setup-name"
              label={t('auth.setup.name')}
              error={a?.name?.message}
              required
            >
              <Input
                id="setup-name"
                autoComplete="name"
                autoFocus
                invalid={!!a?.name}
                {...register('admin.name')}
              />
            </FormField>
            <FormField
              id="setup-email"
              label={t('auth.setup.email')}
              error={a?.email?.message}
              required
            >
              <Input
                id="setup-email"
                type="email"
                autoComplete="username"
                ltr
                invalid={!!a?.email}
                aria-describedby={describedBy('setup-email', a?.email?.message)}
                {...register('admin.email')}
              />
            </FormField>
            <FormField
              id="setup-password"
              label={t('auth.setup.password')}
              hint={t('auth.setup.passwordHint')}
              error={a?.password?.message}
              required
            >
              <PasswordInput
                id="setup-password"
                autoComplete="new-password"
                invalid={!!a?.password}
                aria-describedby={describedBy(
                  'setup-password',
                  a?.password?.message,
                  t('auth.setup.passwordHint'),
                )}
                {...register('admin.password')}
              />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-base font-bold text-brand-900">
            {t('auth.setup.clinicSection')}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="setup-clinic"
              label={t('auth.setup.clinicName')}
              error={c?.clinicName?.message}
              required
            >
              <Input
                id="setup-clinic"
                invalid={!!c?.clinicName}
                {...register('clinic.clinicName')}
              />
            </FormField>
            <FormField
              id="setup-tagline"
              label={t('auth.setup.tagline')}
              error={c?.tagline?.message}
              optional
            >
              <Input id="setup-tagline" {...register('clinic.tagline')} />
            </FormField>
            <FormField
              id="setup-practitioner"
              label={t('auth.setup.practitionerName')}
              error={c?.practitionerName?.message}
              optional
            >
              <Input id="setup-practitioner" {...register('clinic.practitionerName')} />
            </FormField>
            <FormField
              id="setup-title"
              label={t('auth.setup.practitionerTitle')}
              error={c?.practitionerTitle?.message}
              optional
            >
              <Input id="setup-title" {...register('clinic.practitionerTitle')} />
            </FormField>
            <FormField
              id="setup-phone"
              label={t('auth.setup.phone')}
              error={c?.phone?.message}
              optional
            >
              <Input
                id="setup-phone"
                type="tel"
                autoComplete="tel"
                ltr
                {...register('clinic.phone')}
              />
            </FormField>
            <FormField
              id="setup-address"
              label={t('auth.setup.address')}
              error={c?.address?.message}
              optional
            >
              <Input
                id="setup-address"
                autoComplete="street-address"
                {...register('clinic.address')}
              />
            </FormField>
          </div>
        </fieldset>

        <Button type="submit" className="w-full sm:w-auto" loading={setup.isPending}>
          {setup.isPending ? t('auth.setup.submitting') : t('auth.setup.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
