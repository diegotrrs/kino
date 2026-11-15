import type { ChecklistItem } from '@/lib/types';

export const MAX_CHECKLIST_ITEM_LENGTH = 200;

export const getChecklistProgress = (items: ChecklistItem[]): { done: number; total: number } => ({
  done: items.filter((item) => item.is_done).length,
  total: items.length,
});

export const getNewItemText = (value: string): string | null => {
  const text = value.trim().slice(0, MAX_CHECKLIST_ITEM_LENGTH);
  return text ? text : null;
};

export type ChecklistChange = Partial<Pick<ChecklistItem, 'text' | 'is_done'>>;

export const applyChecklistChange = (
  items: ChecklistItem[],
  id: number,
  change: ChecklistChange,
): ChecklistItem[] => items.map((item) => (item.id === id ? { ...item, ...change } : item));

// An edit saves only real changes; clearing the text cancels the edit rather than deleting the item
export const getEditedText = (original: string, value: string): string | null => {
  const text = getNewItemText(value);
  return text && text !== original ? text : null;
};

// Puts an item back by position, e.g. when a delete is refused by the server
export const insertChecklistItem = (items: ChecklistItem[], item: ChecklistItem): ChecklistItem[] => {
  if (items.some((existing) => existing.id === item.id)) {
    return items;
  }
  const index = items.findIndex((existing) => existing.position > item.position);
  return index === -1 ? [...items, item] : [...items.slice(0, index), item, ...items.slice(index)];
};

// Moves an item to where another one was, renumbering positions 0..n-1 the way the server will
export const moveChecklistItem = (items: ChecklistItem[], activeId: number, overId: number): ChecklistItem[] => {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1 || from === to) {
    return items;
  }
  const withoutMoved = items.filter((item) => item.id !== activeId);
  const reordered = [...withoutMoved.slice(0, to), items[from], ...withoutMoved.slice(to)];
  return reordered.map((item, position) => ({ ...item, position }));
};

// Undoes a refused reorder: earlier order for the items that existed then, anything newer stays at the bottom
export const restoreChecklistOrder = (items: ChecklistItem[], previousIds: number[]): ChecklistItem[] => {
  const getRank = (id: number): number => {
    const index = previousIds.indexOf(id);
    return index === -1 ? previousIds.length : index;
  };
  return [...items]
    .sort((a, b) => getRank(a.id) - getRank(b.id))
    .map((item, position) => ({ ...item, position }));
};
