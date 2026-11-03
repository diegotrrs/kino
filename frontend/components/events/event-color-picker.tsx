'use client';
import {
  EVENT_COLORS,
  isPaletteColor
}                          from '@/lib/event-colors';
import { cn }              from '@/lib/utils';
import { Check }           from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState }        from 'react';
import { HexColorPicker }  from 'react-colorful';

type EventColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
};

export const EventColorPicker = ({ color, onChange }: EventColorPickerProps) => {
  const t = useTranslations('eventColors');
  const [isCustomOpen, setIsCustomOpen] = useState(() => !isPaletteColor(color));

  return (
    <div className='grid gap-3'>
      <div role='radiogroup' aria-label={t('palette')} className='flex gap-2'>
        {EVENT_COLORS.map(({ name, hex }) => {
          const isSelected = color.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={name}
              type='button'
              role='radio'
              aria-checked={isSelected}
              aria-label={t(name)}
              title={t(name)}
              onClick={() => onChange(hex)}
              className='flex h-7 w-7 items-center justify-center rounded-md ring-offset-2 ring-offset-popover transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              style={{ backgroundColor: hex }}
            >
              {isSelected && <Check className='h-4 w-4 text-white' />}
            </button>
          );
        })}
        <button
          type='button'
          aria-pressed={isCustomOpen}
          onClick={() => setIsCustomOpen((open) => !open)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors hover:bg-accent',
            !isPaletteColor(color) && 'border-foreground',
          )}
        >
          <span className='h-3 w-3 rounded-full border border-border/50' style={{ backgroundColor: color }} />
          {t('custom')}
        </button>
      </div>
      {isCustomOpen && <HexColorPicker color={color} onChange={onChange} />}
    </div>
  );
};
