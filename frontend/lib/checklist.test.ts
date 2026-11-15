import { describe, expect, it } from 'vitest';
import {
  applyChecklistChange,
  getChecklistProgress,
  getEditedText,
  getNewItemText,
  insertChecklistItem,
  MAX_CHECKLIST_ITEM_LENGTH,
} from './checklist';
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

describe('applyChecklistChange', () => {
  it('should change only the matching item', () => {
    const items = [buildChecklistItem({ id: 1 }), buildChecklistItem({ id: 2, text: 'Renew passport' })];

    const result = applyChecklistChange(items, 2, { is_done: true });

    expect(result.map((item) => item.is_done)).toEqual([false, true]);
    expect(result[1].text).toBe('Renew passport');
  });

  it('should not mutate the original list', () => {
    const items = [buildChecklistItem({ id: 1 })];

    applyChecklistChange(items, 1, { text: 'Changed' });

    expect(items[0].text).toBe('Buy travel insurance');
  });
});

describe('getEditedText', () => {
  it('should return the trimmed new text when it changed', () => {
    expect(getEditedText('Renew pasport', '  Renew passport ')).toBe('Renew passport');
  });

  it('should return null when the text is unchanged so nothing is saved', () => {
    expect(getEditedText('Renew passport', 'Renew passport ')).toBeNull();
  });

  it('should return null when the text was cleared so the edit is cancelled', () => {
    expect(getEditedText('Renew passport', '   ')).toBeNull();
  });
});

describe('insertChecklistItem', () => {
  it('should put a removed item back in its original place', () => {
    const items = [buildChecklistItem({ id: 1, position: 0 }), buildChecklistItem({ id: 3, position: 2 })];

    const result = insertChecklistItem(items, buildChecklistItem({ id: 2, position: 1 }));

    expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it('should put an item with the highest position at the bottom', () => {
    const items = [buildChecklistItem({ id: 1, position: 0 })];

    const result = insertChecklistItem(items, buildChecklistItem({ id: 2, position: 5 }));

    expect(result.map((item) => item.id)).toEqual([1, 2]);
  });

  it('should not add the item twice if it is already in the list', () => {
    const items = [buildChecklistItem({ id: 1, position: 0 })];

    expect(insertChecklistItem(items, buildChecklistItem({ id: 1, position: 0 }))).toHaveLength(1);
  });
});
