'use client';
import { track }     from '@/lib/analytics/events';
import { useEffect } from 'react';

type TrackCalendarViewProps = {
  calendarUuid: string;
  role: 'owner' | 'editor' | null;
  isPublic: boolean;
  eventCount: number;
};

// Once per calendar opened: who's looking (a member or a visitor of a public calendar) and how full it is
export const TrackCalendarView = ({ calendarUuid, role, isPublic, eventCount }: TrackCalendarViewProps): null => {
  useEffect(() => {
    track('calendar_viewed', { role: role ?? 'visitor', is_public: isPublic, event_count: eventCount });
    // Only a different calendar counts as a new view, not a refreshed event count
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarUuid]);

  return null;
};
