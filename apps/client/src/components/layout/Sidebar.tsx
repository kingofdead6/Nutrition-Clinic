import { Leaf, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useMe } from '../../api/auth';
import { cn } from '../../lib/cn';
import { NAV_ITEMS } from './navItems';

/**
 * Dark-green sidebar on the start (right) side. On large screens it is always visible;
 * below `lg` it becomes a drawer that slides in from the start edge.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const isAdmin = useMe().data?.role === 'admin';
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden print:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        id="app-sidebar"
        aria-label={t('nav.home')}
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-64 flex-col bg-brand-900 text-brand-50 transition-transform duration-200 print:hidden',
          'lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)]',
          // Off-canvas only below lg (the rtl:/ltr: variants would otherwise outrank lg:translate-x-0).
          // Closed drawer: also `invisible`, so its links leave the tab order and the page
          // width (it would otherwise widen the page in RTL).
          !open && 'max-lg:invisible max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full',
        )}
      >
        <div className="flex items-center justify-end p-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-100 hover:bg-brand-800"
            aria-label={t('common.closeMenu')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 lg:py-6">
          <ul className="space-y-1">
            {items.map(({ to, labelKey, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-full px-4 py-2.5 text-[0.95rem] font-semibold transition-colors',
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-brand-100 hover:bg-brand-800 hover:text-white',
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {t(labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <figure className="m-3 flex items-start gap-2 rounded-2xl bg-brand-800/70 p-4 text-sm leading-relaxed text-brand-50">
          <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" aria-hidden />
          <blockquote>{t('app.quote')}</blockquote>
        </figure>
      </aside>
    </>
  );
}
