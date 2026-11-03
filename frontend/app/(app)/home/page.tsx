import { CalendarList }     from '@/components/calendars/calendar-list';
import { HotTripsCarousel } from '@/components/home/hot-trips-carousel';
import { Button }           from '@/components/ui/button';
import { Separator }        from '@/components/ui/separator';
import type { Calendar }    from '@/lib/types';
import { PlusIcon }         from 'lucide-react';
import { getTranslations }  from 'next-intl/server';
import { cookies }          from 'next/headers';
import Link                 from 'next/link';
import { redirect }         from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const getAuthToken = async (): Promise<string> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  return token;
}

const getCalendars = async (token: string): Promise<Calendar[]> => {
  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to fetch calendars (${res.status})`);
  return res.json();
}

const HomePage = async () => {
  const [token, t] = await Promise.all([
    getAuthToken(),
    getTranslations('home'),
  ]);
  const calendars = await getCalendars(token);

  const sorted = [...calendars].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));

  return (
    <div className='py-4'>
      <div className='w-full px-5 space-y-8'>

        <div className='space-y-1'>
          <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl select-none cursor-default'>
            {t('title')}
          </h2>
          <p className='text-xs md:text-sm text-muted-foreground select-none cursor-default'>
            {t('subtitle')}
          </p>
        </div>

        <Separator />

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-xl font-bold tracking-tight'>
              {t('myCalendars')}
            </h3>
            {calendars.length > 0 && (
              <Button asChild size='sm'>
                <Link href='/calendars/create'>
                  <PlusIcon className='h-4 w-4' />
                  {t('newCalendar')}
                </Link>
              </Button>
            )}
          </div>
          <CalendarList calendars={sorted} from='home' />
        </section>

        <section className='space-y-3'>
          <h3 className='text-xl font-bold tracking-tight'>
            {t('hotTrips')}
          </h3>
          <HotTripsCarousel />
        </section>

      </div>
    </div>
  );
};

export default HomePage;
