'use client';
import {
  addEventLink,
  deleteEventLink
}                          from '@/app/(app)/events/actions';
import { Button }          from '@/components/ui/button';
import { Input }           from '@/components/ui/input';
import type { EventLink }  from '@/lib/types';
import {
  Link2,
  X
}                          from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState }        from 'react';

type Props = {
  eventId: number;
  initialLinks: EventLink[];
  readOnly?: boolean;
  onLinksChange?: (links: EventLink[]) => void;
};

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max)}…`;

export const EventLinks = ({ eventId, initialLinks, readOnly = false, onLinksChange }: Props) => {
  const tLinks = useTranslations('eventLinks');
  const [links, setLinks] = useState<EventLink[]>(initialLinks);
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const updateLinks = (next: EventLink[]) => {
    setLinks(next);
    onLinksChange?.(next);
  };

  const handleAdd = async () => {
    const url = inputValue.trim();
    if (!url) return;
    setIsAdding(true);
    try {
      const newLink = await addEventLink(eventId, url);
      updateLinks([...links, newLink]);
      setInputValue('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (linkId: number) => {
    await deleteEventLink(eventId, linkId);
    updateLinks(links.filter((l) => l.id !== linkId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className='space-y-2'>
      <p className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>{tLinks('title')}</p>

      {links.length > 0 && (
        <ul className='space-y-1'>
          {links.map((link) => (
            <li key={link.id} className='flex items-center gap-1'>
              <a
                href={link.url}
                target='_blank'
                rel='noreferrer'
                aria-label='Open link'
                data-testid='event-link'
                className='flex items-center gap-1.5 flex-1 min-w-0 text-sm text-primary hover:underline'
              >
                <Link2 className='h-3.5 w-3.5 shrink-0' />
                <span className='truncate'>
                  {truncate(link.url, 30)}
                </span>
              </a>
              {!readOnly && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 shrink-0'
                  aria-label='Delete link'
                  data-testid='delete-link-button'
                  onClick={() => handleDelete(link.id)}
                >
                  <X className='h-3.5 w-3.5' />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className='flex gap-2'>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='https://...'
            className='h-8 text-sm'
            disabled={isAdding}
          />
          <Button
            type='button'
            size='sm'
            data-testid='add-link-button'
            disabled={isAdding || !inputValue.trim()}
            onClick={handleAdd}
          >
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
        </div>
      )}
    </div>
  );
};
