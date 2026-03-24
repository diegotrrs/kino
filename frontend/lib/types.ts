export interface Calendar {
  id: number;
  uuid: string;
  name: string;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  is_favourite: boolean;
}

export interface Event {
  id: number;
  uuid: string;
  calendar_id: number;
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
