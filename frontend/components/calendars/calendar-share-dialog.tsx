'use client';

import { updateCalendarVisibility } from '@/app/(app)/calendars/actions';
import { Button }  from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
}                  from '@/components/ui/dialog';
import { Switch }  from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Copy, Facebook, Mail, MessageCircle } from 'lucide-react';
import { useState, useTransition } from 'react';

interface CalendarShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarUuid: string;
  calendarName: string;
  isPublic: boolean;
}

export function CalendarShareDialog({
  open,
  onOpenChange,
  calendarUuid,
  calendarName,
  isPublic: initialIsPublic,
}: CalendarShareDialogProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/calendars/${calendarUuid}`
      : `/calendars/${calendarUuid}`;

  function handleVisibilityToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await updateCalendarVisibility(calendarUuid, checked);
        setIsPublic(checked);
        toast({ title: checked ? 'Calendar is now public' : 'Calendar is now private' });
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update visibility' });
      }
    });
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  function handleFacebook() {
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=0&redirect_uri=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  }

  function handleEmail() {
    window.open(
      `mailto:?subject=${encodeURIComponent(calendarName)}&body=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Share &ldquo;{calendarName}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className='space-y-5 pt-1'>
          {!isPublic && (
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <Switch
                  id='share-visibility-toggle'
                  checked={isPublic}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={isPending}
                />
                <label
                  htmlFor='share-visibility-toggle'
                  className='text-sm text-muted-foreground cursor-pointer select-none'
                >
                  Make public to share
                </label>
              </div>
              <p className='text-xs text-muted-foreground'>
                This calendar is private. Enable sharing to let anyone with the link view it.
              </p>
            </div>
          )}

          {isPublic && (
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <Switch
                  id='share-visibility-toggle'
                  checked={isPublic}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={isPending}
                />
                <label
                  htmlFor='share-visibility-toggle'
                  className='text-sm text-muted-foreground cursor-pointer select-none'
                >
                  Public — anyone with the link can view
                </label>
              </div>
            </div>
          )}

          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={handleWhatsApp}
              disabled={!isPublic}
            >
              <MessageCircle className='h-4 w-4' />
              WhatsApp
            </Button>

            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={handleFacebook}
              disabled={!isPublic}
            >
              <Facebook className='h-4 w-4' />
              Messenger
            </Button>

            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={handleEmail}
              disabled={!isPublic}
            >
              <Mail className='h-4 w-4' />
              Email
            </Button>

            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={handleCopy}
              disabled={!isPublic}
            >
              <Copy className='h-4 w-4' />
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          </div>

          {copied && (
            <p className='text-xs text-center text-muted-foreground'>
              Now paste the url in an app
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
