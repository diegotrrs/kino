'use client';
import {
  updateCalendar,
  updateCalendarVisibility
}                          from '@/app/(app)/calendars/actions';
import { EndDateField }    from '@/components/calendars/end-date-field';
import { DateTimePicker }  from '@/components/date-picker';
import { track } from '@/lib/analytics/events';
import { isEndBeforeStart } from '@/lib/calendar-dates';
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
import { Switch }          from '@/components/ui/switch';
import { useToast }        from '@/hooks/use-toast';
import { zodResolver }     from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
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

type CalendarEditFormProps = {
  calendarUuid: string;
  currentName: string;
  isPublic: boolean;
  currentStartDate?: string;
  currentEndDate: string | null;
}

export const CalendarEditForm = ({
  calendarUuid, currentName, isPublic, currentStartDate, currentEndDate,
}: CalendarEditFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [isVisibilityPending, startVisibilityTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('createCalendar');
  const schema = useMemo(() => getSchema(t('endBeforeStart')), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:      currentName,
      startDate: currentStartDate ? parseISO(currentStartDate) : undefined,
      endDate:   currentEndDate ? parseISO(currentEndDate) : undefined,
    },
  });
  const startDate = useWatch({ control: form.control, name: 'startDate' });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const startDate = data.startDate ? format(data.startDate, 'yyyy-MM-dd') : undefined;
        const endDate = data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null;
        await updateCalendar(calendarUuid, data.name, startDate, endDate);
        const changed = [
          ...(data.name !== currentName ? ['name' as const] : []),
          ...(startDate !== currentStartDate ? ['start_date' as const] : []),
          ...(endDate !== currentEndDate ? ['end_date' as const] : []),
        ];
        track('calendar_updated', { changed });
        toast({ title: t('updated') });
        router.push(`/calendars/${calendarUuid}`);
      } catch {
        toast({ variant: 'destructive', title: t('updateFailed') });
      }
    });
  }

  const handleVisibilityChange = (checked: boolean) => {
    startVisibilityTransition(async () => {
      try {
        await updateCalendarVisibility(calendarUuid, checked);
        track('calendar_visibility_changed', { is_public: checked, from: 'settings' });
        toast({ title: checked ? t('nowPublic') : t('nowPrivate') });
      } catch {
        toast({ variant: 'destructive', title: t('visibilityFailed') });
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

        <div className='space-y-2'>
          <p className='text-sm font-medium leading-none'>{t('visibility')}</p>
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
              {isPublic ? t('public') : t('private')}
            </label>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
