'use client';

import { toggleFavourite }  from '@/app/(app)/calendars/actions';
import { Button }           from '@/components/ui/button';
import { useToast }         from '@/hooks/use-toast';
import { Star }             from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

interface CalendarFavouriteButtonProps {
  calendarId: number;
  isFavourite: boolean;
}

export function CalendarFavouriteButton({
  calendarId,
  isFavourite,
}: CalendarFavouriteButtonProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [optimisticFavourite, setOptimisticFavourite] = useOptimistic(isFavourite);

  function handleClick() {
    const next = !optimisticFavourite;
    startTransition(async () => {
      setOptimisticFavourite(next);
      try {
        await toggleFavourite(calendarId, next);
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
      aria-label={optimisticFavourite ? 'Remove from favourites' : 'Add to favourites'}
      className={optimisticFavourite ? 'text-yellow-400 hover:text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}
    >
      <Star
        className='h-5 w-5 transition-colors'
        fill={optimisticFavourite ? 'currentColor' : 'none'}
      />
    </Button>
  );
}
