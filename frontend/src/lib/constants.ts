import type { OrderStatus } from './types';

/* ============ VENDOR DATA ============ */
export const VENDOR_NAMES = {
  MAYURI_AB: 'Mayuri (AB)',
  MAYURI_SB: 'Mayuri (Special Block)',
  UNDERBELLY: 'UnderBelly (UB)',
  DAKSHIN: 'Dakshin',
  BISTRO: 'Bistro Cafe by Safal',
} as const;

export const VENDOR_LOCATIONS: Record<string, string> = {
  'Mayuri (AB)': 'Academic Block',
  'Mayuri (Special Block)': 'Special Block',
  'UnderBelly (UB)': 'Near AB1',
  'Dakshin': 'Special Block',
  'Bistro Cafe by Safal': 'Special Block',
};

/* ============ ORDER STATUS PIPELINE ============ */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'placed',
  'preparing',
  'ready',
  'completed',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_sync: 'Syncing...',
  placed: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled_soldout: 'Cancelled (Sold Out)',
  cancelled_other: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_sync: '#9A9AB0',
  placed: '#F5A623',
  preparing: '#F59E0B',
  ready: '#22C55E',
  completed: '#0F8A0F',
  cancelled_soldout: '#EF4444',
  cancelled_other: '#EF4444',
};

/* ============ CROWD DENSITY ============ */
export const CROWD_THRESHOLDS = {
  LOW: 5,
  MEDIUM: 15,
} as const;

export type CrowdLevel = 'low' | 'medium' | 'high';

export function getCrowdLevel(activeOrderCount: number): CrowdLevel {
  if (activeOrderCount < CROWD_THRESHOLDS.LOW) return 'low';
  if (activeOrderCount <= CROWD_THRESHOLDS.MEDIUM) return 'medium';
  return 'high';
}

export const CROWD_CONFIG: Record<CrowdLevel, { label: string; emoji: string; color: string; bg: string }> = {
  low: { label: 'Low Crowd', emoji: '🟢', color: '#22C55E', bg: '#F0FFF4' },
  medium: { label: 'Moderate', emoji: '🟡', color: '#F59E0B', bg: '#FFFBEB' },
  high: { label: 'Busy', emoji: '🔴', color: '#EF4444', bg: '#FFF5F5' },
};

/* ============ CATEGORIES ============ */
export const MENU_CATEGORIES = [
  'Tea/Coffee',
  'Mocktails',
  'Shakes',
  'Lassi',
  'Momos/Rolls',
  'Bread Items',
  'Pizza',
  'Combos',
  'Samosa',
  'Chaat',
  'South Indian',
  'Loaded French Fries',
  'Sweets',
  'Sandwiches/Burgers/Wraps',
  'Indian Gravy',
  'Tandoori',
  'Fries',
  'Veg Starters',
  'Non Veg Starters',
  'Egg Varieties',
  'Steam Momos',
  'Soya Chaap',
  'Nachos',
  'Veg Pasta',
  'Non Veg Pasta',
  'Pastry',
  'Birthday Cake',
  'Hot Beverages',
  'Cold Beverages',
  'Fresh Juice',
  'Bakery Items',
  'Chinese',
  'Pizza Varieties',
  'Main Course',
  'Snacks',
  'Beverages',
  'Desserts',
] as const;

/* ============ AUTH ============ */
export const VIT_EMAIL_DOMAIN = '@vitbhopal.ac.in';

// Regex to detect student from email local-part: e.g., "firstname.25bce10599@vitbhopal.ac.in"
export const STUDENT_EMAIL_REGEX = /\.(\d{2})([a-z]{3})(\d{5})@/i;

export function parseStudentEmail(email: string): {
  isStudent: boolean;
  registrationNumber?: string;
  branch?: string;
  batchYear?: string;
} {
  const match = email.match(STUDENT_EMAIL_REGEX);
  if (!match) {
    return { isStudent: false };
  }

  const [, yearDigits, branchCode, seqNumber] = match;
  return {
    isStudent: true,
    registrationNumber: `${yearDigits}${branchCode.toUpperCase()}${seqNumber}`,
    branch: branchCode.toUpperCase(),
    batchYear: `20${yearDigits}`,
  };
}

/* ============ TOKEN GENERATION ============ */
const VENDOR_PREFIXES: Record<string, string> = {
  'Mayuri (AB)': 'MAB',
  'Mayuri (Special Block)': 'MSB',
  'UnderBelly (UB)': 'UB',
  'Dakshin': 'DK',
  'Bistro Cafe by Safal': 'BSF',
};

export function generateTokenNumber(vendorName: string, orderCount: number): string {
  const prefix = VENDOR_PREFIXES[vendorName] || 'VB';
  const num = String(orderCount + 1).padStart(3, '0');
  return `${prefix}-${num}`;
}
