'use client';

import { useEvents } from '@/context/events-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ReadOnlyBanner() {
  const { readOnly } = useEvents();
  const pathname = usePathname();

  if (!readOnly) return null;

  const redirect = encodeURIComponent(pathname);

  return (
    <div className='w-full bg-muted/80 border-b px-4 py-2 flex items-center justify-between gap-4 text-sm'>
      <p className='text-muted-foreground'>
        Viewing in read-only mode. Sign in to edit, save, or duplicate this trip.
      </p>
      <div className='flex items-center gap-2 shrink-0'>
        <Link
          href={`/login?redirect=${redirect}`}
          className='text-sm font-medium underline-offset-2 hover:underline'
        >
          Sign in
        </Link>
        <Link
          href={`/signup?redirect=${redirect}`}
          className='text-sm font-medium underline-offset-2 hover:underline'
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
