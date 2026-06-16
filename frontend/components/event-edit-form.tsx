'use client';
import {
  deleteEvent as deleteEventAction,
  updateEvent
}                         from '@/app/(app)/events/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
}                         from '@/components/ui/alert-dialog';
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
import { CalendarEvent }  from '@/utils/data';
import { zodResolver }    from '@hookform/resolvers/zod';
import { format }         from 'date-fns';
import React, {
  useEffect,
  useRef,
  useState
}                         from 'react';
import type { EventLink } from '@/lib/types';
import { HexColorPicker } from 'react-colorful';
import {
  useForm,
  useWatch
}                         from 'react-hook-form';
import { z }              from 'zod';
import { EventDateRangePicker } from './events/event-date-range-picker';
import { EventLinks }     from './events/event-links';
import { Button }         from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
}                         from './ui/popover';
import { Textarea }       from './ui/textarea';
import { ToastAction }    from './ui/toast';

const eventEditFormSchema = z.object({
  id: z.string(),
  title: z
    .string({ required_error: 'Please enter a title.' })
    .min(1, { message: 'Must provide a title for this event.' }),
  description: z.string().optional(),
  start: z.date({
    required_error: 'Please select a start time',
    invalid_type_error: "That's not a date!",
  }),
  end: z.date({
    required_error: 'Please select an end time',
    invalid_type_error: "That's not a date!",
  }),
  color: z
    .string({ required_error: 'Please select an event color.' })
    .min(1, { message: 'Must provide a title for this event.' }),
});

type EventEditFormValues = z.infer<typeof eventEditFormSchema>;

type EventEditFormProps = {
  oldEvent?: CalendarEvent;
  event?: CalendarEvent;
  isDrag: boolean;
  displayButton?: boolean;
}

export const EventEditForm = ({
  oldEvent,
  event,
  isDrag,
}: EventEditFormProps) => {
  const { calendarId, readOnly, addEvent, deleteEvent } = useEvents();
  const { eventEditOpen, setEventEditOpen } = useEvents();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const currentLinksRef = useRef<EventLink[]>(event?.links ?? []);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof eventEditFormSchema>>({
    resolver: zodResolver(eventEditFormSchema),
  });
  const watchedStart = useWatch({ control: form.control, name: 'start' });
  const watchedEnd   = useWatch({ control: form.control, name: 'end' });

  const handleEditCancellation = () => {
    if (isDrag && oldEvent) {
      const resetEvent = {
        id: oldEvent.id,
        title: oldEvent.title,
        description: oldEvent.description,
        start: oldEvent.start,
        end: oldEvent.end,
        color: oldEvent.backgroundColor!,
      };

      deleteEvent(oldEvent.id);
      addEvent(resetEvent);
    }
    setConfirmingDelete(false);
    setEventEditOpen(false);
  };

  useEffect(() => {
    setConfirmingDelete(false);
    currentLinksRef.current = event?.links ?? [];
    form.reset({
      id: event?.id,
      title: event?.title,
      description: event?.description,
      start: event?.start as Date,
      end: event?.end as Date,
      color: event?.backgroundColor,
    });
  }, [form, event]);

  const onSubmit = async (data: EventEditFormValues) => {
    const newEvent = {
      id: data.id,
      title: data.title,
      description: data.description,
      start: data.start,
      end: data.end,
      backgroundColor: data.color,
      links: currentLinksRef.current,
    };

    if (calendarId !== undefined) {
      try {
        await updateEvent(Number(data.id), {
          title: data.title,
          description: data.description,
          date: format(data.start, 'yyyy-MM-dd'),
          start_time: format(data.start, 'HH:mm:ss'),
          end_date: format(data.end, 'yyyy-MM-dd'),
          end_time: format(data.end, 'HH:mm:ss'),
          color: data.color,
        });
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to save event',
          action: <ToastAction altText='Dismiss'>Dismiss</ToastAction>,
        });
        return;
      }
    }

    deleteEvent(data.id);
    addEvent(newEvent);
    setEventEditOpen(false);

    toast({
      title: 'Event edited!',
      action: (
        <ToastAction altText={'Click here to dismiss notification'}>
          Dismiss
        </ToastAction>
      ),
    });
  }

  const handleDelete = async () => {
    const id = form.getValues('id');
    if (!id) return;

    if (calendarId !== undefined) {
      try {
        await deleteEventAction(Number(id));
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to delete event',
          action: <ToastAction altText='Dismiss'>Dismiss</ToastAction>,
        });
        return;
      }
    }

    deleteEvent(id);
    setConfirmingDelete(false);
    setEventEditOpen(false);

    toast({
      title: 'Event deleted!',
      action: (
        <ToastAction altText={'Click here to dismiss notification'}>
          Dismiss
        </ToastAction>
      ),
    });
  }

  return (
    <AlertDialog open={eventEditOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit {event?.title}</AlertDialogTitle>
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
                    <Input placeholder='Standup Meeting' readOnly={readOnly} {...field} />
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
                      className='resize-none'
                      readOnly={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator className='my-5' />
            <EventDateRangePicker
              key={event?.id}
              start={watchedStart}
              end={watchedEnd}
              defaultMultiDay={
                !!event?.start && !!event?.end &&
                new Date(event.start as Date).toDateString() !== new Date(event.end as Date).toDateString()
              }
              detectMultiDay
              onChange={(newStart, newEnd) => {
                form.setValue('start', newStart, { shouldValidate: true });
                form.setValue('end', newEnd, { shouldValidate: true });
              }}
              disabled={readOnly}
            />
            <Separator className='my-5' />
            <EventLinks
              key={event?.id}
              eventId={Number(event?.id)}
              initialLinks={event?.links ?? []}
              readOnly={readOnly}
              onLinksChange={(links) => { currentLinksRef.current = links; }}
            />
            <FormField
              control={form.control}
              name='color'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colour</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild disabled={readOnly} className={readOnly ? 'cursor-default' : 'cursor-pointer'}>
                        <div className='flex flex-row w-full items-center space-x-2 pl-2'>
                          <div
                            className={'w-5 h-5 rounded-full'}
                            style={{ backgroundColor: field.value }}
                          ></div>
                          <Input readOnly={readOnly} {...field} />
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

            <AlertDialogFooter className='pt-2 flex-row items-center'>
              {!readOnly && !isDrag && !confirmingDelete && (
                <Button
                  type='button'
                  variant='destructive'
                  className='mr-auto'
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              )}
              {!readOnly && !isDrag && confirmingDelete && (
                <>
                  <span className='text-sm text-muted-foreground mr-auto'>
                    Delete this event?
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setConfirmingDelete(false)}
                  >
                    No
                  </Button>
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={handleDelete}
                  >
                    Yes, Delete
                  </Button>
                </>
              )}
              {!confirmingDelete && (
                <>
                  <AlertDialogCancel onClick={handleEditCancellation}>
                    {readOnly ? 'Close' : 'Cancel'}
                  </AlertDialogCancel>
                  {!readOnly && (
                    <AlertDialogAction type='submit'>Save</AlertDialogAction>
                  )}
                </>
              )}
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
