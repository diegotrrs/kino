'use client';

import { toggleFavourite }  from '@/app/(app)/calendars/actions';
import { Button }           from '@/components/ui/button';
import { useToast }         from '@/hooks/use-toast';
import { Star }             from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

interface CalendarFavouriteButtonProps {
  calendarUuid: string;
  isFavourite: boolean;
  disabled?: boolean;
}

export function CalendarFavouriteButton({
  calendarUuid,
  isFavourite,
  disabled = false,
}: CalendarFavouriteButtonProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [optimisticFavourite, setOptimisticFavourite] = useOptimistic(isFavourite);

  function handleClick() {
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
      className={optimisticFavourite ? 'text-yellow-400 hover:text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}
    >
      <Star
        className='h-5 w-5 transition-colors'
        fill={optimisticFavourite ? 'currentColor' : 'none'}
      />
    </Button>
  );
}
