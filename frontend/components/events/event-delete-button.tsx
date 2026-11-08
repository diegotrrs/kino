'use client';
import { deleteEvent }     from '@/app/(app)/events/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
}                          from '@/components/ui/alert-dialog';
import { Button }          from '@/components/ui/button';
import { ToastAction }     from '@/components/ui/toast';
import { useToast }        from '@/hooks/use-toast';
import { Trash2Icon }      from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition }   from 'react';

type EventDeleteButtonProps = {
  eventId: number;
  eventTitle: string;
}

export const EventDeleteButton = ({
  eventId,
  eventTitle,
}: EventDeleteButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const t = useTranslations('events');
  const tDialog = useTranslations('eventDialog');

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEvent(eventId);
        toast({
          title: 'Event deleted!',
          action: (
            <ToastAction altText='Dismiss'>Dismiss</ToastAction>
          ),
        });
      } catch {
        toast({
          variant: 'destructive',
          title: 'Failed to delete event',
          action: (
            <ToastAction altText='Dismiss'>Dismiss</ToastAction>
          ),
        });
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground hover:text-destructive'
          aria-label={t('deleteEvent', { title: eventTitle })}
        >
          <Trash2Icon className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className='max-w-sm gap-0 p-0'>
        <AlertDialogHeader className='space-y-2 px-6 pt-6 pb-5 text-left'>
          <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-destructive'>{tDialog('delete')}</span>
          <AlertDialogTitle className='font-display text-xl font-extrabold tracking-tight'>
            {tDialog('deleteTitle', { title: eventTitle })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tDialog('deleteDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='flex-row justify-end gap-2 border-t-2 border-dashed px-6 py-4 sm:space-x-0'>
          <AlertDialogCancel className='mt-0'>{tDialog('cancel')}</AlertDialogCancel>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? tDialog('deleting') : tDialog('delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
