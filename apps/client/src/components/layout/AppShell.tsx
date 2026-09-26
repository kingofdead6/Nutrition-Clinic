import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { useAuthStatus, useMe } from '../../api/auth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/** Authenticated layout: header on top, sidebar on the start side, page content. */
export function AppShell() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const status = useAuthStatus();
  const me = useMe();

  // <RequireAuth> guarantees both are loaded before the shell renders.
  if (!status.data || !me.data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        {t('common.skipToContent')}
      </a>
      <Header
        clinic={status.data.clinic}
        user={me.data}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
