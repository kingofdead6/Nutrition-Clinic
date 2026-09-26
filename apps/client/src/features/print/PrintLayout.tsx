import { ArrowRight, Printer } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { formatDateOnly, type ClinicSettingsResponse } from '@shared';
import { useSettings } from '../../api/settings';
import { ClinicLogo } from '../../components/layout/ClinicLogo';
import { Button } from '../../components/ui/Button';
import { LoadingBlock } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';

/**
 * A4 sheet for the print routes (/print/...): no sidebar/header, a screen-only toolbar,
 * and `?autoprint=1` support. Browser printing handles Arabic shaping and RTL correctly,
 * and maps to Electron's webContents.print() later.
 */
export function PrintSheet({
  title,
  ready,
  error,
  onRetry,
  children,
}: {
  title: string;
  /** True once every query the document needs has loaded. */
  ready: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const printed = useRef(false);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    if (!ready || printed.current || params.get('autoprint') !== '1') return;
    printed.current = true;
    // Wait for web fonts and chart layout before opening the print dialog.
    void document.fonts.ready.then(() => window.setTimeout(() => window.print(), 400));
  }, [ready, params]);

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex w-[210mm] max-w-full items-center justify-between gap-3 px-2 print:hidden">
        <Button
          variant="secondary"
          onClick={() => (window.history.length > 1 ? window.history.back() : window.close())}
        >
          <ArrowRight className="h-4 w-4 ltr:rotate-180" aria-hidden />
          {t('print.back')}
        </Button>
        <Button onClick={() => window.print()} disabled={!ready}>
          <Printer className="h-4 w-4" aria-hidden />
          {t('print.print')}
        </Button>
      </div>
      <main className="mx-auto w-[210mm] max-w-full bg-white p-[14mm] text-[13px] leading-relaxed text-gray-900 shadow-lg print:w-auto print:p-0 print:shadow-none">
        {error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : ready ? (
          children
        ) : (
          <LoadingBlock label={t('print.loading')} />
        )}
      </main>
    </div>
  );
}

/** Clinic letterhead: logo + clinic on the start side, practitioner + contact on the end side. */
export function Letterhead({ date }: { date?: string }) {
  const { t } = useTranslation();
  const settings = useSettings().data;
  if (!settings) return null;
  return (
    <header className="mb-5 flex items-start justify-between gap-6 border-b-2 border-brand-700 pb-4">
      <div className="flex items-center gap-3">
        <ClinicLogo logoUrl={settings.logoUrl} className="h-16 w-16" />
        <div>
          <p className="text-xl font-extrabold text-brand-900">{settings.clinicName}</p>
          <p className="text-xs text-brand-700">{settings.tagline}</p>
        </div>
      </div>
      <div className="text-end text-xs leading-5 text-gray-700">
        {settings.practitionerName && (
          <p className="text-sm font-bold text-gray-900">{settings.practitionerName}</p>
        )}
        <p>{settings.practitionerTitle}</p>
        {settings.address && <p>{settings.address}</p>}
        {(settings.phone || settings.email) && (
          <p dir="ltr">{[settings.phone, settings.email].filter(Boolean).join(' · ')}</p>
        )}
        {date && (
          <p className="mt-1 font-semibold text-gray-900">
            {t('print.date', { date: formatDateOnly(date) })}
          </p>
        )}
      </div>
    </header>
  );
}

export function PrintFooter() {
  const settings: ClinicSettingsResponse | undefined = useSettings().data;
  if (!settings?.printFooterText) return null;
  return (
    <footer className="mt-8 border-t border-gray-200 pt-2 text-center text-[11px] text-gray-500">
      {settings.printFooterText}
    </footer>
  );
}

export function PrintSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-4 break-inside-avoid ${className ?? ''}`}>
      <h2 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold text-brand-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
