import { cn } from '@/lib/utils';

export const Wordmark = ({ className }: { className?: string }) => {
  return (
    <span className={cn('inline-flex items-baseline gap-0.5 font-display text-2xl font-extrabold leading-none tracking-tighter select-none', className)}>
      kino
      <span aria-hidden='true' className='inline-block h-2 w-2 rounded-full bg-primary' />
    </span>
  );
};
