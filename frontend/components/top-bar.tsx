'use client';

import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { Button }         from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';

export function TopBar() {
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

        <DarkModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <EllipsisVertical className='h-5 w-5' />
              <span className='sr-only'>Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {/* empty for now */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
