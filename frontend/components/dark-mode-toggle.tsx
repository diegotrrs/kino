'use client';
import { Button }   from '@/components/ui/button';
import {
  MoonIcon,
  SunIcon
}                   from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { track } from '@/lib/analytics/events';

export const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('topBar');

  const ToggleTheme = () => {
    const next = theme == 'dark' ? 'light' : 'dark';
    setTheme(next);
    track('theme_toggled', { theme: next });
  }

  return (
    <Button variant='outline' size='icon' onClick={ToggleTheme}>
      <SunIcon className='h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <MoonIcon className='absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
      <span className='sr-only'>{t('toggleTheme')}</span>
    </Button>
  );
}
