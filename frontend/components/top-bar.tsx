'use client';
import { logout }           from '@/app/auth/actions';
import { updateLocale }     from '@/app/(app)/settings/actions';
import { Button }           from '@/components/ui/button';
import { Wordmark }         from '@/components/wordmark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
}                           from '@/components/ui/dropdown-menu';
import { locales }          from '@/i18n/routing';
import { useToast }         from '@/hooks/use-toast';
import {
  Check,
  EllipsisVertical,
  Globe,
  MessageSquare,
  Moon,
  Sun
}                           from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme }         from 'next-themes';
import Link                 from 'next/link';

export const TopBar = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { toast }                    = useToast();
  const { resolvedTheme, setTheme }  = useTheme();
  const currentLocale                = useLocale();
  const t                            = useTranslations('topBar');
  const tLang                        = useTranslations('languages');

  return (
    <header className='sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4'>
      <Wordmark />

      <div className='flex items-center gap-2'>
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={t('toggleTheme')}
          >
            {/* Both icons render and CSS picks one: the server can't know the theme, so a JS branch would mismatch */}
            <Sun className='hidden h-4 w-4 dark:block' />
            <Moon className='h-4 w-4 dark:hidden' />
          </Button>
        )}

        {process.env.NODE_ENV === 'development' && (
          <span className='rounded bg-foreground px-1.5 py-0.5 font-mono text-[0.6rem] text-background'>
            <span className='sm:hidden'>xs</span>
            <span className='hidden sm:inline md:hidden'>sm</span>
            <span className='hidden md:inline lg:hidden'>md</span>
            <span className='hidden lg:inline xl:hidden'>lg</span>
            <span className='hidden xl:inline 2xl:hidden'>xl</span>
            <span className='hidden 2xl:inline'>2xl</span>
          </span>
        )}

        {process.env.NODE_ENV === 'development' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' aria-label={t('changeLanguage')}>
                <Globe className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {locales.map((locale) => (
                <DropdownMenuItem key={locale} onSelect={() => updateLocale(locale)}>
                  <Check className={`h-4 w-4 ${locale === currentLocale ? 'opacity-100' : 'opacity-0'}`} />
                  {tLang(locale)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant='ghost'
          size='icon'
          aria-label={t('feedback')}
          disabled={!isLoggedIn}
          className={!isLoggedIn ? 'pointer-events-none opacity-40' : ''}
          asChild={isLoggedIn}
        >
          {isLoggedIn ? (
            <Link href='/feedback'>
              <MessageSquare className='h-5 w-5' />
            </Link>
          ) : (
            <MessageSquare className='h-5 w-5' />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              disabled={!isLoggedIn}
              className={!isLoggedIn ? 'pointer-events-none opacity-40' : ''}
            >
              <EllipsisVertical className='h-5 w-5' />
              <span className='sr-only'>Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onSelect={() => toast({ title: t('profile') })}>
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/settings'>{t('settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/about'>{t('about')}</Link>
            </DropdownMenuItem>
            {isLoggedIn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  {t('logOut')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
