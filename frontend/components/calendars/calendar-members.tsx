'use client';

import { inviteToCalendar, removeMember } from '@/app/(app)/calendars/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { CalendarMember } from '@/lib/types';
import { X } from 'lucide-react';
import { useTransition, useRef, useState } from 'react';

interface CalendarMembersProps {
  calendarId: number;
  calendarName: string;
  members: CalendarMember[];
  currentUserId: number;
}

export function CalendarMembers({ calendarId, calendarName, members, currentUserId }: CalendarMembersProps) {
  const [isPending, startTransition] = useTransition();
  const [memberToRemove, setMemberToRemove] = useState<CalendarMember | null>(null);
  const { toast } = useToast();
  const emailRef  = useRef<HTMLInputElement>(null);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value.trim();
    if (!email) return;

    startTransition(async () => {
      try {
        await inviteToCalendar(calendarId, email);
        toast({ title: `An email has been sent to ${email}` });
        if (emailRef.current) emailRef.current.value = '';
      } catch {
        toast({ variant: 'destructive', title: 'Failed to invite user', description: 'Make sure the email is registered and not already a member.' });
      }
    });
  }

  function handleRemove(userId: number) {
    startTransition(async () => {
      try {
        await removeMember(calendarId, userId);
        toast({ title: 'Member removed.' });
      } catch {
        toast({ variant: 'destructive', title: 'Failed to remove member' });
      } finally {
        setMemberToRemove(null);
      }
    });
  }

  return (
    <>
      <div className='space-y-3'>
        <div className='rounded-md border divide-y'>
          {members.map((member) => (
            <div key={member.id} className='flex items-center justify-between px-4 py-3'>
              <div>
                <p className='text-sm font-medium'>{member.name}</p>
                <p className='text-xs text-muted-foreground'>{member.email}</p>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground capitalize'>{member.role}</span>
                {member.role !== 'owner' && member.id !== currentUserId && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    disabled={isPending}
                    onClick={() => setMemberToRemove(member)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleInvite} className='flex gap-2'>
          <Input
            ref={emailRef}
            type='email'
            placeholder='email@example.com'
            className='flex-1'
          />
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Inviting...' : 'Invite'}
          </Button>
        </form>
      </div>

      <AlertDialog open={memberToRemove !== null} onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> as an editor from <strong>{calendarName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isPending}
              onClick={() => memberToRemove && handleRemove(memberToRemove.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
