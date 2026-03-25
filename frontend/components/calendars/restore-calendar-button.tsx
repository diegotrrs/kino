'use client';

import { restoreCalendar }     from '@/app/(app)/calendars/actions';
import { Button }              from '@/components/ui/button';
import { useToast }            from '@/hooks/use-toast';
import { useRouter }           from 'next/navigation';
import { useTransition }       from 'react';

interface RestoreCalendarButtonProps {
  calendarId: number;
}

export function RestoreCalendarButton({ calendarId }: RestoreCalendarButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleRestore() {
    startTransition(async () => {
      try {
        await restoreCalendar(calendarId);
        toast({ title: 'Calendar restored' });
        router.refresh();
      } catch {
        toast({ variant: 'destructive', title: 'Failed to restore calendar' });
      }
    });
  }

  return (
    <Button variant='outline' size='sm' onClick={handleRestore} disabled={isPending}>
      {isPending ? 'Restoring...' : 'Restore'}
    </Button>
  );
}
