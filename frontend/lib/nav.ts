import {
  CalendarPlus,
  CalendarRange,
  House,
  ListChecks,
  Settings,
  type LucideIcon
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  section: 'main' | 'bottom';
};

export const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/home',
    icon: House,
    section: 'main',
  },
  {
    label: 'My calendars',
    href: '/calendars',
    icon: CalendarRange,
    section: 'main',
  },
  {
    label: 'Create calendar',
    href: '/calendars/create',
    icon: CalendarPlus,
    section: 'main',
  },
  { label: 'Events', href: '/events', icon: ListChecks, section: 'main' },
  { label: 'Settings', href: '/settings', icon: Settings, section: 'bottom' },
];
