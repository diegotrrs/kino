'use client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
}                      from '@/components/ui/alert-dialog';
import { Button }      from '@/components/ui/button';
import { useEvents }   from '@/context/events-context';
import { useToast }    from '@/hooks/use-toast';
import { ToastAction } from './ui/toast';

type EventDeleteFormProps = {
  id?: string;
  title?: string;
}

export const EventDeleteForm = ({ id, title }: EventDeleteFormProps) => {
  const { deleteEvent } = useEvents();
  const { eventDeleteOpen, setEventDeleteOpen, setEventViewOpen } = useEvents();

  const { toast } = useToast();

  const onSubmit = async () => {
    deleteEvent(id!);
    setEventDeleteOpen(false);
    setEventViewOpen(false);
    toast({
      title: 'Event deleted!',
      action: (
        <ToastAction altText={'Dismiss notification.'}>Dismiss</ToastAction>
      ),
    });
  }

  return (
    <AlertDialog open={eventDeleteOpen}>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' onClick={() => setEventDeleteOpen(true)}>
          Delete Event
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex flex-row justify-between items-center'>
            <span>Delete {title}</span>
          </AlertDialogTitle>
          Are you sure you want to delete this event?
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setEventDeleteOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <Button variant='destructive' onClick={() => onSubmit()}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
