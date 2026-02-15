import { cookies }         from 'next/headers';
import { DesktopSidebar }  from '@/components/desktop-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopBar }          from '@/components/top-bar';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('token');

  return (
    <>
      <TopBar isLoggedIn={isLoggedIn} />
      <DesktopSidebar />
      <MobileBottomNav />
      <main className='md:ml-16 pb-16 md:pb-0'>{children}</main>
    </>
  );
}
