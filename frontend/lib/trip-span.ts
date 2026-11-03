export type TripSpan = {
  start: string;
  end: string;
  totalDays: number;
  currentDay: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtcDay = (isoDate: string): number => Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`);

const getDaysBetween = (from: string, to: string): number => Math.round((toUtcDay(to) - toUtcDay(from)) / DAY_MS);

export const getTripSpan = (startDate: string, eventDates: string[], today: string): TripSpan => {
  const start = startDate.slice(0, 10);
  const end = eventDates
    .map((d) => d.slice(0, 10))
    .reduce((latest, d) => (d > latest ? d : latest), start);
  const totalDays = getDaysBetween(start, end) + 1;
  const offset = getDaysBetween(start, today);
  const currentDay = offset >= 0 && offset < totalDays ? offset + 1 : null;

  return { start, end, totalDays, currentDay };
};
