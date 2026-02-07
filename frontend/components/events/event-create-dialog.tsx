'use client';
import { createEvent }    from '@/app/events/actions';
import { DateTimePicker } from '@/components/date-picker';
import { Button }         from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
}                         from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
}                         from '@/components/ui/form';
import { Input }          from '@/components/ui/input';
import { Textarea }       from '@/components/ui/textarea';
import { ToastAction }    from '@/components/ui/toast';
import { useToast }       from '@/hooks/use-toast';
import { zodResolver }    from '@hookform/resolvers/zod';
import { PlusIcon }       from 'lucide-react';
import { useTransition }  from 'react';
import { useForm }        from 'react-hook-form';
import { z }              from 'zod';

const createEventSchema = z.object({
  title: z
    .string({ required_error: 'Please enter a title.' })
    .min(1, { message: 'Must provide a title for this event.' }),
  description: z.string().optional(),
  start: z.date({
    required_error: 'Please select a start time',
    invalid_type_error: "That's not a date!",
  }),
  end: z.date().optional(),
  location: z.string().optional(),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

export function EventCreateDialog() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
    },
  });

  function onSubmit(data: CreateEventFormValues) {
    startTransition(async () => {
      try {
        await createEvent({
          title: data.title,
          description: data.description || null,
          start_time: data.start.toISOString(),
          end_time: data.end ? data.end.toISOString() : null,
          location: data.location || null,
        });
        form.reset();
        toast({
          title: 'Event created!',
          action: (
            <ToastAction altText='Dismiss'>Dismiss</ToastAction>
          ),
        });
        // Close the dialog by clicking the hidden close button
        document.getElementById('create-event-dialog-close')?.click();
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to create event',
          action: (
            <ToastAction altText='Dismiss'>Dismiss</ToastAction>
          ),
        });
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className='h-4 w-4' />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Standup Meeting' {...field} />
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
                      placeholder='Event description'
                      className='max-h-36'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder='Conference Room A' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='start'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Start</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      hourCycle={12}
                      granularity='minute'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='end'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>End</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      hourCycle={12}
                      granularity='minute'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose id='create-event-dialog-close' className='hidden' />
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
