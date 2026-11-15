'use client';
import { addChecklistItem }  from '@/app/(app)/calendars/actions';
import { Input }             from '@/components/ui/input';
import { useEvents }         from '@/context/events-context';
import { useToast }          from '@/hooks/use-toast';
import {
  getChecklistProgress,
  getNewItemText,
  MAX_CHECKLIST_ITEM_LENGTH
}                            from '@/lib/checklist';
import type { ChecklistItem } from '@/lib/types';
import { cn }                from '@/lib/utils';
import { ListChecks }        from 'lucide-react';
import { useTranslations }   from 'next-intl';
import {
  KeyboardEvent,
  useState
}                            from 'react';

// Temporary ids for items that haven't come back from the server yet
let nextPendingId = -1;

const ChecklistRow = ({ item }: { item: ChecklistItem }) => (
  <li className='flex items-start gap-2.5 py-1.5 text-sm' data-testid='checklist-item'>
    <span
      aria-hidden='true'
      className={cn(
        'mt-0.5 h-4 w-4 shrink-0 rounded-sm border',
        item.is_done && 'border-teal bg-teal',
      )}
    />
    <span className={cn('min-w-0 break-words', item.is_done && 'text-muted-foreground line-through')}>
      {item.text}
    </span>
  </li>
);

const ChecklistAddField = () => {
  const { calendarUuid, setChecklist } = useEvents();
  const t = useTranslations('checklist');
  const { toast } = useToast();
  const [value, setValue] = useState('');

  const handleAdd = async (): Promise<void> => {
    const text = getNewItemText(value);
    if (!text || !calendarUuid) {
      return;
    }
    const pendingItem: ChecklistItem = {
      id: nextPendingId--,
      text,
      is_done: false,
      position: Number.MAX_SAFE_INTEGER,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    setValue('');
    setChecklist((items) => [...(items ?? []), pendingItem]);
    try {
      const saved = await addChecklistItem(calendarUuid, text);
      setChecklist((items) => (items ?? []).map((item) => (item.id === pendingItem.id ? saved : item)));
    } catch {
      setChecklist((items) => (items ?? []).filter((item) => item.id !== pendingItem.id));
      toast({ variant: 'destructive', title: t('addFailed') });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleAdd();
    }
  };

  return (
    <Input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      maxLength={MAX_CHECKLIST_ITEM_LENGTH}
      placeholder={t('addPlaceholder')}
      aria-label={t('addLabel')}
      className='h-9 text-sm'
    />
  );
};

export const ChecklistList = () => {
  const { checklist } = useEvents();
  const t = useTranslations('checklist');
  if (checklist === null) {
    return null;
  }

  return (
    <div className='grid gap-2'>
      {checklist.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('empty')}</p>
      ) : (
        <ul aria-label={t('title')}>
          {checklist.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </ul>
      )}
      <ChecklistAddField />
    </div>
  );
};

// Desktop: a card in the trip details rail, under the expenses card
export const ChecklistPanel = () => {
  const { checklist } = useEvents();
  const t = useTranslations('checklist');
  if (checklist === null) {
    return null;
  }
  const { done, total } = getChecklistProgress(checklist);

  return (
    <section
      aria-label={t('title')}
      data-testid='checklist-panel'
      className='grid gap-3 rounded-md border bg-card p-4'
    >
      <span className='flex items-center justify-between font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
        {t('title')}
        <span className='flex items-center gap-1.5 tabular-nums'>
          {total > 0 && <span data-testid='checklist-progress'>{done} / {total}</span>}
          <ListChecks className='h-3.5 w-3.5' />
        </span>
      </span>
      <ChecklistList />
    </section>
  );
};
