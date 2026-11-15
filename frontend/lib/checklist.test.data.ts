import type { ChecklistItem } from '@/lib/types';

export const buildChecklistItem = (overrides: Partial<ChecklistItem> = {}): ChecklistItem => ({
  id: 1,
  text: 'Buy travel insurance',
  is_done: false,
  position: 0,
  created_at: '2026-11-15T10:00:00Z',
  updated_at: null,
  ...overrides,
});
