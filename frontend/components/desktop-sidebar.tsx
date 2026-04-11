'use client';

import { navItems }    from '@/lib/nav';
import type { CurrentUser } from '@/components/app-shell';
import { UserButton }  from '@/components/user-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn }          from '@/lib/utils';
import Link            from 'next/link';
import { usePathname } from 'next/navigation';

interface DesktopSidebarProps {
  user: CurrentUser | null;
  isLoggedIn: boolean;
}

export function DesktopSidebar({ user, isLoggedIn }: DesktopSidebarProps) {
  const pathname = usePathname();

  const mainItems   = navItems.filter((i) => i.section === 'main');
  const bottomItems = navItems.filter((i) => i.section === 'bottom');

  return (
    <TooltipProvider>
    <aside className='hidden md:flex fixed left-0 top-14 bottom-0 z-40 w-16 flex-col items-center border-r bg-background py-4'>
      <nav className='flex flex-1 flex-col items-center gap-2'>
        {mainItems.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={isLoggedIn ? item.href : '#'}
                  aria-disabled={!isLoggedIn}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    !isLoggedIn
                      ? 'pointer-events-none opacity-40 text-muted-foreground'
                      : isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className='h-5 w-5' />
                  <span className='sr-only'>{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side='right'>{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <nav className='flex flex-col items-center gap-2'>
        <UserButton user={user} />
        {bottomItems.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={isLoggedIn ? item.href : '#'}
                  aria-disabled={!isLoggedIn}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    !isLoggedIn
                      ? 'pointer-events-none opacity-40 text-muted-foreground'
                      : isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className='h-5 w-5' />
                  <span className='sr-only'>{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side='right'>{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
    </TooltipProvider>
  );
}
