export interface Calendar {
  id: number;
  uuid: string;
  name: string;
  is_public: boolean;
  created_by: number;
  start_date: string;
  created_at: string;
  updated_at: string | null;
  is_favourite: boolean;
  role?: 'owner' | 'editor';
}

export interface CalendarMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'editor';
}

export type EventLink = {
  id: number;
  event_id: number;
  url: string;
  title: string | null;
  created_at: string;
};

export type EventExpense = {
  id: number;
  event_id: number;
  label: string;
  amount: number;
  currency: string;
  created_at: string;
};

export type CalendarExpense = {
  id: number;
  calendar_id: number;
  label: string;
  amount: number;
  currency: string;
  created_at: string;
};

export interface Event {
  id: number;
  uuid: string;
  calendar_id: number;
  calendar_uuid: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_date: string | null;
  end_time: string | null;
  location: string | null;
  color: string;
  created_at: string;
  updated_at: string | null;
  links: EventLink[];
  expenses: EventExpense[];
  travel_mode: TravelMode | null;
  travel: TravelDetails | null;
  // Any event can have one; null for visitors who aren't members of the calendar
  booking_reference: string | null;
}

export interface CreateEventInput {
  calendar_id: number;
  title: string;
  description?: string | null;
  date: string;
  start_time: string;
  end_date?: string | null;
  end_time?: string | null;
  location?: string | null;
  color?: string;
  travel_mode?: TravelMode | null;
  travel?: Partial<TravelDetails>;
  booking_reference?: string | null;
}

// A name for one day of a calendar, e.g. "Visit to Vatican" (date is yyyy-MM-dd)
export type DayName = {
  date: string;
  name: string;
};

// A shared to-do on a calendar's trip checklist, visible to members only
export type ChecklistItem = {
  id: number;
  text: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string | null;
};

// A flight, a train or a stay (anywhere you sleep: a hotel, hostel, Airbnb...); null is an ordinary event
export type TravelMode = 'flight' | 'train' | 'stay';

export type TravelField =
  | 'origin'
  | 'destination'
  | 'number'
  | 'terminal'
  | 'gate'
  | 'coach'
  | 'seat';

export type TravelDetails = Record<TravelField, string | null>;
