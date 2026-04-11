import { Lock } from 'lucide-react';

export function PrivateCalendarOverlay() {
  return (
    <div className='absolute inset-0 z-20 flex items-center justify-center'>
      <div className='absolute inset-0 bg-background/70 backdrop-blur-sm' />
      <div className='relative z-10 flex flex-col items-center gap-3 rounded-xl border bg-card p-8 shadow-lg text-center max-w-xs mx-4'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <Lock className='h-6 w-6 text-muted-foreground' />
        </div>
        <div className='space-y-1'>
          <h3 className='text-base font-semibold'>This calendar is private</h3>
          <p className='text-sm text-muted-foreground'>
            Ask the owner to share access.
          </p>
        </div>
      </div>
    </div>
  );
}
