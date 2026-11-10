// Stored as hex so existing events (which keep any hex colour) and theme colours share one format
export const EVENT_COLORS = [
  { name: 'teal',       hex: '#2F5D62' },
  { name: 'terracotta', hex: '#C8674A' },
  { name: 'ochre',      hex: '#C9973A' },
  { name: 'sage',       hex: '#7E9A7A' },
  { name: 'plum',       hex: '#7D5A7A' },
  { name: 'slate',      hex: '#5B6B7D' },
] as const;

export const DEFAULT_EVENT_COLOR = EVENT_COLORS[0].hex;

export const isPaletteColor = (color: string): boolean =>
  EVENT_COLORS.some((c) => c.hex.toLowerCase() === color.toLowerCase());

// Mixing with the card colour keeps any stored colour readable in both light and dark themes
export const getEventTint = (color: string, amount = 18): string =>
  `color-mix(in srgb, ${color} ${amount}%, hsl(var(--card)))`;

export const getEventEdge = (color: string, amount = 45): string =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

export const MAX_RECENT_COLORS = 6;

// Custom colours the calendar's events already use, newest event first, so a trip's colours are one click away.
// Read from the events themselves, so nothing extra is stored and everyone editing the calendar sees the same list.
export const getRecentColors = (
  events: { id: string; backgroundColor?: string }[],
  limit = MAX_RECENT_COLORS,
): string[] => {
  const seen = new Set<string>();
  const recent: string[] = [];
  // Ids grow as events are created, so a higher id is a newer event
  const newestFirst = [...events].sort((a, b) => Number(b.id) - Number(a.id));
  for (const { backgroundColor } of newestFirst) {
    if (!backgroundColor || isPaletteColor(backgroundColor)) continue;
    const key = backgroundColor.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push(backgroundColor);
    if (recent.length === limit) break;
  }
  return recent;
};
