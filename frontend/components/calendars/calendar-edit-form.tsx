'use client';

import { updateCalendar } from '@/app/(app)/calendars/actions';
import { Button }         from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
}                         from '@/components/ui/form';
import { Input }          from '@/components/ui/input';
import { useToast }       from '@/hooks/use-toast';
import { zodResolver }    from '@hookform/resolvers/zod';
import { useRouter }      from 'next/navigation';
import { useTransition }  from 'react';
import { useForm }        from 'react-hook-form';
import { z }              from 'zod';

const schema = z.object({
  name: z.string().min(1, { message: 'Calendar name is required.' }),
});

type FormValues = z.infer<typeof schema>;

interface CalendarEditFormProps {
  calendarId: number;
  currentName: string;
}

export function CalendarEditForm({ calendarId, currentName }: CalendarEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router    = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName },
  });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      try {
        await updateCalendar(calendarId, data.name);
        toast({ title: 'Calendar updated!' });
        router.push(`/calendars/${calendarId}`);
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update calendar' });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='My Calendar' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
