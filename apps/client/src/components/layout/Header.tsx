import { CalendarDays, LogOut, Menu as MenuIcon, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatDateOnly, todayIn, type AuthStatus, type User } from '@shared';
import { useLogout } from '../../api/auth';
import { Avatar } from '../ui/Avatar';
import { Menu } from '../ui/Menu';
import { ClinicLogo } from './ClinicLogo';

export function Header({
  clinic,
  user,
  onOpenSidebar,
}: {
  clinic: AuthStatus['clinic'];
  user: User;
  onOpenSidebar: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();
  const today = formatDateOnly(todayIn(clinic.timezone));

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6 print:hidden">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-brand-900 hover:bg-brand-50 lg:hidden"
        aria-label={t('common.openMenu')}
        aria-controls="app-sidebar"
      >
        <MenuIcon className="h-6 w-6" aria-hidden />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <ClinicLogo logoUrl={clinic.logoUrl} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-lg font-extrabold text-brand-900">{clinic.clinicName}</p>
          <p className="truncate text-xs text-brand-700">{clinic.tagline}</p>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-3 lg:gap-5">
        <p className="hidden items-center gap-2 rounded-full bg-pastel-green px-3 py-1.5 text-sm font-semibold text-brand-900 md:flex">
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t('header.today', { date: today })}
        </p>
        <p className="hidden text-sm font-semibold text-gray-800 sm:block">
          {t('header.welcome', { title: clinic.practitionerTitle })}
        </p>
        <Menu
          label={t('header.userMenu')}
          trigger={<Avatar name={user.name} />}
          items={[
            {
              label: t('header.profile'),
              icon: <UserRound className="h-4 w-4" aria-hidden />,
              onSelect: () => navigate('/profile'),
            },
            {
              label: t('header.logout'),
              icon: <LogOut className="h-4 w-4" aria-hidden />,
              danger: true,
              onSelect: () => logout.mutate(undefined, { onSettled: () => navigate('/login') }),
            },
          ]}
        />
      </div>
    </header>
  );
}
