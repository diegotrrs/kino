'use client';
import '@/styles/calendar.css';
import { updateEvent }        from '@/app/(app)/events/actions';
import { useEvents }          from '@/context/events-context';
import { useToast }           from '@/hooks/use-toast';
import { getDateFromMinutes } from '@/lib/utils';
import { goToday }            from '@/utils/calendar-utils';
import {
  CalendarEvent,
  earliestTime,
  latestTime
}                             from '@/utils/data';
import {
  DateSelectArg,
  DayCellContentArg,
  DayHeaderContentArg,
  EventChangeArg,
  EventClickArg,
  EventContentArg
}                             from '@fullcalendar/core/index.js';
import { format }             from 'date-fns';
import dayGridPlugin          from '@fullcalendar/daygrid';
import interactionPlugin      from '@fullcalendar/interaction';
import listPlugin             from '@fullcalendar/list';
import multiMonthPlugin       from '@fullcalendar/multimonth';
import FullCalendar           from '@fullcalendar/react';
import timeGridPlugin         from '@fullcalendar/timegrid';
import {
  useRef,
  useState
}                             from 'react';
import CalendarNav            from './calendar-nav';
import { EventEditForm }      from './event-edit-form';
import { Card }               from './ui/card';

type EventItemProps = {
  info: EventContentArg;
};

type DayHeaderProps = {
  info: DayHeaderContentArg;
};

type DayRenderProps = {
  info: DayCellContentArg;
};

export default function Calendar() {
  const { events, calendarId, addEvent, deleteEvent, setEventAddOpen, setEventEditOpen, setEventViewOpen } =
    useEvents();
  const { toast } = useToast();

  const calendarRef = useRef<FullCalendar | null>(null);
  const [viewedDate, setViewedDate] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState(new Date());
  const [selectedEnd, setSelectedEnd] = useState(new Date());
  const [selectedOldEvent, setSelectedOldEvent] = useState<
    CalendarEvent | undefined
  >();
  const [selectedEvent, setSelectedEvent] = useState<
    CalendarEvent | undefined
  >();
  const [isDrag, setIsDrag] = useState(false);

  const handleEventClick = (info: EventClickArg) => {
    const event: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      backgroundColor: info.event.backgroundColor,
      start: info.event.start!,
      end: info.event.end!,
    };

    setIsDrag(false);
    setSelectedOldEvent(event);
    setSelectedEvent(event);
    setEventEditOpen(true);
  };

  const handleEventChange = async (info: EventChangeArg) => {
    const storedEvent = events.find((e) => e.id === info.event.id);
    const newStart = info.event.start!;
    const newEnd   = info.event.end ?? storedEvent?.end ?? new Date(newStart.getTime() + 60 * 60 * 1000);

    const newEvent: CalendarEvent = {
      id:              info.event.id,
      title:           info.event.title,
      description:     info.event.extendedProps.description,
      backgroundColor: info.event.backgroundColor,
      start:           newStart,
      end:             newEnd,
    };

    if (calendarId !== undefined) {
      try {
        await updateEvent(Number(info.event.id), {
          title:       info.event.title,
          description: info.event.extendedProps.description,
          date:        format(newStart, 'yyyy-MM-dd'),
          start_time:  format(newStart, 'HH:mm:ss'),
          end_date:    format(newEnd, 'yyyy-MM-dd'),
          end_time:    format(newEnd, 'HH:mm:ss'),
          color:       info.event.backgroundColor,
        });
      } catch {
        info.revert();
        toast({ variant: 'destructive', title: 'Failed to save event' });
        return;
      }
    }

    deleteEvent(info.event.id);
    addEvent(newEvent);
  };

  const EventItem = ({ info }: EventItemProps) => {
    const { event } = info;
    const [left, right] = info.timeText.split(' - ');

    return (
      <div className='overflow-hidden w-full'>
        {info.view.type == 'dayGridMonth' ? (
          <div
            style={{ backgroundColor: info.backgroundColor }}
            className={'flex flex-col rounded-md w-full px-2 py-1 line-clamp-1 text-[0.5rem] sm:text-[0.6rem] md:text-xs'}
          >
            <p className='font-semibold text-gray-950 line-clamp-1 w-11/12'>
              {event.title}
            </p>

            <p className='text-gray-800'>{left}</p>
            <p className='text-gray-800'>{right}</p>
          </div>
        ) : (
          <div className='flex flex-col space-y-0 text-[0.5rem] sm:text-[0.6rem] md:text-xs'>
            <p className='font-semibold w-full text-gray-950 line-clamp-1'>
              {event.title}
            </p>
            <p className='text-gray-800 line-clamp-1'>{`${left} - ${right}`}</p>
          </div>
        )}
      </div>
    );
  };

  const DayHeader = ({ info }: DayHeaderProps) => {
    const [weekday] = info.text.split(' ');

    return (
      <div className='flex items-center h-full overflow-hidden'>
        {info.view.type == 'timeGridDay' ? (
          <div className='flex flex-col rounded-sm'>
            <p>
              {info.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        ) : info.view.type == 'timeGridWeek' ? (
          <div className='flex flex-col space-y-0.5 rounded-sm items-center w-full text-xs sm:text-sm md:text-md'>
            <p className='flex font-semibold'>{weekday}</p>
            {info.isToday ? (
              <div className='flex bg-black dark:bg-white h-6 w-6 rounded-full items-center justify-center text-xs sm:text-sm md:text-md'>
                <p className='font-light dark:text-black text-white'>
                  {info.date.getDate()}
                </p>
              </div>
            ) : (
              <div className='h-6 w-6 rounded-full items-center justify-center'>
                <p className='font-light'>{info.date.getDate()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className='flex flex-col rounded-sm'>
            <p>{weekday}</p>
          </div>
        )}
      </div>
    );
  };

  const DayRender = ({ info }: DayRenderProps) => {
    const isFirstOfMonth = info.date.getDate() === 1 && info.view.type === 'dayGridMonth';

    const getMonthLabel = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    };

    return (
      <div className='flex'>
        {info.view.type == 'dayGridMonth' && info.isToday ? (
          <div className='flex h-7 w-7 rounded-full bg-black dark:bg-white items-center justify-center text-sm text-white dark:text-black'>
            {info.dayNumberText}
          </div>
        ) : (
          <div className='flex h-7 w-7 rounded-full items-center justify-center text-sm'>
            {info.dayNumberText}
          </div>
        )}
        {isFirstOfMonth && (
          <div className='month-ribbon'>
            <span>{getMonthLabel(info.date)}</span>
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = (info: DateSelectArg) => {
    setSelectedStart(info.start);
    setSelectedEnd(info.end);
  };

  const earliestHour = getDateFromMinutes(earliestTime)
    .getHours()
    .toString()
    .padStart(2, '0');
  const earliestMin = getDateFromMinutes(earliestTime)
    .getMinutes()
    .toString()
    .padStart(2, '0');
  const latestHour = getDateFromMinutes(latestTime)
    .getHours()
    .toString()
    .padStart(2, '0');
  const latestMin = getDateFromMinutes(latestTime)
    .getMinutes()
    .toString()
    .padStart(2, '0');

  const calendarEarliestTime = `${earliestHour}:${earliestMin}`;
  const calendarLatestTime = `${latestHour}:${latestMin}`;

  return (
    <div className='space-y-5'>
      <CalendarNav
        calendarRef={calendarRef}
        start={selectedStart}
        end={selectedEnd}
        viewedDate={viewedDate}
      />

      <div className='relative'>
        {(viewedDate.getMonth() !== new Date().getMonth() ||
          viewedDate.getFullYear() !== new Date().getFullYear()) && (
          <button
            onClick={() => goToday(calendarRef)}
            className='absolute -top-3 left-0 right-0 mx-auto w-fit z-30 rounded-full px-4 py-1 text-xs font-medium shadow-md cursor-pointer back-to-today-pill'
          >
            Back to {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        )}
      <Card className='p-3'>
        <FullCalendar
          ref={calendarRef}
          timeZone='local'
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            multiMonthPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          initialView='dayGridMonth'
          headerToolbar={false}
          slotMinTime={calendarEarliestTime}
          slotMaxTime={calendarLatestTime}
          allDaySlot={false}
          firstDay={1}
          height={'32vh'}
          displayEventEnd={true}
          windowResizeDelay={0}
          events={events}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }}
          eventBorderColor={'black'}
          contentHeight={'auto'}
          expandRows={true}
          dayCellContent={(dayInfo) => <DayRender info={dayInfo} />}
          eventContent={(eventInfo) => <EventItem info={eventInfo} />}
          dayHeaderContent={(headerInfo) => <DayHeader info={headerInfo} />}
          eventClick={(eventInfo) => handleEventClick(eventInfo)}
          eventChange={(eventInfo) => handleEventChange(eventInfo)}
          select={handleDateSelect}
          datesSet={(dates) => setViewedDate(dates.view.currentStart)}
          dateClick={() => setEventAddOpen(true)}
          nowIndicator
          editable
          selectable
        />
      </Card>
      </div>
      <EventEditForm
        oldEvent={selectedOldEvent}
        event={selectedEvent}
        isDrag={isDrag}
      />
    </div>
  );
}
