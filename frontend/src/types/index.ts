/**
 * VITeBites domain models.
 *
 * This is a frontend-only prototype: every model here is populated from local
 * seed data and mutated through the Zustand store. Nothing is fetched.
 */

export type DietType = 'veg' | 'egg' | 'nonveg';

export type CrowdLevel = 'low' | 'moderate' | 'busy';

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'collected' | 'cancelled';

export type ItemPrepState = 'pending' | 'in_prep' | 'done';

export type PaymentMethod = 'upi' | 'card' | 'counter';

export type PaymentState = 'paid' | 'pay_at_counter';

export type StaffMode = 'counter' | 'kitchen';

export type Role = 'student' | 'staff';

/** A cafe brand. Some brands run more than one branch on campus. */
export interface Cafe {
  id: string;
  name: string;
  tagline: string;
  brandColor: string;
  /** Short editorial blurb used on cards and the landing drawer. */
  description: string;
  cuisine: string[];
}

/** A physically distinct counter students actually walk up to. */
export interface CafeBranch {
  id: string;
  cafeId: string;
  /** Display name including the branch, e.g. "Mayuri's — AB-1". */
  name: string;
  shortName: string;
  location: string;
  /** 24h "HH:MM". */
  opensAt: string;
  closesAt: string;
  rating: number;
  ratingCount: number;
  /** Baseline prep minutes before queue load is added. */
  basePrepMinutes: number;
  /** Seeded live queue depth; drives crowd level and wait estimates. */
  activeOrderCount: number;
  isOpen: boolean;
  description: string;
  /** Pickup landmark shown on the tracking screen. */
  pickupPoint: string;
}

export interface MenuCategory {
  id: string;
  branchId: string;
  name: string;
  order: number;
}

/** A selectable size for an item, e.g. Half/Full or Small/Large. */
export interface MenuVariant {
  id: string;
  label: string;
  price: number;
  /** Piece count where the menu board states one. */
  pieces?: number;
}

export interface MenuItem {
  id: string;
  branchId: string;
  categoryId: string;
  name: string;
  description: string;
  diet: DietType;
  /** Lowest price across variants — used for sorting and filters. */
  basePrice: number;
  variants: MenuVariant[];
  available: boolean;
  bestseller: boolean;
  recommended: boolean;
  prepMinutes: number;
  likes: number;
  dislikes: number;
  /** Transcription from the physical board was ambiguous; staff should confirm. */
  needsVerification?: boolean;
}

export interface CartItem {
  /** Stable line key: itemId + variantId + note hash. */
  lineId: string;
  itemId: string;
  branchId: string;
  name: string;
  variantId: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  diet: DietType;
  note?: string;
  /** Person this line belongs to inside a group order. */
  participantName?: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  diet: DietType;
  note?: string;
  prepState: ItemPrepState;
  participantName?: string;
}

export interface Order {
  id: string;
  token: string;
  branchId: string;
  studentName: string;
  phone: string;
  pickupLocation: string;
  items: OrderItem[];
  status: OrderStatus;
  /** ISO timestamps. */
  placedAt: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  subtotal: number;
  discount: number;
  discountLabel?: string;
  taxes: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentState: PaymentState;
  note?: string;
  cutlery: boolean;
  isGroupOrder: boolean;
  groupId?: string;
  /** Student tapped "I'm heading over" — staff prioritise prep. */
  headingOver: boolean;
  reviewed: boolean;
  cancelReason?: string;
}

export interface Review {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  branchId: string;
  liked: boolean;
  comment?: string;
  createdAt: string;
}

export type NotificationType =
  | 'order_update'
  | 'ready'
  | 'discount'
  | 'group_invite'
  | 'review_reminder'
  | 'cafe_closed'
  | 'new_item';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** In-app route to open when tapped. */
  link?: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  registrationNumber: string;
  phone: string;
  dietPreference: DietType | 'any';
  spicePreference: 'mild' | 'medium' | 'hot';
  defaultPickupLocation: string;
  notifyOrderUpdates: boolean;
  notifyDiscounts: boolean;
  reduceMotion: boolean;
  largeText: boolean;
}

export interface VendorProfile {
  name: string;
  email: string;
  branchId: string;
  mode: StaffMode;
}

export interface GroupParticipant {
  id: string;
  name: string;
  /** Two-letter monogram used instead of photo avatars. */
  initials: string;
  isCreator: boolean;
  joinedAt: string;
}

export interface GroupOrder {
  id: string;
  code: string;
  branchId: string;
  participants: GroupParticipant[];
  items: CartItem[];
  /** ISO timestamp the window shuts. */
  expiresAt: string;
  locked: boolean;
  submittedOrderId?: string;
  payerName: string;
}

export interface Discount {
  id: string;
  branchId: string;
  itemId: string;
  itemName: string;
  percent: number;
  startedAt: string;
  endsAt: string;
  active: boolean;
}

/** Persisted favourites. */
export interface Favorites {
  items: string[];
  branches: string[];
}
