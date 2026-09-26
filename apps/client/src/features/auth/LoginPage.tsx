import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '@shared';
import { useLogin } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { describedBy } from '../../lib/a11y';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Alert } from '../../components/ui/States';
import { errorText } from '../../lib/errors';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    document.title = `${t('auth.login.title')} | ${t('app.name')}`;
  }, [t]);

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: () => {
        const from =
          (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
        navigate(from, { replace: true });
      },
    }),
  );

  return (
    <AuthLayout>
      <h1 className="text-xl font-bold text-gray-900">{t('auth.login.title')}</h1>
      <p className="mb-6 mt-1 text-sm text-gray-600">{t('auth.login.subtitle')}</p>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {login.error && <Alert>{errorText(t, login.error)}</Alert>}

        <FormField id="login-email" label={t('auth.login.email')} error={errors.email?.message}>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            autoFocus
            ltr
            invalid={!!errors.email}
            aria-describedby={describedBy('login-email', errors.email?.message)}
            {...register('email')}
          />
        </FormField>

        <FormField
          id="login-password"
          label={t('auth.login.password')}
          error={errors.password?.message}
        >
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            invalid={!!errors.password}
            aria-describedby={describedBy('login-password', errors.password?.message)}
            {...register('password')}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={login.isPending}>
          {login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
