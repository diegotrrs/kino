'use client';
import {
  addEventCost,
  addEventLink,
  createEvent,
  deleteEvent as deleteEventAction,
  updateEvent
}                               from '@/app/(app)/events/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
}                               from '@/components/ui/alert-dialog';
import { Button }               from '@/components/ui/button';
import { useEvents }            from '@/context/events-context';
import { useToast }             from '@/hooks/use-toast';
import type {
  EventCost,
  EventLink
}                               from '@/lib/types';
import { CalendarEvent }        from '@/utils/data';
import { format }               from 'date-fns';
import { ChevronDown }          from 'lucide-react';
import {
  useEffect,
  useRef,
  useState
}                               from 'react';
import { HexColorPicker }       from 'react-colorful';
import { z }                    from 'zod';
import { EventCosts }           from './events/event-costs';
import { EventDateRangePicker } from './events/event-date-range-picker';
import { EventLinks }           from './events/event-links';
import {
  PendingCosts,
  type PendingCost
}                               from './events/pending-costs';
import { PendingLinks }         from './events/pending-links';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
}                               from './ui/popover';
import { ToastAction }          from './ui/toast';

const titleSchema = z.string().min(1);

type EventFormProps =
  | { mode: 'add'; start: Date; end: Date }
  | { mode: 'edit'; event?: CalendarEvent; oldEvent?: CalendarEvent; isDrag: boolean };

export const EventForm = (props: EventFormProps) => {
  const { mode } = props;

  const addStart = mode === 'add' ? props.start : undefined;
  const addEnd = mode === 'add' ? props.end : undefined;
  const editEvent = mode === 'edit' ? props.event : undefined;
  const editOldEvent = mode === 'edit' ? props.oldEvent : undefined;
  const isDrag = mode === 'edit' ? props.isDrag : false;

  const {
    calendarId, readOnly, preferredCurrency,
    events, addEvent, deleteEvent,
    eventAddOpen, setEventAddOpen,
    eventEditOpen, setEventEditOpen,
  } = useEvents();
  const { toast } = useToast();

  const open = mode === 'add' ? eventAddOpen : eventEditOpen;
  const setOpen = mode === 'add' ? setEventAddOpen : setEventEditOpen;

  const isReadOnly = mode === 'edit' && readOnly;

  const [title, setTitle] = useState(() => mode === 'add' ? '' : (editEvent?.title ?? ''));
  const [description, setDescription] = useState(() => mode === 'add' ? '' : (editEvent?.description ?? ''));
  const [start, setStart] = useState<Date>(() => {
    if (mode === 'add') { const d = new Date(addStart!); d.setHours(8, 0, 0, 0); return d; }
    return editEvent?.start as Date;
  });
  const [end, setEnd] = useState<Date>(() => {
    if (mode === 'add') { const d = new Date(addStart!); d.setHours(9, 0, 0, 0); return d; }
    return editEvent?.end as Date;
  });
  const [color, setColor] = useState(() =>
    mode === 'add'
      ? (typeof window !== 'undefined' ? localStorage.getItem('lastEventColor') ?? '#76c7ef' : '#76c7ef')
      : (editEvent?.backgroundColor ?? '#76c7ef')
  );
  const [titleError, setTitleError] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const pendingUrlsRef = useRef<string[]>([]);
  const pendingCostsRef = useRef<PendingCost[]>([]);
  const currentLinksRef = useRef<EventLink[]>(editEvent?.links ?? []);
  const currentCostsRef = useRef<EventCost[]>(editEvent?.costs ?? []);

  // Reset when the user selects a different date on the calendar (add mode)
  useEffect(() => {
    if (mode !== 'add' || !addStart) return;
    const defaultStart = new Date(addStart); defaultStart.setHours(8, 0, 0, 0);
    const defaultEnd = new Date(addStart); defaultEnd.setHours(9, 0, 0, 0);
    /* eslint-disable react-hooks/set-state-in-effect */
    setTitle('');
    setDescription('');
    setStart(defaultStart);
    setEnd(defaultEnd);
    setColor(localStorage.getItem('lastEventColor') ?? '#76c7ef');
    setTitleError(false);
    setDateOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    pendingUrlsRef.current = [];
    pendingCostsRef.current = [];
  }, [addStart, addEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when the user clicks a different event (edit mode)
  useEffect(() => {
    if (mode !== 'edit') return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTitle(editEvent?.title ?? '');
    setDescription(editEvent?.description ?? '');
    setStart(editEvent?.start as Date);
    setEnd(editEvent?.end as Date);
    setColor(editEvent?.backgroundColor ?? '#76c7ef');
    setTitleError(false);
    setConfirmingDelete(false);
    setDateOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    currentLinksRef.current = editEvent?.links ?? [];
    currentCostsRef.current = editEvent?.costs ?? [];
  }, [editEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  const dateLabel = start
    ? start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Date';
  const timeLabel = start && end
    ? `${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : 'Time';

  const handleCancel = () => {
    if (mode === 'edit' && isDrag && editOldEvent) {
      deleteEvent(editOldEvent.id);
      addEvent({
        id: editOldEvent.id,
        title: editOldEvent.title,
        description: editOldEvent.description,
        start: editOldEvent.start,
        end: editOldEvent.end,
        backgroundColor: editOldEvent.backgroundColor,
      });
    }
    setConfirmingDelete(false);
    setOpen(false);
  };

  const onSave = async () => {
    if (!titleSchema.safeParse(title.trim()).success) {
      setTitleError(true);
      return;
    }

    if (mode === 'add') {
      const localEvent = {
        id: String(events.length + 1),
        title: title.trim(),
        description,
        start,
        end,
        backgroundColor: color,
      };

      if (calendarId !== undefined) {
        try {
          const created = await createEvent({
            calendar_id: calendarId,
            title: title.trim(),
            description,
            date: format(start, 'yyyy-MM-dd'),
            start_time: format(start, 'HH:mm:ss'),
            end_date: format(end, 'yyyy-MM-dd'),
            end_time: format(end, 'HH:mm:ss'),
            color,
          });
          const [linkResults, costResults] = await Promise.all([
            Promise.allSettled(pendingUrlsRef.current.map((url) => addEventLink(created.id, url))),
            Promise.allSettled(pendingCostsRef.current.map((c) => addEventCost(created.id, c.label, c.amount, c.currency))),
          ]);
          const links = linkResults
            .filter((r): r is PromiseFulfilledResult<EventLink> => r.status === 'fulfilled')
            .map((r) => r.value);
          const costs = costResults
            .filter((r): r is PromiseFulfilledResult<EventCost> => r.status === 'fulfilled')
            .map((r) => r.value);
          addEvent({ ...localEvent, id: String(created.id), links, costs });
        } catch {
          toast({
            variant: 'destructive',
            title: 'Failed to add event',
            action: <ToastAction altText='Dismiss'>Dismiss</ToastAction>,
          });
          return;
        }
      } else {
        addEvent(localEvent);
      }

      localStorage.setItem('lastEventColor', color);
      setOpen(false);
      toast({
        title: 'Event added!',
        action: <ToastAction altText='Click here to dismiss notification'>Dismiss</ToastAction>,
      });
    } else {
      const newEvent = {
        id: editEvent!.id,
        title: title.trim(),
        description,
        start,
        end,
        backgroundColor: color,
        links: currentLinksRef.current,
        costs: currentCostsRef.current,
      };

      if (calendarId !== undefined) {
        try {
          await updateEvent(Number(editEvent!.id), {
            title: title.trim(),
            description,
            date: format(start, 'yyyy-MM-dd'),
            start_time: format(start, 'HH:mm:ss'),
            end_date: format(end, 'yyyy-MM-dd'),
            end_time: format(end, 'HH:mm:ss'),
            color,
          });
        } catch (e) {
          console.error(e);
          toast({
            variant: 'destructive',
            title: 'Failed to save event',
            action: <ToastAction altText='Dismiss'>Dismiss</ToastAction>,
          });
          return;
        }
      }

      deleteEvent(editEvent!.id);
      addEvent(newEvent);
      setOpen(false);
      toast({
        title: 'Event edited!',
        action: <ToastAction altText='Click here to dismiss notification'>Dismiss</ToastAction>,
      });
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !editEvent?.id) return;

    if (calendarId !== undefined) {
      try {
        await deleteEventAction(Number(editEvent.id));
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to delete event',
          action: <ToastAction altText='Dismiss'>Dismiss</ToastAction>,
        });
        return;
      }
    }

    deleteEvent(editEvent.id);
    setConfirmingDelete(false);
    setOpen(false);
    toast({
      title: 'Event deleted!',
      action: <ToastAction altText='Click here to dismiss notification'>Dismiss</ToastAction>,
    });
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='max-h-[85vh] overflow-y-auto'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'add' ? 'Add new event' : 'Edit event'}
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setTitleError(false); }}
          placeholder='Event title'
          aria-label='Event title'
          readOnly={isReadOnly}
          autoFocus={mode === 'add'}
          className={`w-full text-xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 ${isReadOnly ? 'cursor-default' : ''} ${titleError ? 'placeholder:text-destructive/60' : ''}`}
        />
        {titleError && (
          <p className='text-xs text-destructive -mt-2'>Please enter a title.</p>
        )}

        {/* Description and separator share one flex child so gap-4 doesn't add space between them */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Add a description…'
            aria-label='Description'
            rows={3}
            readOnly={isReadOnly}
            className={`w-full text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 ${isReadOnly ? 'cursor-default' : ''}`}
          />
          <div className='border-t pt-3 space-y-3'>
          {/* Metadata pills */}
          <div className='flex flex-wrap items-center gap-2'>
            {/* Date / time pill */}
            {isReadOnly ? (
              <span className='inline-flex items-center gap-1.5 rounded-md bg-muted border px-3 py-1.5 text-xs font-medium text-muted-foreground'>
                📅 {dateLabel} · {timeLabel}
              </span>
            ) : (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type='button'
                    aria-label='Change date and time'
                    className='inline-flex items-center gap-1.5 rounded-md bg-muted border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors'
                  >
                    📅 {dateLabel} · {timeLabel}
                    <ChevronDown className='h-3 w-3 text-muted-foreground ml-0.5' />
                  </button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-3' align='start'>
                  <EventDateRangePicker
                    key={mode === 'edit' ? editEvent?.id : undefined}
                    start={start}
                    end={end}
                    defaultMultiDay={
                      mode === 'edit' &&
                      !!editEvent?.start && !!editEvent?.end &&
                      new Date(editEvent.start as Date).toDateString() !== new Date(editEvent.end as Date).toDateString()
                    }
                    detectMultiDay={mode === 'edit'}
                    onChange={(s, e, close) => { setStart(s); setEnd(e); if (close !== false) setDateOpen(false); }}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Colour pill */}
            {isReadOnly ? (
              <span className='inline-flex items-center gap-1.5 rounded-md bg-muted border px-3 py-1.5 text-xs font-medium text-muted-foreground'>
                <span className='w-3 h-3 rounded-full border border-border/50' style={{ backgroundColor: color }} />
                Colour
              </span>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type='button'
                    aria-label='Change colour'
                    className='inline-flex items-center gap-1.5 rounded-md bg-muted border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors'
                  >
                    <span className='w-3 h-3 rounded-full border border-border/50' style={{ backgroundColor: color }} />
                    Colour
                    <ChevronDown className='h-3 w-3 text-muted-foreground ml-0.5' />
                  </button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-3' align='start'>
                  <HexColorPicker color={color} onChange={setColor} />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Links */}
          {mode === 'edit' ? (
            <EventLinks
              key={`links-${editEvent?.id}`}
              eventId={Number(editEvent?.id)}
              initialLinks={editEvent?.links ?? []}
              readOnly={isReadOnly}
              onLinksChange={(links) => { currentLinksRef.current = links; }}
            />
          ) : (
            <PendingLinks onChange={(urls) => { pendingUrlsRef.current = urls; }} />
          )}

          {/* Costs */}
          {mode === 'edit' ? (
            <EventCosts
              key={`costs-${editEvent?.id}`}
              eventId={Number(editEvent?.id)}
              initialCosts={editEvent?.costs ?? []}
              readOnly={isReadOnly}
              preferredCurrency={preferredCurrency}
              onCostsChange={(costs) => { currentCostsRef.current = costs; }}
            />
          ) : (
            <PendingCosts
              preferredCurrency={preferredCurrency}
              onChange={(c) => { pendingCostsRef.current = c; }}
            />
          )}
          </div>
        </div>

        <AlertDialogFooter className='pt-2 flex-row items-center'>
          {mode === 'edit' && !isReadOnly && !isDrag && !confirmingDelete && (
            <Button type='button' variant='destructive' className='mr-auto' onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          )}
          {mode === 'edit' && !isReadOnly && !isDrag && confirmingDelete && (
            <>
              <span className='text-sm text-muted-foreground mr-auto'>Delete this event?</span>
              <Button type='button' variant='outline' onClick={() => setConfirmingDelete(false)}>No</Button>
              <Button type='button' variant='destructive' onClick={handleDelete}>Yes, Delete</Button>
            </>
          )}
          {!confirmingDelete && (
            <>
              <AlertDialogCancel onClick={handleCancel}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </AlertDialogCancel>
              {!isReadOnly && (
                <AlertDialogAction onClick={onSave}>
                  {mode === 'add' ? 'Add Event' : 'Save'}
                </AlertDialogAction>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
