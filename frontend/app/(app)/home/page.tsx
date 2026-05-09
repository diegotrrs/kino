import { CalendarList }  from '@/components/calendars/calendar-list';
import { Button }        from '@/components/ui/button';
import { Separator }     from '@/components/ui/separator';
import type { Calendar } from '@/lib/types';
import { PlusIcon }      from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cookies }       from 'next/headers';
import Link              from 'next/link';
import { redirect }      from 'next/navigation';

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

  const favourites = calendars.filter((c) => c.is_favourite);

  return (
    <div className='py-4'>
      <div className='w-full px-5 space-y-8'>

        <div className='space-y-1'>
          <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
            {t('title')}
          </h2>
          <p className='text-xs md:text-sm text-muted-foreground select-none cursor-default'>
            {t('subtitle')}
          </p>
        </div>

        <Separator />

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-base font-semibold tracking-tight'>
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
          <CalendarList calendars={calendars} from='home' />
        </section>

        <section className='space-y-3'>
          <h3 className='text-base font-semibold tracking-tight'>
            {t('myFavourites')}
          </h3>
          {favourites.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center'>
              <p className='text-sm font-medium text-muted-foreground'>
                {t('noFavourites')}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                {t('noFavouritesHint')}
              </p>
            </div>
          ) : (
            <CalendarList calendars={favourites} from='home' />
          )}
        </section>

      </div>
    </div>
  );
};

export default HomePage;
