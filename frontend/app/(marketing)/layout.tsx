import { Button }  from '@/components/ui/button';
import { cookies } from 'next/headers';
import Link        from 'next/link';

const isLoggedIn = async () => {
  const cookieStore = await cookies();
  return !!cookieStore.get('token')?.value;
}

const MarketingLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const loggedIn = await isLoggedIn();

  return (
    <div className='flex min-h-svh flex-col'>
      <header className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-6'>
          <Link href='/' className='text-lg font-bold tracking-tight'>
            Kino
          </Link>
          <nav className='flex items-center gap-2'>
            {loggedIn ? (
              <Button asChild size='sm'>
                <Link href='/calendars'>Go to app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant='ghost' size='sm'>
                  <Link href='/login'>Sign in</Link>
                </Button>
                <Button asChild size='sm'>
                  <Link href='/signup'>Get started</Link>
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
