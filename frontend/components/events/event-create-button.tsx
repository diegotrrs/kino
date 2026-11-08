'use client';
import { EventForm }       from '@/components/event-form';
import { Button }          from '@/components/ui/button';
import {
  EventsProvider,
  useEvents
}                          from '@/context/events-context';
import type { Calendar }   from '@/lib/types';
import { useTranslations } from 'next-intl';
import { useRouter }       from 'next/navigation';
import { useState }        from 'react';

type EventCreateButtonProps = {
  calendars: Pick<Calendar, 'id' | 'name'>[];
  preferredCurrency: string;
};

const OpenButton = () => {
  const { setEventAddOpen } = useEvents();
  const t = useTranslations('eventDialog');

  return (
    <Button onClick={() => setEventAddOpen(true)}>
      {t('newEvent')}
    </Button>
  );
};

// The Events page lists events from every calendar, so the dialog asks which calendar the new event belongs to
export const EventCreateButton = ({ calendars, preferredCurrency }: EventCreateButtonProps) => {
  const router = useRouter();
  const [today] = useState(() => new Date());

  return (
    <EventsProvider serverEvents={[]} preferredCurrency={preferredCurrency}>
      <OpenButton />
      <EventForm mode='add' start={today} end={today} calendars={calendars} onSaved={() => router.refresh()} />
    </EventsProvider>
  );
};
