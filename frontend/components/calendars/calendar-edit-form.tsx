'use client';

import { updateCalendar, updateCalendarVisibility } from '@/app/(app)/calendars/actions';
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
import { Switch }         from '@/components/ui/switch';
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
  calendarUuid: string;
  currentName: string;
  isPublic: boolean;
}

export function CalendarEditForm({ calendarUuid, currentName, isPublic }: CalendarEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isVisibilityPending, startVisibilityTransition] = useTransition();
  const { toast } = useToast();
  const router    = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName },
  });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      try {
        await updateCalendar(calendarUuid, data.name);
        toast({ title: 'Calendar updated!' });
        router.push(`/calendars/${calendarUuid}`);
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update calendar' });
      }
    });
  }

  function handleVisibilityChange(checked: boolean) {
    startVisibilityTransition(async () => {
      try {
        await updateCalendarVisibility(calendarUuid, checked);
        toast({ title: checked ? 'Calendar is now public' : 'Calendar is now private' });
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update visibility' });
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

        <div className='space-y-2'>
          <p className='text-sm font-medium leading-none'>Visibility</p>
          <div className='flex items-center gap-3'>
            <Switch
              id='visibility-toggle'
              checked={isPublic}
              onCheckedChange={handleVisibilityChange}
              disabled={isVisibilityPending}
            />
            <label
              htmlFor='visibility-toggle'
              className='text-sm text-muted-foreground cursor-pointer select-none'
            >
              {isPublic ? 'Public — anyone with the link can view' : 'Private — only members can view'}
            </label>
          </div>
        </div>

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
