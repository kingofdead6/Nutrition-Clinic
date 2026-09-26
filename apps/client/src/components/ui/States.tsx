import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { errorText } from '../../lib/errors';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-semibold text-gray-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-semibold text-gray-800">{t('pages.errorTitle')}</p>
      <p className="text-sm text-gray-500">{errorText(t, error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function Alert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-pastel-blue px-3 py-2.5 text-sm text-blue-900">{children}</div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200/80', className)} aria-hidden />;
}
