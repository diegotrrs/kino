'use client';
import { deleteEvent }   from '@/app/events/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
}                        from '@/components/ui/alert-dialog';
import { Button }        from '@/components/ui/button';
import { ToastAction }   from '@/components/ui/toast';
import { useToast }      from '@/hooks/use-toast';
import { Trash2Icon }    from 'lucide-react';
import { useTransition } from 'react';

interface EventDeleteButtonProps {
  eventId: number;
  eventTitle: string;
}

export function EventDeleteButton({
  eventId,
  eventTitle,
}: EventDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete() {
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
        <Button variant='ghost' size='icon' className='h-8 w-8 text-muted-foreground hover:text-destructive'>
          <Trash2Icon className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{eventTitle}&rdquo;</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
