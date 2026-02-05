export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateEventInput {
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
}
