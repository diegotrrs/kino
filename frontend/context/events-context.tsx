'use client';
import { CalendarEvent, initialEvents } from '@/utils/data';
import React, { createContext, ReactNode, useContext, useState } from 'react';

type EventsContextType = {
  calendarId?: number;
  readOnly: boolean;
  preferredCurrency: string;
  events: CalendarEvent[];
  addEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
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
  serverEvents?: CalendarEvent[];
  readOnly?: boolean;
  preferredCurrency?: string;
}

export const EventsProvider: React.FC<EventsProviderProps> = ({
  children,
  calendarId,
  serverEvents,
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
  const [eventViewOpen, setEventViewOpen]                               = useState(false);
  const [eventAddOpen, setEventAddOpenState]                            = useState(false);
  const [eventEditOpen, setEventEditOpen]                               = useState(false);

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

  return (
    <EventsContext.Provider
      value={{
        calendarId,
        readOnly,
        preferredCurrency,
        events,
        addEvent,
        deleteEvent,
        eventViewOpen,
        setEventViewOpen,
        eventAddOpen,
        setEventAddOpen,
        eventEditOpen,
        setEventEditOpen,
        eventDeleteOpen,
        setEventDeleteOpen,
        availabilityCheckerEventAddOpen,
        setAvailabilityCheckerEventAddOpen,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};
