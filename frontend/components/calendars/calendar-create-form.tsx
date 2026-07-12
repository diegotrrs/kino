'use client';
import { createCalendar }  from '@/app/(app)/calendars/actions';
import { DateTimePicker }  from '@/components/date-picker';
import { Button }          from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
}                          from '@/components/ui/form';
import { Input }           from '@/components/ui/input';
import { useToast }        from '@/hooks/use-toast';
import { zodResolver }     from '@hookform/resolvers/zod';
import { format }          from 'date-fns';
import { useTranslations } from 'next-intl';
import { useRouter }       from 'next/navigation';
import { useTransition }   from 'react';
import { useForm }         from 'react-hook-form';
import { z }               from 'zod';

const schema = z.object({
  name:      z.string().min(1, { message: 'Calendar name is required.' }),
  startDate: z.date().optional(),
});

type FormValues = z.infer<typeof schema>;

type CalendarCreateFormProps = {
  initialName?: string;
}

export const CalendarCreateForm = ({ initialName }: CalendarCreateFormProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('createCalendar');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName ?? '', startDate: undefined },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const startDate = data.startDate ? format(data.startDate, 'yyyy-MM-dd') : undefined;
        await createCalendar(data.name, startDate);
        toast({ title: 'Calendar created!' });
        router.push('/home');
      } catch {
        toast({ variant: 'destructive', title: 'Failed to create calendar' });
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

        <FormField
          control={form.control}
          name='startDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('startDate')}</FormLabel>
              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  granularity='day'
                  displayFormat={{ hour24: 'PP', hour12: 'PP' }}
                  placeholder={t('startDatePlaceholder')}
                />
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
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
