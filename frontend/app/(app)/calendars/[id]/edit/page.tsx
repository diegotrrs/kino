import { CalendarDeleteButton } from '@/components/calendars/calendar-delete-button';
import { CalendarEditForm }    from '@/components/calendars/calendar-edit-form';
import { Separator }           from '@/components/ui/separator';
import { cookies }             from 'next/headers';
import { redirect }            from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export default async function EditCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }     = await params;
  const calendarId = Number(id);

  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/${calendarId}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) redirect('/calendars');

  const calendar = await res.json();

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              Edit Calendar
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              Update your calendar details.
            </p>
          </div>

          <Separator />

          <CalendarEditForm calendarId={calendarId} currentName={calendar.name} />

          <Separator />

          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-destructive'>Danger Zone</h3>
            <div className='flex items-center justify-between rounded-md border border-destructive/30 px-4 py-3'>
              <div>
                <p className='text-sm font-medium'>Delete this calendar</p>
                <p className='text-xs text-muted-foreground'>You can recover it later from Settings.</p>
              </div>
              <CalendarDeleteButton calendarId={calendarId} calendarName={calendar.name} variant='button' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
