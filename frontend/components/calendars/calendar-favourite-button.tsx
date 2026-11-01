'use client';
import { toggleFavourite } from '@/app/(app)/calendars/actions';
import { Button }          from '@/components/ui/button';
import { useToast }        from '@/hooks/use-toast';
import { Star }            from 'lucide-react';
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
  const [, startTransition] = useTransition();
  const [optimisticFavourite, setOptimisticFavourite] = useOptimistic(isFavourite);

  const handleClick = () => {
    const next = !optimisticFavourite;
    startTransition(async () => {
      setOptimisticFavourite(next);
      try {
        await toggleFavourite(calendarUuid, next);
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update favourite' });
      }
    });
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleClick}
      disabled={disabled}
      aria-label={optimisticFavourite ? 'Remove from favourites' : 'Add to favourites'}
      className={optimisticFavourite ? 'text-ev-ochre hover:text-ev-ochre/80' : 'text-muted-foreground hover:text-ev-ochre'}
    >
      <Star
        className='h-5 w-5 transition-colors'
        fill={optimisticFavourite ? 'currentColor' : 'none'}
      />
    </Button>
  );
}
