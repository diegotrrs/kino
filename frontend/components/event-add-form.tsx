'use client';
import {
  addEventCost,
  addEventLink,
  createEvent
}                         from '@/app/(app)/events/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
}                         from '@/components/ui/alert-dialog';
import { Button }         from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
}                         from '@/components/ui/form';
import { Input }          from '@/components/ui/input';
import { Separator }      from '@/components/ui/separator';
import { useEvents }      from '@/context/events-context';
import { useToast }       from '@/hooks/use-toast';
import type { EventLink } from '@/lib/types';
import { zodResolver }    from '@hookform/resolvers/zod';
import { format }         from 'date-fns';
import { PlusIcon }       from 'lucide-react';
import { useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  useForm,
  useWatch
}                         from 'react-hook-form';
import { z }              from 'zod';
import { EventDateRangePicker }           from './events/event-date-range-picker';
import { PendingCosts, type PendingCost } from './events/pending-costs';
import { PendingLinks }                   from './events/pending-links';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
}                         from './ui/popover';
import { Textarea }       from './ui/textarea';
import { ToastAction }    from './ui/toast';

const eventAddFormSchema = z.object({
  title: z
    .string({ required_error: 'Please enter a title.' })
    .min(1, { message: 'Must provide a title for this event.' }),
  description: z.string().optional(),
  start: z.date({
    required_error: 'Please select a start time',
    invalid_type_error: "That's not a date!"
  }),
  end: z.date({
    required_error: 'Please select an end time',
    invalid_type_error: "That's not a date!"
  }),
  color: z
    .string({ required_error: 'Please select an event color.' })
    .min(1, { message: 'Must provide a title for this event.' })
});

type EventAddFormValues = z.infer<typeof eventAddFormSchema>;

type EventAddFormProps = {
  start: Date;
  end: Date;
}

export const EventAddForm = ({ start, end }: EventAddFormProps) => {
  const { calendarId, readOnly, events, addEvent, eventAddOpen, setEventAddOpen, preferredCurrency } = useEvents();
  const { toast } = useToast();
  const pendingUrlsRef = useRef<string[]>([]);
  const pendingCostsRef = useRef<PendingCost[]>([]);

  const form = useForm<z.infer<typeof eventAddFormSchema>>({
    resolver: zodResolver(eventAddFormSchema)
  });
  const watchedStart = useWatch({ control: form.control, name: 'start' });
  const watchedEnd   = useWatch({ control: form.control, name: 'end' });

  useEffect(() => {
    const defaultStart = new Date(start);
    defaultStart.setHours(8, 0, 0, 0);
    const defaultEnd = new Date(start);
    defaultEnd.setHours(9, 0, 0, 0);
    pendingUrlsRef.current = [];
    pendingCostsRef.current = [];
    form.reset({
      title: '',
      description: '',
      start: defaultStart,
      end: defaultEnd,
      color: localStorage.getItem('lastEventColor') ?? '#76c7ef',
    });
  }, [form, start, end]);

  const onSubmit = async (data: EventAddFormValues) => {
    const localEvent = {
      id: String(events.length + 1),
      title: data.title,
      description: data.description,
      start: data.start,
      end: data.end,
      backgroundColor: data.color,
    };

    if (calendarId !== undefined) {
      try {
        const created = await createEvent({
          calendar_id: calendarId,
          title: data.title,
          description: data.description,
          date: format(data.start, 'yyyy-MM-dd'),
          start_time: format(data.start, 'HH:mm:ss'),
          end_date: format(data.end, 'yyyy-MM-dd'),
          end_time: format(data.end, 'HH:mm:ss'),
          color: data.color,
        });
        const [linkResults, costResults] = await Promise.all([
          Promise.allSettled(
            pendingUrlsRef.current.map((url) => addEventLink(created.id, url))
          ),
          Promise.allSettled(
            pendingCostsRef.current.map((c) => addEventCost(created.id, c.label, c.amount, c.currency))
          ),
        ]);
        const links = linkResults
          .filter((r): r is PromiseFulfilledResult<EventLink> => r.status === 'fulfilled')
          .map((r) => r.value);
        const costs = costResults
          .filter((r): r is PromiseFulfilledResult<import('@/lib/types').EventCost> => r.status === 'fulfilled')
          .map((r) => r.value);
        addEvent({ ...localEvent, id: String(created.id), links, costs });
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to save event',
          action: <ToastAction altText='Dismiss'>Dismiss</ToastAction>,
        });
        return;
      }
    } else {
      addEvent(localEvent);
    }

    localStorage.setItem('lastEventColor', data.color);
    setEventAddOpen(false);
    toast({
      title: 'Event added!',
      action: (
        <ToastAction altText={'Click here to dismiss notification'}>
          Dismiss
        </ToastAction>
      ),
    });
  }

  return (
    <AlertDialog open={eventAddOpen}>
      <AlertDialogTrigger className='flex' asChild>
        <Button
          className='w-24 md:w-28 text-xs md:text-sm'
          variant='default'
          disabled={readOnly}
          onClick={() => { if (!readOnly) setEventAddOpen(true); }}
        >
          <PlusIcon className='md:h-5 md:w-5 h-3 w-3' />
          <p>Add Event</p>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Event</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          {/* eslint-disable-next-line react-hooks/refs */}
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2.5'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className='max-h-36'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator className='my-5' />
            <EventDateRangePicker
              start={watchedStart}
              end={watchedEnd}
              onChange={(newStart, newEnd) => {
                form.setValue('start', newStart, { shouldValidate: true });
                form.setValue('end', newEnd, { shouldValidate: true });
              }}
            />
            <Separator className='my-5' />
            <PendingLinks onChange={(urls) => { pendingUrlsRef.current = urls; }} />
            <Separator className='my-5' />
            <PendingCosts
              preferredCurrency={preferredCurrency}
              onChange={(c) => { pendingCostsRef.current = c; }}
            />
            <FormField
              control={form.control}
              name='color'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colour</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild className='cursor-pointer'>
                        <div className='flex flex-row w-full items-center space-x-2 pl-2'>
                          <div
                            className={'w-5 h-5 rounded-full cursor-pointer'}
                            style={{ backgroundColor: field.value }}
                          ></div>
                          <Input {...field} />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className='flex mx-auto items-center justify-center'>
                        <HexColorPicker
                          className='flex'
                          color={field.value}
                          onChange={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter className='pt-2'>
              <AlertDialogCancel onClick={() => setEventAddOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction type='submit'>Add Event</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
