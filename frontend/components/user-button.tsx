'use client';

import { logout }            from '@/app/auth/actions';
import type { CurrentUser }  from '@/components/app-shell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn }                from '@/lib/utils';
import { LogIn, LogOut, User } from 'lucide-react';
import Link                  from 'next/link';
import { useTheme }          from 'next-themes';

interface UserButtonProps {
  user: CurrentUser | null;
}

export function UserButton({ user }: UserButtonProps) {
  const { resolvedTheme } = useTheme();
  const isDark            = resolvedTheme === 'dark';

  const btnClass = cn(
    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
    'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  );

  if (!user) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link href='/login' className={btnClass}>
            <LogIn className='h-5 w-5' />
            <span className='sr-only'>Sign in</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side='right'>Sign in</TooltipContent>
      </Tooltip>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            className={cn(btnClass, 'outline-none')}
          >
            <User className='h-5 w-5' />
            <span className='sr-only'>Account</span>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side='right'>Account</TooltipContent>
      </Tooltip>

      <DropdownMenuContent side='right' align='end' className='w-52 p-2'>
        {/* User info */}
        <div className='flex items-center gap-2.5 px-1 py-1'>
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              isDark
                ? 'bg-white text-black'
                : 'bg-black text-white',
            )}
          >
            {initial}
          </div>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{user.name}</p>
            <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className='cursor-pointer text-sm'
          onSelect={() => logout()}
        >
          <LogOut className='mr-2 h-4 w-4' />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
