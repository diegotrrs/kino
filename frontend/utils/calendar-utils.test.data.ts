import { vi }               from 'vitest';
import type { calendarRef } from './data';

type MockCalendarApi = {
  prev: ReturnType<typeof vi.fn>;
  next: ReturnType<typeof vi.fn>;
  gotoDate: ReturnType<typeof vi.fn>;
  changeView: ReturnType<typeof vi.fn>;
};

type MockCalendarRef = {
  ref: calendarRef;
  api: MockCalendarApi;
};

export const buildMockCalendarRef = (): MockCalendarRef => {
  const api: MockCalendarApi = {
    prev: vi.fn(),
    next: vi.fn(),
    gotoDate: vi.fn(),
    changeView: vi.fn(),
  };

  const ref = {
    current: { getApi: () => api },
  } as unknown as calendarRef;

  return { ref, api };
};

export const buildChangeEvent = (
  value: string,
): React.ChangeEvent<HTMLInputElement> => {
  return { target: { value } } as React.ChangeEvent<HTMLInputElement>;
};
