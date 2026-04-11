import { CalendarList } from '@/components/calendars/calendar-list';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Calendar } from '@/lib/types';
import { PlusIcon } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  return token;
}

async function getCalendars(token: string): Promise<Calendar[]> {
  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to fetch calendars (${res.status})`);
  return res.json();
}

export default async function HomePage() {
  const token = await getAuthToken();
  const calendars = await getCalendars(token);

  const favourites = calendars.filter((c) => c.is_favourite);

  return (
    <div className='py-4'>
      <div className='w-full px-5 space-y-8'>

        <div className='space-y-1'>
          <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
            Home
          </h2>
          <p className='text-xs md:text-sm text-muted-foreground select-none cursor-default'>
            Your calendars at a glance.
          </p>
        </div>

        <Separator />

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-base font-semibold tracking-tight'>
              My Calendars
            </h3>
            {calendars.length > 0 && (
              <Button asChild size='sm'>
                <Link href='/calendars/create'>
                  <PlusIcon className='h-4 w-4' />
                  New Calendar
                </Link>
              </Button>
            )}
          </div>
          <CalendarList calendars={calendars} from='home' />
        </section>

        <section className='space-y-3'>
          <h3 className='text-base font-semibold tracking-tight'>
            My Favourites
          </h3>
          {favourites.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center'>
              <p className='text-sm font-medium text-muted-foreground'>
                No favourites yet
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                Open a calendar and press the star to mark it as a favourite.
              </p>
            </div>
          ) : (
            <CalendarList calendars={favourites} from='home' />
          )}
        </section>

      </div>
    </div>
  );
}
