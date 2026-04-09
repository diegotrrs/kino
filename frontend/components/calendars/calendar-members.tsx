'use client';

import { inviteToCalendar, removeMember } from '@/app/(app)/calendars/actions';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { CalendarMember } from '@/lib/types';
import { X } from 'lucide-react';
import { useTransition, useRef } from 'react';

interface CalendarMembersProps {
  calendarId: number;
  members: CalendarMember[];
  currentUserId: number;
}

export function CalendarMembers({ calendarId, members, currentUserId }: CalendarMembersProps) {
  const [isPending, startTransition] = useTransition();
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
      }
    });
  }

  return (
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
                  onClick={() => handleRemove(member.id)}
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
  );
}
