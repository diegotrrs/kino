'use client';

import { deleteCalendar }  from '@/app/(app)/calendars/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button }          from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast }        from '@/hooks/use-toast';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';

interface CalendarDeleteButtonProps {
  calendarId: number;
  calendarName: string;
}

export function CalendarDeleteButton({ calendarId, calendarName }: CalendarDeleteButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCalendar(calendarId);
        setDialogOpen(false);
        toast({ title: 'Calendar deleted' });
      } catch {
        toast({ variant: 'destructive', title: 'Failed to delete calendar' });
      }
    });
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' className='h-8 w-8 text-muted-foreground'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{calendarName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the calendar and all its events. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant='destructive' onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
