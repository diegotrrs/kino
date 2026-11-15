import { describe, expect, it } from 'vitest';
import {
  applyChecklistChange,
  getChecklistProgress,
  getEditedText,
  getNewItemText,
  insertChecklistItem,
  MAX_CHECKLIST_ITEM_LENGTH,
  moveChecklistItem,
  restoreChecklistOrder,
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

describe('moveChecklistItem', () => {
  const items = [
    buildChecklistItem({ id: 1, position: 0, is_done: true }),
    buildChecklistItem({ id: 2, position: 1 }),
    buildChecklistItem({ id: 3, position: 2 }),
  ];

  it('should move an item down to where it was dropped and renumber positions', () => {
    const result = moveChecklistItem(items, 1, 3);

    expect(result.map((item) => [item.id, item.position])).toEqual([[2, 0], [3, 1], [1, 2]]);
  });

  it('should move an item up to where it was dropped', () => {
    expect(moveChecklistItem(items, 3, 1).map((item) => item.id)).toEqual([3, 1, 2]);
  });

  it('should keep each item done state when it moves', () => {
    expect(moveChecklistItem(items, 1, 3).find((item) => item.id === 1)?.is_done).toBe(true);
  });

  it('should return the same list when an item is dropped on itself or outside the list', () => {
    expect(moveChecklistItem(items, 2, 2)).toBe(items);
    expect(moveChecklistItem(items, 2, 99)).toBe(items);
  });
});

describe('restoreChecklistOrder', () => {
  it('should put items back in an earlier order and keep their latest values', () => {
    const current = [
      buildChecklistItem({ id: 3, position: 0 }),
      buildChecklistItem({ id: 1, position: 1, is_done: true }),
      buildChecklistItem({ id: 2, position: 2 }),
    ];

    const result = restoreChecklistOrder(current, [1, 2, 3]);

    expect(result.map((item) => [item.id, item.position])).toEqual([[1, 0], [2, 1], [3, 2]]);
    expect(result[0].is_done).toBe(true);
  });

  it('should keep items added since then at the bottom', () => {
    const current = [buildChecklistItem({ id: 2 }), buildChecklistItem({ id: 9 }), buildChecklistItem({ id: 1 })];

    expect(restoreChecklistOrder(current, [1, 2]).map((item) => item.id)).toEqual([1, 2, 9]);
  });
});
