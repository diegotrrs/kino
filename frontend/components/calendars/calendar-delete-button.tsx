'use client';
import { deleteCalendar }      from '@/app/(app)/calendars/actions';
import { CalendarShareDialog } from '@/components/calendars/calendar-share-dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
}                              from '@/components/ui/alert-dialog';
import { Button }              from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
}                              from '@/components/ui/dropdown-menu';
import { useToast }            from '@/hooks/use-toast';
import {
  MoreHorizontal,
  Share2,
  Trash2
}                              from 'lucide-react';
import { useRouter }           from 'next/navigation';
import {
  useState,
  useTransition
}                              from 'react';

type CalendarDeleteButtonProps = {
  calendarUuid: string;
  calendarName: string;
  isPublic?: boolean;
  role?: string;
  variant?: 'dropdown' | 'button';
}

export const CalendarDeleteButton = ({
  calendarUuid,
  calendarName,
  isPublic = false,
  role,
  variant = 'dropdown',
}: CalendarDeleteButtonProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const canShare = role === 'owner' || role === 'editor';

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCalendar(calendarUuid);
        setDeleteDialogOpen(false);
        toast({ title: 'Calendar deleted' });
        router.push('/home');
      } catch {
        toast({ variant: 'destructive', title: 'Failed to delete calendar' });
      }
    });
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        {variant === 'dropdown' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 text-muted-foreground'>
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {canShare && (
                <>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setShareDialogOpen(true);
                    }}
                  >
                    <Share2 className='mr-2 h-4 w-4' />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
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
        ) : (
          <AlertDialogTrigger asChild>
            <Button variant='destructive' size='sm'>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete calendar
            </Button>
          </AlertDialogTrigger>
        )}

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{calendarName}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &ldquo;{calendarName}&rdquo; and all its events. You can recover the calendar later from Settings.
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

      {canShare && (
        <CalendarShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          calendarUuid={calendarUuid}
          calendarName={calendarName}
          isPublic={isPublic}
        />
      )}
    </>
  );
}
