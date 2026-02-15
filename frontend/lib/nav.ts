import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  section: 'main' | 'bottom';
};

export const navItems: NavItem[] = [
  { label: 'My calendar',    href: '/',                icon: CalendarDays,  section: 'main' },
  { label: 'My calendars',   href: '/calendars',       icon: CalendarRange, section: 'main' },
  { label: 'Create calendar', href: '/calendars/create', icon: CalendarPlus,  section: 'main' },
  { label: 'Settings',       href: '/settings',        icon: Settings,      section: 'bottom' },
];
