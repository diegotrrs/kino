'use client';
import { logout }           from '@/app/auth/actions';
import { Button }           from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
}                           from '@/components/ui/dropdown-menu';
import { useToast }              from '@/hooks/use-toast';
import { EllipsisVertical, Moon, Sun } from 'lucide-react';
import Link                      from 'next/link';
import { useTheme }              from 'next-themes';

export function TopBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className='sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4'>
      <span className='text-lg font-bold tracking-tight select-none'>Kino</span>

      <div className='flex items-center gap-2'>
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label='Toggle theme'
          >
            {resolvedTheme === 'dark' ? (
              <Sun className='h-4 w-4' />
            ) : (
              <Moon className='h-4 w-4' />
            )}
          </Button>
        )}

        {process.env.NODE_ENV === 'development' && (
          <span className='rounded bg-black px-1.5 py-0.5 font-mono text-[0.6rem] text-white dark:bg-white dark:text-black'>
            <span className='sm:hidden'>xs</span>
            <span className='hidden sm:inline md:hidden'>sm</span>
            <span className='hidden md:inline lg:hidden'>md</span>
            <span className='hidden lg:inline xl:hidden'>lg</span>
            <span className='hidden xl:inline 2xl:hidden'>xl</span>
            <span className='hidden 2xl:inline'>2xl</span>
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <EllipsisVertical className='h-5 w-5' />
              <span className='sr-only'>Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onSelect={() => toast({ title: 'Profile clicked' })}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/settings'>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/about'>About</Link>
            </DropdownMenuItem>
            {isLoggedIn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  Log out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
