import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { passwordChangeSchema, profileUpdateSchema, type User } from '@clinic/shared';
import { useChangePassword, useMe, useUpdateProfile } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useToast } from '../../components/ui/useToast';
import { applyServerErrors, errorText } from '../../lib/errors';

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useMe().data;
  if (!user) return null;
  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <ProfileCard user={user} />
        <PasswordCard />
      </div>
    </>
  );
}

function ProfileCard({ user }: { user: User }) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    values: { name: user.name, email: user.email },
  });

  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: () => toast.success(t('profile.profileUpdated')),
      onError: (err) => {
        if (!applyServerErrors(err, setError)) toast.error(errorText(t, err));
      },
    }),
  );

  return (
    <Card>
      <CardTitle>{t('profile.infoSection')}</CardTitle>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField id="p-name" label={t('profile.name')} error={errors.name?.message} required>
          <Input id="p-name" autoComplete="name" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField id="p-email" label={t('profile.email')} error={errors.email?.message} required>
          <Input
            id="p-email"
            type="email"
            autoComplete="username"
            ltr
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>
        <p className="text-sm text-gray-600">
          {t('profile.role')}:{' '}
          <span className="font-semibold text-gray-900">{t(`enums.role.${user.role}`)}</span>
        </p>
        <Button type="submit" loading={update.isPending} disabled={!isDirty}>
          {t('common.save')}
        </Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) =>
    change.mutate(values, {
      onSuccess: () => {
        reset();
        toast.success(t('profile.passwordChanged'));
      },
      onError: (err) => {
        if (!applyServerErrors(err, setError)) toast.error(errorText(t, err));
      },
    }),
  );

  return (
    <Card>
      <CardTitle>{t('profile.passwordSection')}</CardTitle>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          id="p-current"
          label={t('profile.currentPassword')}
          error={errors.currentPassword?.message}
          required
        >
          <PasswordInput
            id="p-current"
            autoComplete="current-password"
            invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </FormField>
        <FormField
          id="p-new"
          label={t('profile.newPassword')}
          hint={t('auth.setup.passwordHint')}
          error={errors.newPassword?.message}
          required
        >
          <PasswordInput
            id="p-new"
            autoComplete="new-password"
            invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
        </FormField>
        <FormField
          id="p-confirm"
          label={t('profile.confirmPassword')}
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="p-confirm"
            autoComplete="new-password"
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>
        <Button type="submit" loading={change.isPending}>
          {t('profile.changePassword')}
        </Button>
      </form>
    </Card>
  );
}
