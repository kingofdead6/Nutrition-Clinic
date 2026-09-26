import { Leaf } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '../../api/auth';
import { ClinicLogo } from '../../components/layout/ClinicLogo';
import { cn } from '../../lib/cn';

/** Branded full-page frame for the login and first-run screens. */
export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = useTranslation();
  const clinic = useAuthStatus().data?.clinic;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-gray-50 px-4 py-10">
      <div className={cn('w-full', wide ? 'max-w-3xl' : 'max-w-md')}>
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <ClinicLogo logoUrl={clinic?.logoUrl} className="h-20 w-20" />
          <div>
            <p className="text-2xl font-extrabold text-brand-900">
              {clinic?.clinicName ?? t('app.name')}
            </p>
            <p className="text-sm text-brand-700">{clinic?.tagline ?? t('app.tagline')}</p>
          </div>
        </div>
        <main className="rounded-2xl bg-white p-6 shadow-card sm:p-8">{children}</main>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-brand-800">
          <Leaf className="h-4 w-4" aria-hidden />
          {t('app.quote')}
        </p>
      </div>
    </div>
  );
}
