import { cookies }         from 'next/headers';
import { DesktopSidebar }  from '@/components/desktop-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopBar }          from '@/components/top-bar';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

async function getCurrentUser(token: string): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;
  const user        = token ? await getCurrentUser(token) : null;

  const isLoggedIn = !!user;

  return (
    <>
      <TopBar isLoggedIn={isLoggedIn} />
      <DesktopSidebar user={user} isLoggedIn={isLoggedIn} />
      <MobileBottomNav isLoggedIn={isLoggedIn} />
      <main className='md:ml-16 pb-16 md:pb-0'>{children}</main>
    </>
  );
}
