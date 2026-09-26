import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** Page title row; also sets the browser/window title. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${title} | ${t('app.name')}`;
  }, [title, t]);

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
