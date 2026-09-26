import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/States';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title={t('pages.notFoundTitle')}
        description={t('pages.notFoundBody')}
        action={
          <Link to="/" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
            {t('pages.goHome')}
          </Link>
        }
      />
    </Card>
  );
}
