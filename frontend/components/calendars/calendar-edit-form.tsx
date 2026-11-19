'use client';
import {
  updateCalendar,
  updateCalendarVisibility
}                          from '@/app/(app)/calendars/actions';
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
import { Switch }          from '@/components/ui/switch';
import { useToast }        from '@/hooks/use-toast';
import { zodResolver }     from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
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

type CalendarEditFormProps = {
  calendarUuid: string;
  currentName: string;
  isPublic: boolean;
  currentStartDate?: string;
}

export const CalendarEditForm = ({ calendarUuid, currentName, isPublic, currentStartDate }: CalendarEditFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [isVisibilityPending, startVisibilityTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('createCalendar');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:      currentName,
      startDate: currentStartDate ? parseISO(currentStartDate) : undefined,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const startDate = data.startDate ? format(data.startDate, 'yyyy-MM-dd') : undefined;
        await updateCalendar(calendarUuid, data.name, startDate);
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
