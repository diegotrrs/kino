'use client';

import { navItems }   from '@/lib/nav';
import { cn }          from '@/lib/utils';
import Link            from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileBottomNav({ isLoggedIn = true }: { isLoggedIn?: boolean }) {
  const pathname  = usePathname();
  const mainItems = navItems.filter((i) => i.section === 'main');

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-background md:hidden'>
      {mainItems.map((item) => {
        const Icon     = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={isLoggedIn ? item.href : '#'}
            aria-disabled={!isLoggedIn}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
              !isLoggedIn
                ? 'pointer-events-none opacity-40 text-muted-foreground'
                : isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground',
            )}
          >
            <Icon className='h-5 w-5' />
            <span className='text-[0.65rem] leading-none'>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
