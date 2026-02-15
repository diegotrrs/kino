'use client';

import { Button }         from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast }         from '@/hooks/use-toast';
import { EllipsisVertical } from 'lucide-react';
import Link                  from 'next/link';

export function TopBar() {
  const { toast } = useToast();

  return (
    <header className='sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4'>
      <span className='text-lg font-bold tracking-tight'>Kino</span>

      <div className='flex items-center gap-2'>
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
            <DropdownMenuItem onSelect={() => toast({ title: 'Notifications clicked' })}>
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast({ title: 'Help clicked' })}>
              Help
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/settings'>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/about'>About</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
