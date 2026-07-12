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
}
