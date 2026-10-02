export type Tone = 'success' | 'warning' | 'danger' | 'info';

// Business status -> visual tone, kept in one place so every page agrees.
const TONES: Record<string, Tone> = {
  Active: 'success',
  OK: 'success',
  Normal: 'success',
  Pending: 'warning',
  Warning: 'warning',
  Medium: 'warning',
  Cancelled: 'danger',
  Critical: 'danger',
  High: 'danger',
  Low: 'info',
};
export const toneOf = (status: string): Tone => TONES[status] ?? 'info';
