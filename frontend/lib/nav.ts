import {
  CalendarPlus,
  House,
  ListChecks,
  Settings,
  type LucideIcon
} from 'lucide-react';

export type NavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  section: 'main' | 'bottom';
  testId: string;
};

export const navItems: NavItem[] = [
  {
    labelKey: 'home',
    href: '/home',
    icon: House,
    section: 'main',
    testId: 'nav-home',
  },
  {
    labelKey: 'createCalendar',
    href: '/calendars/create',
    icon: CalendarPlus,
    section: 'main',
    testId: 'nav-create-calendar',
  },
  {
    labelKey: 'events',
    href: '/events',
    icon: ListChecks,
    section: 'main',
    testId: 'nav-events',
  },
  {
    labelKey: 'settings',
    href: '/settings',
    icon: Settings,
    section: 'bottom',
    testId: 'nav-settings',
  },
];
