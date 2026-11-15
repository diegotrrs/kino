import { describe, expect, it } from 'vitest';
import { getChecklistProgress, getNewItemText, MAX_CHECKLIST_ITEM_LENGTH } from './checklist';
import { buildChecklistItem } from './checklist.test.data';

describe('getChecklistProgress', () => {
  it('should report zero of zero for an empty checklist', () => {
    expect(getChecklistProgress([])).toEqual({ done: 0, total: 0 });
  });

  it('should count only ticked items as done', () => {
    const items = [
      buildChecklistItem({ id: 1, is_done: true }),
      buildChecklistItem({ id: 2, is_done: false }),
      buildChecklistItem({ id: 3, is_done: true }),
    ];

    expect(getChecklistProgress(items)).toEqual({ done: 2, total: 3 });
  });
});

describe('getNewItemText', () => {
  it('should trim the text typed into the add field', () => {
    expect(getNewItemText('  Buy travel insurance  ')).toBe('Buy travel insurance');
  });

  it('should return null for whitespace-only text so nothing is added', () => {
    expect(getNewItemText('   ')).toBeNull();
  });

  it('should cut text longer than the maximum length', () => {
    expect(getNewItemText('x'.repeat(MAX_CHECKLIST_ITEM_LENGTH + 5))).toHaveLength(MAX_CHECKLIST_ITEM_LENGTH);
  });
});
