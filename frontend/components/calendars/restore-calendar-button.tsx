'use client';
import { restoreCalendar } from '@/app/(app)/calendars/actions';
import { Button }          from '@/components/ui/button';
import { useToast }        from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useRouter }       from 'next/navigation';
import { useTransition }   from 'react';

type RestoreCalendarButtonProps = {
  calendarUuid: string;
}

export const RestoreCalendarButton = ({ calendarUuid }: RestoreCalendarButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('restoreCalendar');

  const handleRestore = () => {
    startTransition(async () => {
      try {
        await restoreCalendar(calendarUuid);
        toast({ title: t('restored') });
        router.refresh();
      } catch {
        toast({ variant: 'destructive', title: t('restoreFailed') });
      }
    });
  }

  return (
    <Button variant='outline' size='sm' onClick={handleRestore} disabled={isPending}>
      {isPending ? t('restoring') : t('restore')}
    </Button>
  );
}
