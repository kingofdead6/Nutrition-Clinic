import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useMe } from '../../api/auth';
import { useSettings } from '../../api/settings';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingBlock } from '../../components/ui/Spinner';
import { ErrorState, InfoNote } from '../../components/ui/States';
import { TabPanel, Tabs, type TabItem } from '../../components/ui/Tabs';
import { ClinicInfoTab } from './ClinicInfoTab';
import { LanguageTab } from './LanguageTab';
import { PractitionerTab } from './PractitionerTab';
import { UsersTab } from './UsersTab';

type TabId = 'clinic' | 'practitioner' | 'users' | 'language';
const TAB_IDS: readonly TabId[] = ['clinic', 'practitioner', 'users', 'language'];

export function SettingsPage() {
  const { t } = useTranslation();
  const isAdmin = useMe().data?.role === 'admin';
  const settings = useSettings();
  const [params, setParams] = useSearchParams();

  const tabs: TabItem<TabId>[] = TAB_IDS.filter((id) => id !== 'users' || isAdmin).map((id) => ({
    id,
    label: t(`settings.tabs.${id}`),
  }));
  const requested = params.get('tab') as TabId | null;
  const active = tabs.some((tab) => tab.id === requested) ? (requested as TabId) : 'clinic';

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <Tabs
          items={tabs}
          value={active}
          onChange={(id) => setParams({ tab: id }, { replace: true })}
          idPrefix="settings"
          label={t('settings.title')}
        />
        {!isAdmin && (
          <div className="mb-4">
            <InfoNote>{t('settings.readOnly')}</InfoNote>
          </div>
        )}
        {settings.isPending ? (
          <LoadingBlock label={t('common.loading')} />
        ) : settings.isError ? (
          <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
        ) : (
          <TabPanel idPrefix="settings" id={active}>
            {active === 'clinic' && <ClinicInfoTab settings={settings.data} readOnly={!isAdmin} />}
            {active === 'practitioner' && (
              <PractitionerTab settings={settings.data} readOnly={!isAdmin} />
            )}
            {active === 'users' && isAdmin && <UsersTab />}
            {active === 'language' && <LanguageTab settings={settings.data} readOnly={!isAdmin} />}
          </TabPanel>
        )}
      </div>
    </>
  );
}
