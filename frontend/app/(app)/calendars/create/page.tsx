import { CalendarCreateForm } from '@/components/calendars/calendar-create-form';
import { getTripBySlug }      from '@/app/(marketing)/trips/trips-data';
import { Separator }          from '@/components/ui/separator';
import { getTranslations }    from 'next-intl/server';

const CreateCalendarPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; trip?: string }>;
}) => {
  const [t, { name, trip: tripSlug }] = await Promise.all([
    getTranslations('createCalendar'),
    searchParams,
  ]);

  const trip = tripSlug ? getTripBySlug(tripSlug) : undefined;
  const initialName = name ?? (trip ? `${trip.title}: ${trip.subtitle}` : undefined);

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              {t('title')}
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              {t('subtitle')}
            </p>
          </div>

          <Separator />

          <CalendarCreateForm initialName={initialName} tripSlug={tripSlug} />
        </div>
      </div>
    </div>
  );
}

export default CreateCalendarPage;
