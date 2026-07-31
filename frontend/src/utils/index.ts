import type { CafeBranch, CrowdLevel, DietType } from '../types';

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

/** "HH:MM" on today's date, as minutes past midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `Today, ${formatClock(iso)}`;
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${formatClock(iso)}`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${formatClock(iso)}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return '1 hour ago';
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** Minutes elapsed since an ISO timestamp, floored at zero. */
export function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function isBranchOpen(branch: CafeBranch, now = new Date()): boolean {
  if (!branch.isOpen) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(branch.opensAt);
  const close = toMinutes(branch.closesAt);
  // Counters that run past midnight wrap around.
  return close > open ? mins >= open && mins < close : mins >= open || mins < close;
}

/** Minutes until the branch shuts, or null when already closed. */
export function minutesUntilClose(branch: CafeBranch, now = new Date()): number | null {
  if (!isBranchOpen(branch, now)) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  const close = toMinutes(branch.closesAt);
  return close > mins ? close - mins : close + 1440 - mins;
}

export function crowdLevel(activeOrders: number): CrowdLevel {
  if (activeOrders < 6) return 'low';
  if (activeOrders <= 15) return 'moderate';
  return 'busy';
}

export const CROWD_COPY: Record<CrowdLevel, { label: string; hint: string }> = {
  low: { label: 'Not busy', hint: 'Walk up any time' },
  moderate: { label: 'Filling up', hint: 'Short queue at the counter' },
  busy: { label: 'Busy', hint: 'Order ahead to skip the queue' },
};

/**
 * Wait estimate students actually see. Base prep for the branch plus two
 * minutes per order already in the queue — the same arithmetic the counter
 * panel uses, so both sides quote the same number.
 */
export function waitMinutes(branch: CafeBranch, extraPrep = 0): number {
  return branch.basePrepMinutes + Math.round(branch.activeOrderCount * 1.5) + extraPrep;
}

/** Rounds up to the next 5-minute slot so pickups spread out instead of clumping. */
export function pickupWindow(minutesFromNow: number): { start: Date; end: Date } {
  const start = new Date(Date.now() + minutesFromNow * 60000);
  start.setSeconds(0, 0);
  const rounded = Math.ceil(start.getMinutes() / 5) * 5;
  start.setMinutes(rounded);
  return { start, end: new Date(start.getTime() + 5 * 60000) };
}

export function formatWindow(startIso: string, endIso: string): string {
  return `${formatClock(startIso)} – ${formatClock(endIso)}`;
}

export const DIET_LABEL: Record<DietType, string> = {
  veg: 'Vegetarian',
  egg: 'Contains egg',
  nonveg: 'Non-vegetarian',
};

/** Six-character human-readable code, e.g. "VB-4K2M". */
export function makeGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `VB-${out}`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'VB';
}

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
