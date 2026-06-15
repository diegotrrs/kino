'use client';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Link2, X } from 'lucide-react';
import { useState } from 'react';

export const addPendingUrl = (urls: string[], url: string): string[] => {
  const trimmed = url.trim();
  if (!trimmed || urls.includes(trimmed)) return urls;
  return [...urls, trimmed];
};

export const removePendingUrl = (urls: string[], url: string): string[] =>
  urls.filter((u) => u !== url);

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max)}…`;

type Props = {
  onChange: (urls: string[]) => void;
};

export const PendingLinks = ({ onChange }: Props) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const update = (next: string[]) => {
    setUrls(next);
    onChange(next);
  };

  const handleAdd = () => {
    const next = addPendingUrl(urls, inputValue);
    if (next === urls) return;
    update(next);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium leading-none'>Links</p>

      {urls.length > 0 && (
        <ul className='space-y-1'>
          {urls.map((url) => (
            <li key={url} className='flex items-center gap-1'>
              <span className='flex items-center gap-1.5 flex-1 min-w-0 text-sm text-primary'>
                <Link2 className='h-3.5 w-3.5 shrink-0' />
                <span className='truncate'>{truncate(url, 30)}</span>
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-6 w-6 shrink-0'
                aria-label='Delete link'
                data-testid='pending-delete-link-button'
                onClick={() => update(removePendingUrl(urls, url))}
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className='flex gap-2'>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='https://...'
          className='h-8 text-sm'
        />
        <Button
          type='button'
          size='sm'
          data-testid='pending-add-link-button'
          disabled={!inputValue.trim()}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>
    </div>
  );
};
