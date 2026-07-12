import { CalendarDeleteButton } from '@/components/calendars/calendar-delete-button';
import { CalendarEditForm }     from '@/components/calendars/calendar-edit-form';
import { CalendarMembers }      from '@/components/calendars/calendar-members';
import { Separator }            from '@/components/ui/separator';
import type { Calendar, CalendarMember } from '@/lib/types';
import { cookies }              from 'next/headers';
import { redirect }             from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const getCurrentUserId = (token: string): number => {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return Number(payload.sub);
}

const EditCalendarPage = async ({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) => {
  const { uuid } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const [calendarRes, membersRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/calendars/${uuid}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${API_BASE_URL}/api/calendars/${uuid}/users`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  if (calendarRes.status === 401) redirect('/login');
  if (!calendarRes.ok) redirect('/calendars');

  const calendar: Calendar = await calendarRes.json();
  const members: CalendarMember[] = membersRes.ok ? await membersRes.json() : [];
  const currentUserId = getCurrentUserId(token);

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

          <CalendarEditForm
            calendarUuid={uuid}
            currentName={calendar.name}
            isPublic={calendar.is_public}
            currentStartDate={calendar.start_date}
          />

          <Separator />

          <div className='space-y-3'>
            <div className='space-y-0'>
              <h3 className='text-sm font-medium'>Members</h3>
              <p className='text-xs text-muted-foreground'>Invite people to collaborate on this calendar.</p>
            </div>
            <CalendarMembers calendarUuid={uuid} calendarName={calendar.name} members={members} currentUserId={currentUserId} />
          </div>

          <Separator />

          <div className='space-y-2'>
            <div className='flex items-center justify-between rounded-md border border-destructive/30 px-4 py-3'>
              <div>
                <p className='text-sm font-medium'>Delete this calendar</p>
                <p className='text-xs text-muted-foreground'>You can recover it later from Settings.</p>
              </div>
              <CalendarDeleteButton calendarUuid={uuid} calendarName={calendar.name} variant='button' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCalendarPage;
