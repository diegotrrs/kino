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
