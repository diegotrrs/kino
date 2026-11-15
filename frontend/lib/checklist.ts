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
