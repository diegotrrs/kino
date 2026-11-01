'use client';
import '@/styles/calendar.css';
import { updateEvent }   from '@/app/(app)/events/actions';
import { useEvents }     from '@/context/events-context';
import { useToast }      from '@/hooks/use-toast';
import {
  goToday,
  getDateFromMinutes
}                        from '@/utils/calendar-utils';
import {
  CalendarEvent,
  earliestTime,
  latestTime
}                        from '@/utils/data';
import {
  DateSelectArg,
  DayCellContentArg,
  DayHeaderContentArg,
  EventChangeArg,
  EventClickArg,
  EventContentArg
}                        from '@fullcalendar/core/index.js';
import dayGridPlugin     from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin        from '@fullcalendar/list';
import multiMonthPlugin  from '@fullcalendar/multimonth';
import FullCalendar      from '@fullcalendar/react';
import timeGridPlugin    from '@fullcalendar/timegrid';
import { format }        from 'date-fns';
import {
  useRef,
  useState
}                        from 'react';
import CalendarNav  from './calendar-nav';
import { EventForm } from './event-form';
import { Card }      from './ui/card';
import {
  DEFAULT_EVENT_COLOR,
  getEventEdge,
  getEventTint
}                    from '@/lib/event-colors';

type EventItemProps = {
  info: EventContentArg;
};

type DayHeaderProps = {
  info: DayHeaderContentArg;
};

type DayRenderProps = {
  info: DayCellContentArg;
};

const Calendar = () => {
  const { events, calendarId, initialDate, readOnly, addEvent, deleteEvent, setEventAddOpen, setEventEditOpen } =
    useEvents();
  const { toast } = useToast();

  const calendarRef = useRef<FullCalendar | null>(null);
  const [viewedDate, setViewedDate] = useState(initialDate ?? new Date());
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
    // Open the dialog in read-only mode too — inputs will be disabled via context
    const event: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      backgroundColor: info.event.backgroundColor,
      start: info.event.start!,
      end: info.event.end ?? new Date(info.event.start!.getTime() + 60 * 60 * 1000),
      links: info.event.extendedProps.links,
      expenses: info.event.extendedProps.expenses,
    };

    setIsDrag(false);
    setSelectedOldEvent(event);
    setSelectedEvent(event);
    setEventEditOpen(true);
  };

  const handleEventChange = async (info: EventChangeArg) => {
    if (readOnly) { info.revert(); return; }
    const storedEvent = events.find((e) => e.id === info.event.id);
    const newStart = info.event.start!;
    const newEnd = info.event.end ?? storedEvent?.end ?? new Date(newStart.getTime() + 60 * 60 * 1000);

    const newEvent: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      backgroundColor: info.event.backgroundColor,
      start: newStart,
      end: newEnd,
      links: storedEvent?.links,
      expenses: storedEvent?.expenses,
    };

    if (calendarId !== undefined) {
      try {
        await updateEvent(Number(info.event.id), {
          title: info.event.title,
          description: info.event.extendedProps.description,
          date: format(newStart, 'yyyy-MM-dd'),
          start_time: format(newStart, 'HH:mm:ss'),
          end_date: format(newEnd, 'yyyy-MM-dd'),
          end_time: format(newEnd, 'HH:mm:ss'),
          color: info.event.backgroundColor,
        });
      } catch (e) {
        console.error(e);
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
    const color = info.backgroundColor || DEFAULT_EVENT_COLOR;

    if (info.view.type == 'dayGridMonth') {
      return (
        <div
          style={{ backgroundColor: getEventTint(color, 22), borderLeftColor: color }}
          className='flex w-full flex-col overflow-hidden rounded-sm border-l-[3px] px-1.5 py-0.5 text-[0.5rem] sm:text-[0.6rem] md:text-xs'
        >
          <p className='w-11/12 font-semibold text-foreground line-clamp-1'>
            {event.title}
          </p>
          <p className='font-mono text-muted-foreground tabular-nums line-clamp-1'>
            {right ? `${left}–${right}` : left}
          </p>
        </div>
      );
    }

    return (
      <div
        style={{ backgroundColor: getEventTint(color, 22), borderColor: getEventEdge(color, 35) }}
        className='flex h-full w-full flex-col overflow-hidden rounded-sm border text-[0.5rem] sm:text-[0.6rem] md:text-xs'
      >
        <p
          style={{ borderBottomColor: getEventEdge(color) }}
          className='border-b border-dashed px-1.5 py-0.5 font-mono text-muted-foreground tabular-nums line-clamp-1'
        >
          {right ? `${left}–${right}` : left}
        </p>
        <p className='px-1.5 py-0.5 font-semibold text-foreground line-clamp-2'>
          {event.title}
        </p>
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
              <div className='flex bg-primary h-6 w-6 rounded-full items-center justify-center text-xs sm:text-sm md:text-md'>
                <p className='font-display font-semibold text-primary-foreground'>
                  {info.date.getDate()}
                </p>
              </div>
            ) : (
              <div className='h-6 w-6 rounded-full items-center justify-center'>
                <p className='font-display font-semibold'>{info.date.getDate()}</p>
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
          <div className='flex h-7 w-7 rounded-full bg-primary items-center justify-center text-sm text-primary-foreground'>
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
    <div className=' space-y-5'>
      <CalendarNav
        calendarRef={calendarRef}
        viewedDate={viewedDate}
        readOnly={readOnly}
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
            initialDate={initialDate}
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
            eventBorderColor={'transparent'}
            contentHeight={'auto'}
            expandRows={true}
            dayCellContent={(dayInfo) => <DayRender info={dayInfo} />}
            eventContent={(eventInfo) => <EventItem info={eventInfo} />}
            dayHeaderContent={(headerInfo) => <DayHeader info={headerInfo} />}
            eventClick={(eventInfo) => handleEventClick(eventInfo)}
            eventChange={(eventInfo) => handleEventChange(eventInfo)}
            select={(info) => { if (!readOnly) handleDateSelect(info); }}
            datesSet={(dates) => setViewedDate(dates.view.currentStart)}
            dateClick={() => { if (!readOnly) setEventAddOpen(true); }}
            nowIndicator
            editable={!readOnly}
            selectable={!readOnly}
          />
        </Card>
      </div>
      <EventForm mode='add'  start={selectedStart} end={selectedEnd} />
      <EventForm mode='edit' event={selectedEvent} oldEvent={selectedOldEvent} isDrag={isDrag} />
    </div>
  );
}

export default Calendar;
