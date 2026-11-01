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
