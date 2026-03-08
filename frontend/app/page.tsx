import Calendar           from '@/components/calendar';
import { Separator }      from '@/components/ui/separator';
import { EventsProvider } from '@/context/events-context';

export default function Home() {
  return (
    <EventsProvider>
      <div className='py-4'>
        <div
          defaultValue='calendar'
          className='flex flex-col w-full items-center'
        >
          <div className='w-full px-5 space-y-5'>
            <div className='space-y-0'>
              <h2 className='flex items-center select-none text-2xl font-semibold tracking-tight md:text-3xl'>
                My Calendar
              </h2>
            </div>
            <Separator />
            <Calendar />
          </div>
        </div>
      </div>
    </EventsProvider>
  );
}
