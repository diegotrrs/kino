import {
  CalendarPlus,
  CalendarRange,
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
    labelKey: 'myCalendars',
    href: '/calendars',
    icon: CalendarRange,
    section: 'main',
    testId: 'nav-my-calendars',
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
