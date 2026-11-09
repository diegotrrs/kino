import { cn } from '@/lib/utils';

export const Wordmark = ({ className }: { className?: string }) => {
  return (
    <span className={cn('inline-flex items-baseline gap-0.5 font-display text-2xl font-extrabold leading-none tracking-tighter select-none', className)}>
      kino
      {/* Orange globe in place of the full stop; sized in em so it scales with the wordmark */}
      <svg aria-hidden='true' viewBox='0 0 24 24' className='h-[0.42em] w-[0.42em] shrink-0'>
        <circle cx='12' cy='12' r='12' className='fill-primary' />
        <g fill='none' strokeWidth='1.8' strokeLinecap='round' className='stroke-background'>
          <ellipse cx='12' cy='12' rx='4.6' ry='11' />
          <path d='M1.5 12h21' />
          <path d='M3.5 6.5h17M3.5 17.5h17' />
        </g>
      </svg>
    </span>
  );
};
