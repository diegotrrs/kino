'use client';

import { CalendarShareDialog } from '@/components/calendars/calendar-share-dialog';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface CalendarShareButtonProps {
  calendarUuid: string;
  calendarName: string;
  isPublic: boolean;
}

export function CalendarShareButton({
  calendarUuid,
  calendarName,
  isPublic,
}: CalendarShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        aria-label='Share calendar'
        onClick={() => setOpen(true)}
      >
        <Share2 className='h-5 w-5 text-muted-foreground' />
      </Button>

      <CalendarShareDialog
        open={open}
        onOpenChange={setOpen}
        calendarUuid={calendarUuid}
        calendarName={calendarName}
        isPublic={isPublic}
      />
    </>
  );
}
