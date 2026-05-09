'use client';
import { updateLocale }  from '@/app/(app)/settings/actions';
import { Separator }     from '@/components/ui/separator';
import { locales }       from '@/i18n/routing';
import { cn }            from '@/lib/utils';
import {
  ChevronRight,
  Monitor,
  Moon,
  Sun
}                        from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme }      from 'next-themes';
import Link              from 'next/link';
import {
  useEffect,
  useState
}                        from 'react';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const locale                = useLocale();
  const t                     = useTranslations('settings');
  const tLang                 = useTranslations('languages');

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const appearanceOptions = [
    { value: 'system', label: t('appearance.system'), icon: Monitor },
    { value: 'light',  label: t('appearance.light'),  icon: Sun },
    { value: 'dark',   label: t('appearance.dark'),   icon: Moon },
  ];

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              {t('title')}
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              {t('subtitle')}
            </p>
          </div>

          <Separator />

          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>{t('appearance.title')}</h3>
            <div className='flex gap-2'>
              {appearanceOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors',
                    mounted && theme === value
                      ? 'border-foreground bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {label}
                </button>
              ))}
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('appearance.hint')}
            </p>
          </div>

          <Separator />

          <div className='space-y-2' data-testid='language-selector'>
            <h3 className='text-sm font-medium'>{t('language.title')}</h3>
            <div className='flex gap-2'>
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => updateLocale(loc)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors',
                    mounted && locale === loc
                      ? 'border-foreground bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {tLang(loc)}
                </button>
              ))}
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('language.hint')}
            </p>
          </div>

          <Separator />

          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>{t('calendars.title')}</h3>
            <Link
              href='/settings/deleted-calendars'
              className='flex items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-accent transition-colors'
            >
              <span>{t('calendars.recoverDeleted')}</span>
              <ChevronRight className='h-4 w-4 text-muted-foreground' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
