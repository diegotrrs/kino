'use client';
import { toggleVote } from '@/app/(app)/feedback/actions';
import { useToast }   from '@/hooks/use-toast';
import { ThumbsUp }   from 'lucide-react';
import {
  useOptimistic,
  useTransition
}                     from 'react';

type WishlistItem = {
  id: number;
  title: string;
  description: string;
  vote_count: number;
  user_has_voted: boolean;
}

type WishlistProps = {
  items: WishlistItem[];
}

export const Wishlist = ({ items }: WishlistProps) => {
  const [optimisticItems, updateOptimistic] = useOptimistic(
    items,
    (state, { id, voted }: { id: number; voted: boolean }) =>
      state.map((item) =>
        item.id === id
          ? {
              ...item,
              user_has_voted: voted,
              vote_count: voted ? item.vote_count + 1 : item.vote_count - 1,
            }
          : item
      )
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = (item: WishlistItem) => {
    const voted = !item.user_has_voted;
    startTransition(async () => {
      updateOptimistic({ id: item.id, voted });
      try {
        await toggleVote(item.id, item.user_has_voted);
      } catch {
        toast({ variant: 'destructive', title: 'Failed to update vote' });
      }
    });
  }

  return (
    <div className='rounded-lg border divide-y'>
      {optimisticItems.map((item) => (
        <div key={item.id} className='flex items-start gap-4 px-4 py-3'>
          <div className='flex-1 min-w-0 space-y-0.5'>
            <p className='text-sm font-medium'>{item.title}</p>
            <p className='text-xs text-muted-foreground'>{item.description}</p>
          </div>
          <button
            onClick={() => handleToggle(item)}
            disabled={isPending}
            className='flex items-center gap-1.5 shrink-0 text-sm disabled:opacity-50'
            aria-label={item.user_has_voted ? 'Remove vote' : 'Vote for this feature'}
          >
            <ThumbsUp
              className={`h-4 w-4 transition-colors ${
                item.user_has_voted
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            />
            <span className={`tabular-nums ${item.user_has_voted ? 'text-primary' : 'text-muted-foreground'}`}>
              {item.vote_count}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
