'use client';

import { Separator }    from '@/components/ui/separator';
import { cn }           from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme }     from 'next-themes';
import { useEffect, useState } from 'react';

const options = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              Settings
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              Configure your preferences.
            </p>
          </div>

          <Separator />

          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>Appearance</h3>
            <div className='flex gap-2'>
              {options.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors',
                    mounted && theme === value
                      ? 'border-foreground bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {label}
                </button>
              ))}
            </div>
            <p className='text-xs text-muted-foreground'>
              System uses your device&apos;s appearance setting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
