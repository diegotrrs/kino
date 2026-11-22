'use client';
import {
  addChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  updateChecklistItem
}                            from '@/app/(app)/calendars/actions';
import { Input }             from '@/components/ui/input';
import {
  Announcements,
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
}                            from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
}                            from '@dnd-kit/sortable';
import { CSS }               from '@dnd-kit/utilities';
import { useEvents }         from '@/context/events-context';
import { useToast }          from '@/hooks/use-toast';
import { track } from '@/lib/analytics/events';
import { revealWhenKeyboardOpens } from '@/lib/keyboard';
import {
  applyChecklistChange,
  ChecklistChange,
  getChecklistProgress,
  getEditedText,
  getNewItemText,
  insertChecklistItem,
  MAX_CHECKLIST_ITEM_LENGTH,
  moveChecklistItem,
  restoreChecklistOrder
}                            from '@/lib/checklist';
import type { ChecklistItem } from '@/lib/types';
import { cn }                from '@/lib/utils';
import {
  ChevronRight,
  GripVertical,
  ListChecks,
  Trash2,
  X
}                            from 'lucide-react';
import { useTranslations }   from 'next-intl';
import {
  KeyboardEvent,
  useEffect,
  useId,
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
      if (change.is_done === true) {
        track('checklist_item_completed');
      }
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
      // Esc cancels the edit only; it must not also close the phone drawer
      event.stopPropagation();
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
      className='-m-1 shrink-0 rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 pointer-coarse:-m-[15px] pointer-coarse:p-[15px] pointer-coarse:opacity-100'
    >
      <Trash2 className='h-3.5 w-3.5' />
    </button>
  );
};

type ChecklistRowProps = {
  item: ChecklistItem;
  // Off while any item is still saving: the server needs every item's real id to reorder
  canReorder: boolean;
};

const ChecklistRow = ({ item, canReorder }: ChecklistRowProps) => {
  const t = useTranslations('checklist');
  const saveChange = useChecklistChange();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !canReorder, attributes: { roleDescription: t('reorderable') } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        // Touch screens: 44px rows, so each row's tap targets fit inside it instead of overlapping the next row's
        'group relative flex items-start gap-2.5 bg-card py-1.5 text-sm pointer-coarse:min-h-11 pointer-coarse:items-center pointer-coarse:py-0',
        isDragging && 'z-10 rounded-sm shadow-md',
      )}
      data-testid='checklist-item'
    >
      {/* Only the handle starts a drag, so taps on the text and checkbox behave as usual; touch-none stops
          the page scrolling instead of dragging on touch screens */}
      <button
        type='button'
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t('reorderItem', { text: item.text })}
        className='-m-1 -mr-2 flex shrink-0 cursor-grab touch-none items-center rounded-sm p-1 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:cursor-grabbing disabled:cursor-default disabled:opacity-40 pointer-coarse:my-0 pointer-coarse:-ml-4 pointer-coarse:self-stretch pointer-coarse:py-0 pointer-coarse:pl-4'
      >
        <GripVertical className='h-3.5 w-3.5' />
      </button>
      {/* The padding widens the tap target to 44px on touch screens without moving the box */}
      <label className='-m-1 flex shrink-0 cursor-pointer p-1 pointer-coarse:-m-3.5 pointer-coarse:p-3.5'>
        <input
          type='checkbox'
          checked={item.is_done}
          disabled={isPending(item)}
          onChange={(event) => void saveChange(item, { is_done: event.target.checked })}
          aria-label={t('markDone', { text: item.text })}
          className='mt-0.5 h-4 w-4 cursor-pointer accent-teal disabled:cursor-default pointer-coarse:mt-0'
        />
      </label>
      <div className='min-w-0 flex-1'>
        <ChecklistItemText item={item} />
      </div>
      {!isPending(item) && <ChecklistDeleteButton item={item} />}
    </li>
  );
};

type ChecklistAddFieldProps = {
  // Phones: focus the field when the drawer opens on an empty list, and keep it above the keyboard
  isInDrawer?: boolean;
};

const ChecklistAddField = ({ isInDrawer = false }: ChecklistAddFieldProps) => {
  const { calendarUuid, checklist, checklistOpen, setChecklist } = useEvents();
  const t = useTranslations('checklist');
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isEmpty = (checklist ?? []).length === 0;

  useEffect(() => {
    if (isInDrawer && checklistOpen && isEmpty) {
      inputRef.current?.focus();
    }
    // Only when the drawer opens, not every time the list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInDrawer, checklistOpen]);

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
      track('checklist_item_added');
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
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        if (isInDrawer) {
          revealWhenKeyboardOpens(event.currentTarget);
        }
      }}
      maxLength={MAX_CHECKLIST_ITEM_LENGTH}
      placeholder={t('addPlaceholder')}
      aria-label={t('addLabel')}
      className='h-9 text-sm'
    />
  );
};

const SortableChecklist = ({ items }: { items: ChecklistItem[] }) => {
  const { calendarUuid, setChecklist } = useEvents();
  const t = useTranslations('checklist');
  const { toast } = useToast();
  // A fixed id keeps dnd-kit's screen reader ids the same on the server and the client
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const canReorder = !items.some(isPending);

  const getText = (id: string | number): string => items.find((item) => item.id === id)?.text ?? '';
  const getPosition = (id: string | number): number => items.findIndex((item) => item.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('announcePickedUp', { text: getText(active.id) }),
    onDragOver: ({ active, over }) =>
      over ? t('announceMoved', { text: getText(active.id), position: getPosition(over.id), total: items.length }) : undefined,
    onDragEnd: ({ active, over }) =>
      over ? t('announceDropped', { text: getText(active.id), position: getPosition(over.id), total: items.length }) : undefined,
    onDragCancel: ({ active }) => t('announceCancelled', { text: getText(active.id) }),
  };

  const handleDragEnd = async ({ active, over, activatorEvent }: DragEndEvent): Promise<void> => {
    if (!over || !calendarUuid) {
      return;
    }
    const reordered = moveChecklistItem(items, Number(active.id), Number(over.id));
    if (reordered === items) {
      return;
    }
    const previousIds = items.map((item) => item.id);
    setChecklist(reordered);
    try {
      await reorderChecklistItems(calendarUuid, reordered.map((item) => item.id));
      // dnd-kit starts a keyboard move from a keydown, and a drag from a pointer or touch
      track('checklist_reordered', { via: activatorEvent.type === 'keydown' ? 'keyboard' : 'drag' });
    } catch {
      setChecklist((current) => restoreChecklistOrder(current ?? [], previousIds));
      toast({ variant: 'destructive', title: t('reorderFailed') });
    }
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => void handleDragEnd(event)}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t('reorderInstructions') } }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label={t('title')}>
          {items.map((item) => (
            <ChecklistRow key={item.id} item={item} canReorder={canReorder} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export const ChecklistList = ({ isInDrawer = false }: ChecklistAddFieldProps) => {
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
        <SortableChecklist items={checklist} />
      )}
      <ChecklistAddField isInDrawer={isInDrawer} />
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

// Phones and tablets: a chip on the trip line, next to the expenses chip
export const ChecklistChip = () => {
  const { checklist, setChecklistOpen } = useEvents();
  const t = useTranslations('checklist');
  if (checklist === null) {
    return null;
  }
  const { done, total } = getChecklistProgress(checklist);

  return (
    <button
      type='button'
      aria-label={t('openChecklist')}
      data-testid='checklist-chip'
      onClick={() => setChecklistOpen(true)}
      className='inline-flex h-7 items-center gap-1.5 rounded-md bg-secondary px-2 align-middle font-mono text-[0.7rem] font-medium uppercase tracking-wider text-foreground tabular-nums transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <ListChecks className='h-3.5 w-3.5 shrink-0' />
      {total > 0 ? `${done}/${total}` : t('title')}
      <ChevronRight className='h-3.5 w-3.5 shrink-0' />
    </button>
  );
};

export const ChecklistDrawer = () => {
  const { checklist, checklistOpen: isOpen, setChecklistOpen } = useEvents();
  const t = useTranslations('checklist');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      // defaultPrevented: Esc already cancelled a keyboard drag, so the drawer stays open
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setChecklistOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setChecklistOpen]);

  if (checklist === null) {
    return null;
  }
  const { done, total } = getChecklistProgress(checklist);

  return (
    <div className='lg:hidden'>
      {isOpen && (
        <div className='fixed inset-0 z-40 bg-black/50' aria-hidden='true' onClick={() => setChecklistOpen(false)} />
      )}
      <div
        role='dialog'
        aria-label={t('title')}
        aria-modal='true'
        data-testid='checklist-drawer'
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-2xl border-t bg-card shadow-xl duration-300',
          // Shown at once on open (so the add field can take focus); hidden only after the slide out on close,
          // which keeps a closed drawer away from screen readers and Tab
          isOpen ? 'visible translate-y-0 transition-transform' : 'invisible translate-y-full transition-[transform,visibility]',
        )}
      >
        <span aria-hidden='true' className='mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border' />
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <div className='flex items-center gap-2'>
            <ListChecks className='h-4 w-4 text-muted-foreground' />
            <span className='font-display text-base font-bold'>{t('title')}</span>
            {total > 0 && (
              <span className='font-mono text-xs text-muted-foreground tabular-nums'>{done} / {total}</span>
            )}
          </div>
          <button
            type='button'
            aria-label={t('closeChecklist')}
            onClick={() => setChecklistOpen(false)}
            className='-m-2 p-2 text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto px-4 py-3'>
          <ChecklistList isInDrawer />
        </div>
      </div>
    </div>
  );
};
