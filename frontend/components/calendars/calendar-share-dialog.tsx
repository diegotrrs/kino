'use client';
import { updateCalendarVisibility } from '@/app/(app)/calendars/actions';
import { track } from '@/lib/analytics/events';
import { Button }                   from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
}                                   from '@/components/ui/dialog';
import { Switch }                   from '@/components/ui/switch';
import { useToast }                 from '@/hooks/use-toast';
import {
  Copy,
  Facebook,
  Mail,
  MessageCircle
}                                   from 'lucide-react';
import { useTranslations }     from 'next-intl';
import {
  useState,
  useTransition
}                                   from 'react';

type CalendarShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarUuid: string;
  calendarName: string;
  isPublic: boolean;
}

export const CalendarShareDialog = ({
  open,
  onOpenChange,
  calendarUuid,
  calendarName,
  isPublic: initialIsPublic,
}: CalendarShareDialogProps) => {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('shareCalendar');

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/calendars/${calendarUuid}`
      : `/calendars/${calendarUuid}`;

  const handleVisibilityToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        await updateCalendarVisibility(calendarUuid, checked);
        track('calendar_visibility_changed', { is_public: checked, from: 'share_dialog' });
        setIsPublic(checked);
        toast({ title: checked ? t('nowPublic') : t('nowPrivate') });
      } catch {
        toast({ variant: 'destructive', title: t('visibilityFailed') });
      }
    });
  }

  const handleWhatsApp = () => {
    track('calendar_share_link_used', { channel: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  const handleFacebook = () => {
    track('calendar_share_link_used', { channel: 'messenger' });
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=0&redirect_uri=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  }

  const handleEmail = () => {
    track('calendar_share_link_used', { channel: 'email' });
    window.open(
      `mailto:?subject=${encodeURIComponent(calendarName)}&body=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      track('calendar_share_link_used', { channel: 'copy' });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('title', { name: calendarName })}</DialogTitle>
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
                  {t('makePublic')}
                </label>
              </div>
              <p className='text-xs text-muted-foreground'>
                {t('privateHint')}
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
                  {t('publicLabel')}
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
              {t('email')}
            </Button>

            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={handleCopy}
              disabled={!isPublic}
            >
              <Copy className='h-4 w-4' />
              {copied ? t('copied') : t('copyLink')}
            </Button>
          </div>

          {copied && (
            <p className='text-xs text-center text-muted-foreground'>
              {t('pasteHint')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
