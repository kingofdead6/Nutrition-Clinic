import {
  Apple,
  BarChart3,
  CalendarDays,
  DatabaseBackup,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey:
    | 'nav.home'
    | 'nav.patients'
    | 'nav.appointments'
    | 'nav.dietPlans'
    | 'nav.prescriptions'
    | 'nav.reports'
    | 'nav.foods'
    | 'nav.settings'
    | 'nav.backup';
  icon: LucideIcon;
  /** Hidden for other roles (the API refuses them anyway). */
  adminOnly?: boolean;
}

/** Sidebar order from the mockup. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: LayoutDashboard },
  { to: '/patients', labelKey: 'nav.patients', icon: Users },
  { to: '/appointments', labelKey: 'nav.appointments', icon: CalendarDays },
  { to: '/diet-plans', labelKey: 'nav.dietPlans', icon: UtensilsCrossed },
  { to: '/prescriptions', labelKey: 'nav.prescriptions', icon: FileText },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
  { to: '/foods', labelKey: 'nav.foods', icon: Apple },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  { to: '/backup', labelKey: 'nav.backup', icon: DatabaseBackup, adminOnly: true },
];
