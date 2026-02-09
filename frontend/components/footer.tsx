import Link               from 'next/link';
import { DarkModeToggle } from './dark-mode-toggle';
import { Separator }      from './ui/separator';

export default function Footer() {
  return (
    <div className='space-y-4 px-5 pb-5 text-xs md:text-sm'>
      <Separator />
      <div className='flex flex-wrap items-center justify-between'>
        <p className='flex-shrink-0'>
        </p>

        <div className='flex items-center gap-2'>
          {process.env.NODE_ENV === 'development' && (
            <span className='rounded bg-black px-1.5 py-0.5 text-[0.6rem] font-mono text-white dark:bg-white dark:text-black'>
              <span className='sm:hidden'>xs</span>
              <span className='hidden sm:inline md:hidden'>sm</span>
              <span className='hidden md:inline lg:hidden'>md</span>
              <span className='hidden lg:inline xl:hidden'>lg</span>
              <span className='hidden xl:inline 2xl:hidden'>xl</span>
              <span className='hidden 2xl:inline'>2xl</span>
            </span>
          )}
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
