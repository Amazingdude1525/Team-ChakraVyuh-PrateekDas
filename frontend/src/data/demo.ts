import type { ItemPrepState, Notification, Order, OrderItem, Review } from '../types';
import { SEED_MENU_ITEMS } from './menu';
import { BRANCHES, TOKEN_PREFIX } from './cafes';

/**
 * Demo rows so the counter, kitchen and history screens have something real to
 * show on a cold start. Every timestamp is relative to "now", so the kitchen
 * display's elapsed-time colour escalation is visible immediately.
 */

const STUDENT_NAMES = [
  'Aditya Rao',
  'Sneha Pillai',
  'Karthik Menon',
  'Ishita Banerjee',
  'Rohan Gupta',
  'Meera Suresh',
  'Vikram Nair',
  'Ananya Joshi',
  'Farhan Sheikh',
  'Divya Krishnan',
  'Prateek Das',
];

const PICKUP_POINTS = [
  'AB-1, Ground Floor',
  'AB-2, Second Floor',
  'Hostel Block C',
  'Special Block, Foyer',
  'Library entrance',
];

const NOTES = [
  'Less spicy please',
  'No onion',
  'Extra chutney on the side',
  'Pack it to carry',
  '',
  '',
  '',
];

/** Deterministic-ish picker seeded by index so the demo set is varied but sane. */
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function buildItems(branchId: string, count: number, seed: number): OrderItem[] {
  const pool = SEED_MENU_ITEMS.filter((i) => i.branchId === branchId);
  const items: OrderItem[] = [];
  for (let i = 0; i < count; i++) {
    const item = pool[(seed * 7 + i * 13) % pool.length];
    if (!item) continue;
    const variant = item.variants[(seed + i) % item.variants.length];
    items.push({
      itemId: item.id,
      name: item.name,
      variantLabel: variant.label,
      unitPrice: variant.price,
      quantity: 1 + ((seed + i) % 2),
      diet: item.diet,
      note: i === 0 ? pick(NOTES, seed) || undefined : undefined,
      prepState: 'pending',
    });
  }
  return items;
}

interface DemoSpec {
  branchId: string;
  minutesAgo: number;
  status: Order['status'];
  itemCount: number;
  /** Fraction of items already finished in the kitchen. */
  doneRatio?: number;
  isGroup?: boolean;
  headingOver?: boolean;
  mine?: boolean;
}

/**
 * Spread across all five branches and every status, weighted so the busy
 * counters (Under Belly, Mayuri AB-1) actually look busy.
 */
const SPECS: DemoSpec[] = [
  // --- Under Belly: a full kitchen board, timers from fresh to overdue ---
  { branchId: 'underbelly', minutesAgo: 2, status: 'placed', itemCount: 2 },
  { branchId: 'underbelly', minutesAgo: 4, status: 'placed', itemCount: 1 },
  { branchId: 'underbelly', minutesAgo: 6, status: 'preparing', itemCount: 3, doneRatio: 0.33 },
  { branchId: 'underbelly', minutesAgo: 8, status: 'preparing', itemCount: 2, headingOver: true },
  { branchId: 'underbelly', minutesAgo: 12, status: 'preparing', itemCount: 4, doneRatio: 0.5 },
  { branchId: 'underbelly', minutesAgo: 14, status: 'preparing', itemCount: 2, isGroup: true },
  { branchId: 'underbelly', minutesAgo: 18, status: 'ready', itemCount: 2 },
  { branchId: 'underbelly', minutesAgo: 34, status: 'collected', itemCount: 3 },
  { branchId: 'underbelly', minutesAgo: 52, status: 'collected', itemCount: 1 },

  // --- Mayuri AB-1: high volume, quick turnaround ---
  { branchId: 'mayuri-ab', minutesAgo: 1, status: 'placed', itemCount: 2 },
  { branchId: 'mayuri-ab', minutesAgo: 3, status: 'placed', itemCount: 1 },
  { branchId: 'mayuri-ab', minutesAgo: 5, status: 'preparing', itemCount: 2 },
  { branchId: 'mayuri-ab', minutesAgo: 7, status: 'preparing', itemCount: 3, doneRatio: 0.66 },
  { branchId: 'mayuri-ab', minutesAgo: 11, status: 'preparing', itemCount: 1, headingOver: true },
  { branchId: 'mayuri-ab', minutesAgo: 16, status: 'ready', itemCount: 2 },
  { branchId: 'mayuri-ab', minutesAgo: 40, status: 'collected', itemCount: 2, mine: true },

  // --- The quieter counters ---
  { branchId: 'mayuri-special', minutesAgo: 4, status: 'preparing', itemCount: 2 },
  { branchId: 'mayuri-special', minutesAgo: 26, status: 'collected', itemCount: 1 },
  { branchId: 'dakshin', minutesAgo: 3, status: 'placed', itemCount: 2 },
  { branchId: 'dakshin', minutesAgo: 9, status: 'preparing', itemCount: 3, doneRatio: 0.33 },
  { branchId: 'dakshin', minutesAgo: 21, status: 'ready', itemCount: 2 },
  { branchId: 'dakshin', minutesAgo: 75, status: 'collected', itemCount: 2, mine: true },
  { branchId: 'bistro-safal', minutesAgo: 6, status: 'preparing', itemCount: 2 },
  { branchId: 'bistro-safal', minutesAgo: 13, status: 'preparing', itemCount: 3, doneRatio: 0.33 },
  { branchId: 'bistro-safal', minutesAgo: 95, status: 'collected', itemCount: 2 },

  // --- The signed-in student's own live order, mid-prep ---
  { branchId: 'underbelly', minutesAgo: 5, status: 'preparing', itemCount: 2, mine: true },
];

export function makeDemoOrders(): Order[] {
  const now = Date.now();

  return SPECS.map((spec, index) => {
    const branch = BRANCHES.find((b) => b.id === spec.branchId)!;
    const placedAt = new Date(now - spec.minutesAgo * 60000);
    const items = buildItems(spec.branchId, spec.itemCount, index + 1);

    // Kitchen prep state has to agree with the order status.
    const doneCount =
      spec.status === 'ready' || spec.status === 'collected'
        ? items.length
        : Math.floor(items.length * (spec.doneRatio ?? 0));
    items.forEach((item, i) => {
      item.prepState =
        i < doneCount
          ? 'done'
          : spec.status === 'preparing' && i === doneCount
            ? ('in_prep' as ItemPrepState)
            : 'pending';
    });

    const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const taxes = Math.round(subtotal * 0.05);

    const windowStart = new Date(placedAt.getTime() + (branch.basePrepMinutes + 6) * 60000);

    if (spec.isGroup) {
      const sharers = ['Rohan', 'Meera', 'Aditya'];
      items.forEach((it, i) => {
        it.participantName = sharers[i % sharers.length];
      });
    }

    return {
      id: `demo_${index}`,
      token: `${TOKEN_PREFIX[spec.branchId] ?? 'VB'}-${String(index + 4).padStart(2, '0')}`,
      branchId: spec.branchId,
      studentName: spec.mine ? 'Prateek Das' : pick(STUDENT_NAMES, index),
      phone: spec.mine ? '98765 43210' : '98765 0' + String(1000 + index),
      pickupLocation: pick(PICKUP_POINTS, index),
      items,
      status: spec.status,
      placedAt: placedAt.toISOString(),
      pickupWindowStart: windowStart.toISOString(),
      pickupWindowEnd: new Date(windowStart.getTime() + 5 * 60000).toISOString(),
      subtotal,
      discount: 0,
      taxes,
      total: subtotal + taxes,
      paymentMethod: index % 3 === 0 ? 'counter' : index % 2 === 0 ? 'upi' : 'card',
      paymentState: index % 3 === 0 ? 'pay_at_counter' : 'paid',
      note: undefined,
      cutlery: index % 2 === 0,
      isGroupOrder: spec.isGroup ?? false,
      headingOver: spec.headingOver ?? false,
      reviewed: false,
    } satisfies Order;
  });
}

/** A short review history so the reviews screen isn't empty on first open. */
export function makeDemoReviews(orders: Order[]): Review[] {
  const collected = orders.filter((o) => o.status === 'collected' && o.studentName === 'Prateek Das');
  const reviews: Review[] = [];
  collected.slice(0, 1).forEach((order, oi) => {
    order.items.forEach((item, ii) => {
      reviews.push({
        id: `demo_rev_${oi}_${ii}`,
        orderId: order.id,
        itemId: item.itemId,
        itemName: item.name,
        branchId: order.branchId,
        liked: ii % 3 !== 2,
        comment: ii === 0 ? 'Came out hot and the portion was generous.' : undefined,
        createdAt: new Date(Date.now() - (60 + ii * 5) * 60000).toISOString(),
      });
    });
  });
  return reviews;
}

export function makeDemoNotifications(orders: Order[]): Notification[] {
  const mine = orders.filter((o) => o.studentName === 'Prateek Das');
  const live = mine.find((o) => o.status === 'preparing');
  const past = mine.find((o) => o.status === 'collected');
  const now = Date.now();

  const list: Notification[] = [];

  if (live) {
    list.push({
      id: 'demo_ntf_1',
      type: 'order_update',
      title: `Token ${live.token} is being prepared`,
      body: 'Under Belly has started your order. We will tell you when it is ready.',
      createdAt: new Date(now - 4 * 60000).toISOString(),
      read: false,
      link: `/app/orders/${live.id}`,
    });
  }

  list.push(
    {
      id: 'demo_ntf_2',
      type: 'discount',
      title: '20% off surplus dosas at Dakshin',
      body: 'Batter left over near closing. Order ahead before the counter shuts at 9:00 PM.',
      createdAt: new Date(now - 26 * 60000).toISOString(),
      read: false,
      link: '/app/cafe/dakshin',
    },
    {
      id: 'demo_ntf_3',
      type: 'group_invite',
      title: 'Rohan started a group order',
      body: 'Add your items at Under Belly before the window closes.',
      createdAt: new Date(now - 55 * 60000).toISOString(),
      read: true,
      link: '/app',
    },
    {
      id: 'demo_ntf_4',
      type: 'new_item',
      title: 'Bistro added Aglio Olio Pasta',
      body: 'New on the Bistro by Safal Café board this week.',
      createdAt: new Date(now - 3 * 3600000).toISOString(),
      read: true,
      link: '/app/cafe/bistro-safal',
    },
  );

  if (past) {
    list.push({
      id: 'demo_ntf_5',
      type: 'review_reminder',
      title: 'How was your order?',
      body: `Tell us about token ${past.token} — it takes two taps.`,
      createdAt: new Date(now - 26 * 3600000).toISOString(),
      read: true,
      link: '/app/reviews',
    });
  }

  list.push({
    id: 'demo_ntf_6',
    type: 'cafe_closed',
    title: "Mayuri's AB-1 closed early yesterday",
    body: 'The counter shut at 7:30 PM. Normal hours resume today.',
    createdAt: new Date(now - 30 * 3600000).toISOString(),
    read: true,
  });

  return list;
}

// ---------------------------------------------------------------------------
// Insights mock data — realistic campus rhythm: breakfast bump, lunch spike,
// evening snack peak, quiet late night.
// ---------------------------------------------------------------------------

export const ORDERS_BY_HOUR = [
  { hour: '8 AM', orders: 14, revenue: 1120 },
  { hour: '9 AM', orders: 22, revenue: 1840 },
  { hour: '10 AM', orders: 18, revenue: 1560 },
  { hour: '11 AM', orders: 26, revenue: 2340 },
  { hour: '12 PM', orders: 48, revenue: 5280 },
  { hour: '1 PM', orders: 67, revenue: 7690 },
  { hour: '2 PM', orders: 41, revenue: 4510 },
  { hour: '3 PM', orders: 19, revenue: 1710 },
  { hour: '4 PM', orders: 24, revenue: 2160 },
  { hour: '5 PM', orders: 38, revenue: 3800 },
  { hour: '6 PM', orders: 52, revenue: 5720 },
  { hour: '7 PM', orders: 44, revenue: 5060 },
  { hour: '8 PM', orders: 31, revenue: 3410 },
  { hour: '9 PM', orders: 17, revenue: 1870 },
];

export const REVENUE_TREND = [
  { day: 'Mon', revenue: 38400, orders: 372 },
  { day: 'Tue', revenue: 41200, orders: 401 },
  { day: 'Wed', revenue: 44800, orders: 428 },
  { day: 'Thu', revenue: 39600, orders: 385 },
  { day: 'Fri', revenue: 52300, orders: 496 },
  { day: 'Sat', revenue: 34100, orders: 318 },
  { day: 'Sun', revenue: 21700, orders: 205 },
];

export const TESTIMONIALS = [
  {
    name: 'Ananya Joshi',
    detail: 'B.Tech CSE, 3rd year',
    quote:
      'I order between my 11:50 and 1:00 class. By the time I walk over from AB-2 the token is already up on the board.',
  },
  {
    name: 'Vikram Nair',
    detail: 'B.Tech Mechanical, 2nd year',
    quote:
      'The wait estimate is the part I actually trust now. If it says fourteen minutes at Under Belly, it is fourteen minutes.',
  },
  {
    name: 'Divya Krishnan',
    detail: 'M.Tech, 1st year',
    quote:
      'Four of us split one group order for the lab break. One token, one queue, nobody standing around at the counter.',
  },
];
