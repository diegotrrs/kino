'use client';
import {
  addEventExpense,
  addEventLink,
  createEvent,
  deleteEvent as deleteEventAction,
  updateEvent
}                               from '@/app/(app)/events/actions';
import { EventColorPicker }     from '@/components/events/event-color-picker';
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
import {
  DEFAULT_EVENT_COLOR,
  getRecentColors
}                               from '@/lib/event-colors';
import type {
  Calendar,
  EventExpense,
  EventLink
}                               from '@/lib/types';
import { cn }                   from '@/lib/utils';
import { CalendarEvent }        from '@/utils/data';
import { format }               from 'date-fns';
import { ChevronDown }          from 'lucide-react';
import {
  useLocale,
  useTranslations
}                               from 'next-intl';
import {
  useEffect,
  useRef,
  useState
}                               from 'react';
import { z }                    from 'zod';
import { EventDateRangePicker } from './events/event-date-range-picker';
import { EventExpenses }        from './events/event-expenses';
import { EventLinks }           from './events/event-links';
import {
  PendingExpenses,
  type PendingExpense
}                               from './events/pending-expenses';
import { PendingLinks }         from './events/pending-links';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
}                               from './ui/popover';
import { ToastAction }          from './ui/toast';

const titleSchema = z.string().min(1);

type CalendarOption = Pick<Calendar, 'id' | 'name'>;

type EventFormProps =
  // `calendars` turns on a calendar picker, for adding events outside a single calendar (the Events page)
  | { mode: 'add'; start: Date; end: Date; calendars?: CalendarOption[]; onSaved?: () => void }
  | { mode: 'edit'; event?: CalendarEvent; oldEvent?: CalendarEvent; isDrag: boolean };

const SECTION_LABEL = 'font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground';

// On phones the dialog becomes a bottom sheet; from `sm` up it stays a centred dialog
const SHEET_ON_PHONES = 'max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0';

export const EventForm = (props: EventFormProps) => {
  const { mode } = props;

  const addStart = mode === 'add' ? props.start : undefined;
  const addEnd = mode === 'add' ? props.end : undefined;
  const editEvent = mode === 'edit' ? props.event : undefined;
  const editOldEvent = mode === 'edit' ? props.oldEvent : undefined;
  const isDrag = mode === 'edit' ? props.isDrag : false;
  const calendars = mode === 'add' ? props.calendars : undefined;
  const onSaved = mode === 'add' ? props.onSaved : undefined;

  const {
    calendarId, readOnly, preferredCurrency,
    events, addEvent, deleteEvent,
    eventAddOpen, setEventAddOpen,
    eventEditOpen, setEventEditOpen,
  } = useEvents();
  const { toast } = useToast();
  const t = useTranslations('eventDialog');
  const locale = useLocale();

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
      ? (typeof window !== 'undefined' ? localStorage.getItem('lastEventColor') ?? DEFAULT_EVENT_COLOR : DEFAULT_EVENT_COLOR)
      : (editEvent?.backgroundColor ?? DEFAULT_EVENT_COLOR)
  );
  const [titleError, setTitleError] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pickedCalendarId, setPickedCalendarId] = useState<number | undefined>(() => calendars?.[0]?.id);
  const saveCalendarId = calendars ? pickedCalendarId : calendarId;

  const pendingUrlsRef = useRef<string[]>([]);
  const pendingExpensesRef = useRef<PendingExpense[]>([]);
  const currentLinksRef = useRef<EventLink[]>(editEvent?.links ?? []);
  const currentExpensesRef = useRef<EventExpense[]>(editEvent?.expenses ?? []);

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
    setColor(localStorage.getItem('lastEventColor') ?? DEFAULT_EVENT_COLOR);
    setTitleError(false);
    setDateOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    pendingUrlsRef.current = [];
    pendingExpensesRef.current = [];
  }, [addStart, addEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when the user clicks a different event (edit mode)
  useEffect(() => {
    if (mode !== 'edit') return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTitle(editEvent?.title ?? '');
    setDescription(editEvent?.description ?? '');
    setStart(editEvent?.start as Date);
    setEnd(editEvent?.end as Date);
    setColor(editEvent?.backgroundColor ?? DEFAULT_EVENT_COLOR);
    setTitleError(false);
    setConfirmingDelete(false);
    setDateOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    currentLinksRef.current = editEvent?.links ?? [];
    currentExpensesRef.current = editEvent?.expenses ?? [];
  }, [editEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDay = (d: Date): string =>
    d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const formatTime = (d: Date): string => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const isMultiDayRange = !!start && !!end && start.toDateString() !== end.toDateString();

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

      if (saveCalendarId !== undefined) {
        try {
          const created = await createEvent({
            calendar_id: saveCalendarId,
            title: title.trim(),
            description,
            date: format(start, 'yyyy-MM-dd'),
            start_time: format(start, 'HH:mm:ss'),
            end_date: format(end, 'yyyy-MM-dd'),
            end_time: format(end, 'HH:mm:ss'),
            color,
          });
          const [linkResults, expenseResults] = await Promise.all([
            Promise.allSettled(pendingUrlsRef.current.map((url) => addEventLink(created.id, url))),
            Promise.allSettled(pendingExpensesRef.current.map((e) => addEventExpense(created.id, e.label, e.amount, e.currency))),
          ]);
          const links = linkResults
            .filter((r): r is PromiseFulfilledResult<EventLink> => r.status === 'fulfilled')
            .map((r) => r.value);
          const expenses = expenseResults
            .filter((r): r is PromiseFulfilledResult<EventExpense> => r.status === 'fulfilled')
            .map((r) => r.value);
          addEvent({ ...localEvent, id: String(created.id), links, expenses });
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
      onSaved?.();
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
        expenses: currentExpensesRef.current,
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

  // The edit form mounts before an event is picked, so start/end can still be empty here
  const whenContent = start && end && (
          <span className='flex min-w-0 flex-1 flex-col items-start gap-1'>
            <span className='font-mono text-xs font-medium tracking-wider text-muted-foreground tabular-nums'>
              {formatDay(start)}{isMultiDayRange && ` → ${formatDay(end)}`}
            </span>
            <span className='font-mono text-lg font-medium leading-none tabular-nums'>
              {formatTime(start)} → {formatTime(end)}
            </span>
          </span>
  );

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={cn(SHEET_ON_PHONES, 'max-h-[90svh] gap-0 overflow-y-auto p-0 sm:max-h-[85vh]')}>
        <div className='grid gap-3 px-6 pt-6 pb-5'>
          <AlertDialogHeader className='space-y-0 text-left'>
            <AlertDialogTitle className='flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground'>
              <span aria-hidden='true' className='h-2.5 w-2.5 shrink-0 rounded-full' style={{ backgroundColor: color }} />
              {mode === 'add' ? t('addTitle') : t('editTitle')}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setTitleError(false); }}
            placeholder={t('titlePlaceholder')}
            aria-label={t('titlePlaceholder')}
            readOnly={isReadOnly}
            autoFocus={mode === 'add'}
            className={cn(
              'w-full bg-transparent font-display text-2xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-3xl',
              isReadOnly && 'cursor-default',
              titleError && 'placeholder:text-destructive/60',
            )}
          />
          {titleError && (
            <p className='-mt-2 text-xs text-destructive'>{t('titleRequired')}</p>
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            aria-label={t('descriptionLabel')}
            rows={2}
            readOnly={isReadOnly}
            className={cn('w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60', isReadOnly && 'cursor-default')}
          />
        </div>

        <div aria-hidden='true' className='border-t-2 border-dashed' />

        <div className='grid gap-5 px-6 py-5'>
          {calendars && (
            <label className='grid gap-2'>
              <span className={SECTION_LABEL}>{t('calendar')}</span>
              {calendars.length > 0 ? (
                <select
                  value={pickedCalendarId ?? ''}
                  onChange={(e) => setPickedCalendarId(Number(e.target.value))}
                  className='h-10 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                  {calendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>{calendar.name}</option>
                  ))}
                </select>
              ) : (
                <span className='text-sm text-muted-foreground'>{t('noCalendars')}</span>
              )}
            </label>
          )}

          <section className='grid gap-2'>
            <span className={SECTION_LABEL}>{t('when')}</span>
            {isReadOnly ? (
              <div className='flex items-center rounded-md border bg-card px-4 py-3'>{whenContent}</div>
            ) : (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type='button'
                    aria-label={t('changeDateTime')}
                    className='flex w-full items-center gap-3 rounded-md border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  >
                    {whenContent}
                    <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' />
                  </button>
                </PopoverTrigger>
                <PopoverContent align='start' collisionPadding={16} className='w-[min(24rem,calc(100vw-2rem))] p-3'>
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
          </section>

          <section className='grid gap-2'>
            <span className={SECTION_LABEL}>{t('colour')}</span>
            {isReadOnly ? (
              <span aria-hidden='true' className='h-7 w-7 rounded-md' style={{ backgroundColor: color }} />
            ) : (
              <EventColorPicker color={color} onChange={setColor} recentColors={getRecentColors(events)} />
            )}
          </section>

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

          {mode === 'edit' ? (
            <EventExpenses
              key={`expenses-${editEvent?.id}`}
              eventId={Number(editEvent?.id)}
              initialExpenses={editEvent?.expenses ?? []}
              readOnly={isReadOnly}
              preferredCurrency={preferredCurrency}
              onExpensesChange={(expenses) => { currentExpensesRef.current = expenses; }}
            />
          ) : (
            <PendingExpenses
              preferredCurrency={preferredCurrency}
              onChange={(e) => { pendingExpensesRef.current = e; }}
            />
          )}
        </div>

        <AlertDialogFooter className='sticky bottom-0 flex-row flex-wrap items-center justify-end gap-2 border-t bg-background px-6 py-4 sm:space-x-0'>
          {mode === 'edit' && !isReadOnly && !isDrag && !confirmingDelete && (
            <Button type='button' variant='ghost' className='mr-auto px-2 text-destructive hover:bg-destructive/10 hover:text-destructive' onClick={() => setConfirmingDelete(true)}>
              {t('delete')}
            </Button>
          )}
          {mode === 'edit' && !isReadOnly && !isDrag && confirmingDelete && (
            <>
              <span className='mr-auto text-sm text-muted-foreground'>{t('confirmDelete')}</span>
              <Button type='button' variant='outline' onClick={() => setConfirmingDelete(false)}>{t('confirmNo')}</Button>
              <Button type='button' variant='destructive' onClick={handleDelete}>{t('confirmYes')}</Button>
            </>
          )}
          {!confirmingDelete && (
            <>
              <AlertDialogCancel className='mt-0' onClick={handleCancel}>
                {isReadOnly ? t('close') : t('cancel')}
              </AlertDialogCancel>
              {!isReadOnly && (
                <AlertDialogAction disabled={!!calendars && saveCalendarId === undefined} onClick={onSave}>
                  {mode === 'add' ? t('add') : t('save')}
                </AlertDialogAction>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
