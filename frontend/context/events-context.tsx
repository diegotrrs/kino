'use client';
import { toDayNameMap } from '@/lib/day-names';
import type {
  CalendarExpense,
  ChecklistItem,
  DayName
}                       from '@/lib/types';
import {
  CalendarEvent,
  initialEvents
}                       from '@/utils/data';
import React, {
  createContext,
  ReactNode,
  useContext,
  useState
}                       from 'react';

type EventsContextType = {
  calendarId?: number;
  calendarUuid?: string;
  initialDate?: Date;
  readOnly: boolean;
  preferredCurrency: string;
  events: CalendarEvent[];
  addEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  calendarExpenses: CalendarExpense[];
  addCalendarExpense: (expense: CalendarExpense) => void;
  removeCalendarExpense: (id: number) => void;
  eventViewOpen: boolean;
  setEventViewOpen: (value: boolean) => void;
  eventAddOpen: boolean;
  setEventAddOpen: (value: boolean) => void;
  eventEditOpen: boolean;
  setEventEditOpen: (value: boolean) => void;
  eventDeleteOpen: boolean;
  setEventDeleteOpen: (value: boolean) => void;
  availabilityCheckerEventAddOpen: boolean;
  setAvailabilityCheckerEventAddOpen: (value: boolean) => void;
  expensesOpen: boolean;
  setExpensesOpen: (value: boolean) => void;
  // yyyy-MM-dd -> name
  dayNames: Record<string, string>;
  setDayNameLocal: (date: string, name: string | null) => void;
  // null when the viewer is not a member: the checklist is hidden from them
  checklist: ChecklistItem[] | null;
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[] | null>>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

type EventsProviderProps = {
  children: ReactNode;
  calendarId?: number;
  calendarUuid?: string;
  initialDate?: Date;
  serverEvents?: CalendarEvent[];
  serverCalendarExpenses?: CalendarExpense[];
  serverDayNames?: DayName[];
  serverChecklist?: ChecklistItem[] | null;
  readOnly?: boolean;
  preferredCurrency?: string;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({
  children,
  calendarId,
  calendarUuid,
  initialDate,
  serverEvents,
  serverCalendarExpenses,
  serverDayNames,
  serverChecklist = null,
  readOnly = false,
  preferredCurrency = 'GBP',
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>(
    serverEvents ??
      initialEvents.map((event) => ({
        ...event,
        id: String(event.id),
        color: event.backgroundColor,
      }))
  );
  const [calendarExpenses, setCalendarExpenses] = useState<CalendarExpense[]>(
    serverCalendarExpenses ?? []
  );
  const [eventViewOpen, setEventViewOpen]                               = useState(false);
  const [eventAddOpen, setEventAddOpenState]                            = useState(false);
  const [eventEditOpen, setEventEditOpen]                               = useState(false);
  const [expensesOpen, setExpensesOpen]                                 = useState(false);
  const [dayNames, setDayNames] = useState<Record<string, string>>(() => toDayNameMap(serverDayNames ?? []));

  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(serverChecklist);

  const setDayNameLocal = (date: string, name: string | null) => {
    setDayNames((current) => {
      const next = { ...current };
      if (name) {
        next[date] = name;
      } else {
        delete next[date];
      }
      return next;
    });
  };

  const setEventAddOpen = (value: boolean) => {
    if (readOnly && value) return;
    setEventAddOpenState(value);
  };
  const [eventDeleteOpen, setEventDeleteOpen]                           = useState(false);
  const [availabilityCheckerEventAddOpen, setAvailabilityCheckerEventAddOpen] = useState(false);

  const addEvent = (event: CalendarEvent) => {
    setEvents((prevEvents) => [...prevEvents, event]);
  };

  const deleteEvent = (id: string) => {
    setEvents((prevEvents) =>
      prevEvents.filter((event) => Number(event.id) !== Number(id))
    );
  };

  const addCalendarExpense = (expense: CalendarExpense) => {
    setCalendarExpenses((prev) => [...prev, expense]);
  };

  const removeCalendarExpense = (id: number) => {
    setCalendarExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EventsContext.Provider
      value={{
        calendarId,
        calendarUuid,
        initialDate,
        readOnly,
        preferredCurrency,
        events,
        addEvent,
        deleteEvent,
        calendarExpenses,
        addCalendarExpense,
        removeCalendarExpense,
        eventViewOpen,
        setEventViewOpen,
        eventAddOpen,
        setEventAddOpen,
        eventEditOpen,
        setEventEditOpen,
        eventDeleteOpen,
        setEventDeleteOpen,
        expensesOpen,
        setExpensesOpen,
        dayNames,
        setDayNameLocal,
        checklist,
        setChecklist,
        availabilityCheckerEventAddOpen,
        setAvailabilityCheckerEventAddOpen,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};
