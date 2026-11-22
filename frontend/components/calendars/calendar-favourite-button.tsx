'use client';
import { toggleFavourite } from '@/app/(app)/calendars/actions';
import { Button }          from '@/components/ui/button';
import { useToast }        from '@/hooks/use-toast';
import { track }            from '@/lib/analytics/events';
import { Star }            from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useOptimistic,
  useTransition
}                          from 'react';

type CalendarFavouriteButtonProps = {
  calendarUuid: string;
  isFavourite: boolean;
  disabled?: boolean;
}

export const CalendarFavouriteButton = ({
  calendarUuid,
  isFavourite,
  disabled = false,
}: CalendarFavouriteButtonProps) => {
  const { toast } = useToast();
  const t = useTranslations('favourite');
  const [, startTransition] = useTransition();
  const [optimisticFavourite, setOptimisticFavourite] = useOptimistic(isFavourite);

  const handleClick = () => {
    const next = !optimisticFavourite;
    startTransition(async () => {
      setOptimisticFavourite(next);
      try {
        await toggleFavourite(calendarUuid, next);
        track('calendar_favourited', { is_favourite: next });
      } catch {
        toast({ variant: 'destructive', title: t('failed') });
      }
    });
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleClick}
      disabled={disabled}
      aria-label={optimisticFavourite ? t('remove') : t('add')}
      className={optimisticFavourite ? 'text-ev-ochre hover:text-ev-ochre/80' : 'text-muted-foreground hover:text-ev-ochre'}
    >
      <Star
        className='h-5 w-5 transition-colors'
        fill={optimisticFavourite ? 'currentColor' : 'none'}
      />
    </Button>
  );
}
