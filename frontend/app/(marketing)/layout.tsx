import { Button }        from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import { cookies }       from 'next/headers';
import Link              from 'next/link';

const isLoggedIn = async () => {
  const cookieStore = await cookies();
  return !!cookieStore.get('token')?.value;
}

const MarketingLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loggedIn, t] = await Promise.all([
    isLoggedIn(),
    getTranslations('marketing'),
  ]);

  return (
    <div className='flex min-h-svh flex-col'>
      <header className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-6'>
          <Link href='/' className='text-lg font-bold tracking-tight cursor-pointer select-none'>
            Kino
          </Link>
          <nav className='flex items-center gap-2'>
            {loggedIn ? (
              <Button asChild size='sm'>
                <Link href='/calendars'>{t('goToApp')}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant='ghost' size='sm'>
                  <Link href='/login'>{t('signIn')}</Link>
                </Button>
                <Button asChild size='sm'>
                  <Link href='/signup'>{t('getStarted')}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className='flex-1'>{children}</main>
    </div>
  );
};

export default MarketingLayout;
