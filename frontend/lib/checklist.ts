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
