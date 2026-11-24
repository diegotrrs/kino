'use client';
import { createCalendar, createTripCalendar } from '@/app/(app)/calendars/actions';
import { EndDateField }    from '@/components/calendars/end-date-field';
import { track } from '@/lib/analytics/events';
import { isEndBeforeStart } from '@/lib/calendar-dates';
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
import { useMemo, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z }               from 'zod';

const getSchema = (endBeforeStartMessage: string) =>
  z.object({
    name:      z.string().min(1, { message: 'Calendar name is required.' }),
    startDate: z.date().optional(),
    endDate:   z.date().optional(),
  }).refine((data) => !isEndBeforeStart(data.startDate, data.endDate, new Date()), {
    message: endBeforeStartMessage,
    path:    ['endDate'],
  });

type FormValues = z.infer<ReturnType<typeof getSchema>>;

type CalendarCreateFormProps = {
  initialName?: string;
  tripSlug?: string;
}

export const CalendarCreateForm = ({ initialName, tripSlug }: CalendarCreateFormProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('createCalendar');
  const schema = useMemo(() => getSchema(t('endBeforeStart')), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName ?? '', startDate: undefined, endDate: undefined },
  });
  const startDate = useWatch({ control: form.control, name: 'startDate' });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const startDate = data.startDate
          ? format(data.startDate, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
        const endDate = data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined;

        if (tripSlug) {
          const { uuid } = await createTripCalendar(tripSlug, data.name, startDate);
          track('calendar_created', {
            source: 'hot_trip', hot_trip_slug: tripSlug, has_start_date: !!data.startDate, has_end_date: true,
          });
          toast({ title: t('createdWithItinerary') });
          router.push(`/calendars/${uuid}`);
        } else {
          await createCalendar(data.name, data.startDate ? startDate : undefined, endDate);
          track('calendar_created', { source: 'blank', has_start_date: !!data.startDate, has_end_date: !!endDate });
          toast({ title: t('created') });
          router.push('/home');
        }
      } catch {
        toast({ variant: 'destructive', title: t('createFailed') });
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
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('namePlaceholder')} {...field} />
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

        {!tripSlug && (
          <FormField
            control={form.control}
            name='endDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('endDate')}</FormLabel>
                <FormControl>
                  <EndDateField value={field.value} onChange={field.onChange} startDate={startDate} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? t('creating') : t('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
