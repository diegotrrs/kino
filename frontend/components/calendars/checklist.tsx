'use client';
import {
  addChecklistItem,
  deleteChecklistItem,
  updateChecklistItem
}                            from '@/app/(app)/calendars/actions';
import { Input }             from '@/components/ui/input';
import { useEvents }         from '@/context/events-context';
import { useToast }          from '@/hooks/use-toast';
import {
  applyChecklistChange,
  ChecklistChange,
  getChecklistProgress,
  getEditedText,
  getNewItemText,
  insertChecklistItem,
  MAX_CHECKLIST_ITEM_LENGTH
}                            from '@/lib/checklist';
import type { ChecklistItem } from '@/lib/types';
import { cn }                from '@/lib/utils';
import {
  ListChecks,
  Trash2
}                            from 'lucide-react';
import { useTranslations }   from 'next-intl';
import {
  KeyboardEvent,
  useRef,
  useState
}                            from 'react';

// Temporary ids for items that haven't come back from the server yet
let nextPendingId = -1;

const isPending = (item: ChecklistItem): boolean => item.id < 0;

// Optimistic change to one item, put back to its previous values if the server refuses it
const useChecklistChange = (): ((item: ChecklistItem, change: ChecklistChange) => Promise<void>) => {
  const { calendarUuid, setChecklist } = useEvents();
  const t = useTranslations('checklist');
  const { toast } = useToast();

  return async (item: ChecklistItem, change: ChecklistChange): Promise<void> => {
    if (!calendarUuid) {
      return;
    }
    const previous: ChecklistChange = { text: item.text, is_done: item.is_done };
    setChecklist((items) => applyChecklistChange(items ?? [], item.id, change));
    try {
      await updateChecklistItem(calendarUuid, item.id, change);
    } catch {
      setChecklist((items) => applyChecklistChange(items ?? [], item.id, previous));
      toast({ variant: 'destructive', title: t('saveFailed') });
    }
  };
};

const ChecklistItemText = ({ item }: { item: ChecklistItem }) => {
  const t = useTranslations('checklist');
  const saveChange = useChecklistChange();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(item.text);
  // Enter/Esc unmount the field, which fires a blur; this stops that blur from saving a second time
  const isClosingRef = useRef(false);

  const handleStartEditing = (): void => {
    isClosingRef.current = false;
    setValue(item.text);
    setIsEditing(true);
  };

  const handleFinish = (shouldSave: boolean): void => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    setIsEditing(false);
    const text = shouldSave ? getEditedText(item.text, value) : null;
    if (text) {
      void saveChange(item, { text });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleFinish(true);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      handleFinish(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => handleFinish(true)}
        maxLength={MAX_CHECKLIST_ITEM_LENGTH}
        aria-label={t('editLabel')}
        className='-my-1 h-7 px-1.5 text-sm'
      />
    );
  }

  return (
    <button
      type='button'
      onClick={handleStartEditing}
      disabled={isPending(item)}
      aria-label={t('editItem', { text: item.text })}
      className={cn(
        'min-w-0 cursor-text break-words rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
        item.is_done && 'text-muted-foreground line-through',
      )}
    >
      {item.text}
    </button>
  );
};

const ChecklistDeleteButton = ({ item }: { item: ChecklistItem }) => {
  const { calendarUuid, setChecklist } = useEvents();
  const t = useTranslations('checklist');
  const { toast } = useToast();

  const handleDelete = async (): Promise<void> => {
    if (!calendarUuid) {
      return;
    }
    setChecklist((items) => (items ?? []).filter((existing) => existing.id !== item.id));
    try {
      await deleteChecklistItem(calendarUuid, item.id);
    } catch {
      setChecklist((items) => insertChecklistItem(items ?? [], item));
      toast({ variant: 'destructive', title: t('deleteFailed') });
    }
  };

  return (
    <button
      type='button'
      onClick={() => void handleDelete()}
      aria-label={t('deleteItem', { text: item.text })}
      className='-m-1 shrink-0 rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 pointer-coarse:-m-3 pointer-coarse:p-3 pointer-coarse:opacity-100'
    >
      <Trash2 className='h-3.5 w-3.5' />
    </button>
  );
};

const ChecklistRow = ({ item }: { item: ChecklistItem }) => {
  const t = useTranslations('checklist');
  const saveChange = useChecklistChange();

  return (
    <li className='group flex items-start gap-2.5 py-1.5 text-sm' data-testid='checklist-item'>
      {/* The padding widens the tap target to 44px on touch screens without moving the box */}
      <label className='-m-1 flex shrink-0 cursor-pointer p-1 pointer-coarse:-m-3.5 pointer-coarse:p-3.5'>
        <input
          type='checkbox'
          checked={item.is_done}
          disabled={isPending(item)}
          onChange={(event) => void saveChange(item, { is_done: event.target.checked })}
          aria-label={t('markDone', { text: item.text })}
          className='mt-0.5 h-4 w-4 cursor-pointer accent-teal disabled:cursor-default'
        />
      </label>
      <div className='min-w-0 flex-1'>
        <ChecklistItemText item={item} />
      </div>
      {!isPending(item) && <ChecklistDeleteButton item={item} />}
    </li>
  );
};

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
