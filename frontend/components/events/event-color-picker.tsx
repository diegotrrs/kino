'use client';
import {
  EVENT_COLORS,
  isPaletteColor
}                          from '@/lib/event-colors';
import { cn }              from '@/lib/utils';
import {
  Check,
  Plus
}                          from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState }        from 'react';
import { HexColorPicker }  from 'react-colorful';

const RAINBOW = 'conic-gradient(#e85d5d, #e8c35d, #6fd18a, #5db7e8, #a77de8, #e85d5d)';

type EventColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
  // Custom colours the calendar's other events use (getRecentColors); the row is hidden when empty
  recentColors?: string[];
};

export const EventColorPicker = ({ color, onChange, recentColors = [] }: EventColorPickerProps) => {
  const t = useTranslations('eventColors');
  // Closed by default, even for a custom colour: the Custom swatch or the Recent row already shows it
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const isRecent = recentColors.some((hex) => hex.toLowerCase() === color.toLowerCase());
  const isCustomPicked = !isPaletteColor(color) && !isRecent;

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
        {/* A rainbow-framed "+" swatch. It only looks selected for a colour that has no swatch of its own (just picked) */}
        <button
          type='button'
          aria-expanded={isCustomOpen}
          aria-label={t('custom')}
          title={t('custom')}
          onClick={() => setIsCustomOpen((open) => !open)}
          className={cn(
            'h-7 w-7 rounded-md p-0.5 ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isCustomOpen && 'ring-2 ring-foreground',
          )}
          style={{ background: RAINBOW }}
        >
          <span
            className='flex h-full w-full items-center justify-center rounded-[0.3rem] bg-background text-foreground'
            style={isCustomPicked ? { backgroundColor: color } : undefined}
          >
            {isCustomPicked
              ? <Check className='h-4 w-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]' />
              : <Plus className='h-4 w-4' />}
          </span>
        </button>
      </div>
      {recentColors.length > 0 && (
        // Stays right under the palette, so opening Custom below never moves it
        <div className='flex items-center gap-3'>
          <span id='recent-colours-label' className='shrink-0 font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
            {t('recent')}
          </span>
          <div role='radiogroup' aria-labelledby='recent-colours-label' className='flex flex-wrap gap-2'>
            {recentColors.map((hex) => {
              const isSelected = color.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type='button'
                  role='radio'
                  aria-checked={isSelected}
                  aria-label={hex}
                  title={hex}
                  onClick={() => onChange(hex)}
                  className='flex h-6 w-6 items-center justify-center rounded ring-offset-2 ring-offset-popover transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  style={{ backgroundColor: hex }}
                >
                  {isSelected && <Check className='h-3.5 w-3.5 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]' />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {isCustomOpen && <HexColorPicker color={color} onChange={onChange} />}
    </div>
  );
};
