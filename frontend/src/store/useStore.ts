import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CafeBranch,
  CartItem,
  Discount,
  Favorites,
  GroupOrder,
  ItemPrepState,
  MenuItem,
  Notification,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Review,
  Role,
  StaffMode,
  StudentProfile,
  VendorProfile,
} from '../types';
import { BRANCHES, TOKEN_PREFIX } from '../data/cafes';
import { SEED_MENU_ITEMS } from '../data/menu';
import { makeDemoNotifications, makeDemoOrders, makeDemoReviews } from '../data/demo';
import { pickupWindow, uid, waitMinutes } from '../utils';

const STORE_VERSION = 1;

export const DEMO_STUDENT: StudentProfile = {
  name: 'Prateek Das',
  email: 'prateek.24bce10599@vitbhopal.ac.in',
  registrationNumber: '24BCE10599',
  phone: '98765 43210',
  dietPreference: 'any',
  spicePreference: 'medium',
  defaultPickupLocation: 'AB-1, Ground Floor',
  notifyOrderUpdates: true,
  notifyDiscounts: true,
  reduceMotion: false,
  largeText: false,
};

/** Prototype staff logins surfaced on the vendor login screen. */
export const STAFF_ACCOUNTS: Record<string, { name: string; email: string }> = {
  underbelly: { name: 'Ravi Kumar', email: 'underbelly@vitebites.staff' },
  'mayuri-ab': { name: 'Sunita Sharma', email: 'mayuri.ab@vitebites.staff' },
  'mayuri-special': { name: 'Anil Verma', email: 'mayuri.special@vitebites.staff' },
  dakshin: { name: 'Lakshmi Iyer', email: 'dakshin@vitebites.staff' },
  'bistro-safal': { name: 'Farhan Qureshi', email: 'bistro@vitebites.staff' },
};

export const STAFF_PASSWORD = 'vitebites';

export const COUPONS: Record<string, { percent: number; label: string; minSpend: number }> = {
  VIT10: { percent: 10, label: 'VIT10 — 10% off', minSpend: 0 },
};

/** GST on prepared food, shown as a line so the total is never a surprise. */
export const TAX_RATE = 0.05;

interface StoreState {
  version: number;
  /** Millisecond timestamp the demo orders were generated. */
  demoSeededAt: number;

  // ---- session ----
  role: Role | null;
  student: StudentProfile | null;
  vendor: VendorProfile | null;

  // ---- student data ----
  cart: CartItem[];
  cartNote: string;
  coupon: string | null;
  favorites: Favorites;
  orders: Order[];
  reviews: Review[];
  notifications: Notification[];
  groupOrders: GroupOrder[];

  // ---- menu + branch overrides (staff edits, shared with the student app) ----
  menuOverrides: Record<string, Partial<MenuItem>>;
  customItems: MenuItem[];
  deletedItemIds: string[];
  branchOverrides: Record<string, Partial<CafeBranch>>;
  discounts: Discount[];

  // ---- staff session ----
  staffBranchId: string | null;
  staffMode: StaffMode | null;

  // ---- actions ----
  setRole: (role: Role | null) => void;
  loginStudent: (profile?: Partial<StudentProfile>) => void;
  loginStaff: (branchId: string, mode: StaffMode) => void;
  setStaffMode: (mode: StaffMode) => void;
  signOut: () => void;
  updateStudent: (patch: Partial<StudentProfile>) => void;

  addToCart: (line: Omit<CartItem, 'lineId'>) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  setCartNote: (note: string) => void;
  setLineNote: (lineId: string, note: string) => void;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;

  toggleFavoriteItem: (itemId: string) => void;
  toggleFavoriteBranch: (branchId: string) => void;

  placeOrder: (input: {
    branchId: string;
    studentName: string;
    phone: string;
    pickupLocation: string;
    paymentMethod: PaymentMethod;
    cutlery: boolean;
    note?: string;
    items?: CartItem[];
    isGroupOrder?: boolean;
    groupId?: string;
  }) => Order;
  setOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  setItemPrepState: (orderId: string, itemIndex: number, state: ItemPrepState) => void;
  markHeadingOver: (orderId: string) => void;
  simulateIncomingOrder: (branchId: string) => Order;

  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;

  pushNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  setItemAvailability: (itemId: string, available: boolean) => void;
  bulkSetAvailability: (itemIds: string[], available: boolean) => void;
  updateMenuItem: (itemId: string, patch: Partial<MenuItem>) => void;
  addMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  setBranchOpen: (branchId: string, isOpen: boolean) => void;

  startDiscount: (d: Omit<Discount, 'id' | 'active'>) => void;
  endDiscount: (id: string) => void;

  createGroupOrder: (branchId: string, creatorName: string) => GroupOrder;
  joinGroupOrder: (groupId: string, name: string) => void;
  addGroupItem: (groupId: string, item: Omit<CartItem, 'lineId'>) => void;
  removeGroupItem: (groupId: string, lineId: string) => void;
  lockGroupOrder: (groupId: string) => void;

  refreshDemoData: () => void;
  resetPrototype: () => void;
}

const emptyFavorites: Favorites = { items: [], branches: [] };

/** Cart lines merge when the item, variant and note all match. */
const lineKey = (l: { itemId: string; variantId: string; note?: string; participantName?: string }) =>
  `${l.itemId}::${l.variantId}::${l.note ?? ''}::${l.participantName ?? ''}`;

function initialData() {
  const orders = makeDemoOrders();
  return {
    demoSeededAt: Date.now(),
    orders,
    reviews: makeDemoReviews(orders),
    notifications: makeDemoNotifications(orders),
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      version: STORE_VERSION,
      ...initialData(),

      role: 'student',
      student: DEMO_STUDENT,
      vendor: null,

      cart: [],
      cartNote: '',
      coupon: null,
      favorites: emptyFavorites,
      groupOrders: [],

      menuOverrides: {},
      customItems: [],
      deletedItemIds: [],
      branchOverrides: {},
      discounts: [],

      staffBranchId: null,
      staffMode: null,

      // ---------------- session ----------------
      setRole: (role) => set({ role }),

      loginStudent: (profile) =>
        set({
          role: 'student',
          student: { ...DEMO_STUDENT, ...profile },
        }),

      loginStaff: (branchId, mode) => {
        const account = STAFF_ACCOUNTS[branchId] ?? { name: 'Cafe Staff', email: 'staff@vitebites.staff' };
        set({
          role: 'staff',
          vendor: { name: account.name, email: account.email, branchId, mode },
          staffBranchId: branchId,
          staffMode: mode,
        });
      },

      setStaffMode: (mode) =>
        set((s) => ({
          staffMode: mode,
          vendor: s.vendor ? { ...s.vendor, mode } : null,
        })),

      signOut: () => set({ role: null, student: null, vendor: null, staffBranchId: null, staffMode: null }),

      updateStudent: (patch) =>
        set((s) => ({ student: s.student ? { ...s.student, ...patch } : null })),

      // ---------------- cart ----------------
      addToCart: (line) =>
        set((s) => {
          const key = lineKey(line);
          const existing = s.cart.find((l) => lineKey(l) === key);
          if (existing) {
            return {
              cart: s.cart.map((l) =>
                lineKey(l) === key ? { ...l, quantity: l.quantity + line.quantity } : l,
              ),
            };
          }
          return { cart: [...s.cart, { ...line, lineId: uid('line') }] };
        }),

      setQuantity: (lineId, quantity) =>
        set((s) => ({
          cart:
            quantity <= 0
              ? s.cart.filter((l) => l.lineId !== lineId)
              : s.cart.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
        })),

      removeFromCart: (lineId) => set((s) => ({ cart: s.cart.filter((l) => l.lineId !== lineId) })),

      clearCart: () => set({ cart: [], cartNote: '', coupon: null }),

      setCartNote: (cartNote) => set({ cartNote }),

      setLineNote: (lineId, note) =>
        set((s) => ({ cart: s.cart.map((l) => (l.lineId === lineId ? { ...l, note } : l)) })),

      applyCoupon: (code) => {
        const key = code.trim().toUpperCase();
        if (!COUPONS[key]) return false;
        set({ coupon: key });
        return true;
      },

      clearCoupon: () => set({ coupon: null }),

      // ---------------- favorites ----------------
      toggleFavoriteItem: (itemId) =>
        set((s) => ({
          favorites: {
            ...s.favorites,
            items: s.favorites.items.includes(itemId)
              ? s.favorites.items.filter((i) => i !== itemId)
              : [...s.favorites.items, itemId],
          },
        })),

      toggleFavoriteBranch: (branchId) =>
        set((s) => ({
          favorites: {
            ...s.favorites,
            branches: s.favorites.branches.includes(branchId)
              ? s.favorites.branches.filter((i) => i !== branchId)
              : [...s.favorites.branches, branchId],
          },
        })),

      // ---------------- orders ----------------
      placeOrder: (input) => {
        const state = get();
        const lines = input.items ?? state.cart;
        const branch = { ...BRANCHES.find((b) => b.id === input.branchId)! , ...state.branchOverrides[input.branchId] };

        const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
        const couponDef = state.coupon ? COUPONS[state.coupon] : null;
        const discount = couponDef ? Math.round((subtotal * couponDef.percent) / 100) : 0;
        const taxes = Math.round((subtotal - discount) * TAX_RATE);

        // The wait quoted at checkout is the same arithmetic the counter uses.
        const longestPrep = Math.max(...lines.map(() => 0), 0);
        const wait = waitMinutes(branch, longestPrep);
        const { start, end } = pickupWindow(wait);

        const items: OrderItem[] = lines.map((l) => ({
          itemId: l.itemId,
          name: l.name,
          variantLabel: l.variantLabel,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          diet: l.diet,
          note: l.note,
          prepState: 'pending',
          participantName: l.participantName,
        }));

        const order: Order = {
          id: uid('ord'),
          token: nextToken(state.orders, input.branchId),
          branchId: input.branchId,
          studentName: input.studentName,
          phone: input.phone,
          pickupLocation: input.pickupLocation,
          items,
          status: 'placed',
          placedAt: new Date().toISOString(),
          pickupWindowStart: start.toISOString(),
          pickupWindowEnd: end.toISOString(),
          subtotal,
          discount,
          discountLabel: couponDef?.label,
          taxes,
          total: subtotal - discount + taxes,
          paymentMethod: input.paymentMethod,
          paymentState: input.paymentMethod === 'counter' ? 'pay_at_counter' : 'paid',
          note: input.note,
          cutlery: input.cutlery,
          isGroupOrder: input.isGroupOrder ?? false,
          groupId: input.groupId,
          headingOver: false,
          reviewed: false,
        };

        set((s) => ({
          orders: [order, ...s.orders],
          cart: input.items ? s.cart : [],
          cartNote: input.items ? s.cartNote : '',
          coupon: input.items ? s.coupon : null,
          // Queue depth feeds the crowd badge and the next wait estimate.
          branchOverrides: {
            ...s.branchOverrides,
            [input.branchId]: {
              ...s.branchOverrides[input.branchId],
              activeOrderCount: branch.activeOrderCount + 1,
            },
          },
        }));

        return order;
      },

      setOrderStatus: (orderId, status, reason) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === orderId);
          if (!order) return {};

          const notifications = [...s.notifications];
          if (status === 'ready') {
            notifications.unshift({
              id: uid('ntf'),
              type: 'ready',
              title: `Token ${order.token} is ready`,
              body: `Pick up from ${branchName(order.branchId)}. Show your token at the counter.`,
              createdAt: new Date().toISOString(),
              read: false,
              link: `/app/orders/${order.id}`,
            });
          } else if (status === 'preparing') {
            notifications.unshift({
              id: uid('ntf'),
              type: 'order_update',
              title: `Token ${order.token} is being prepared`,
              body: `${branchName(order.branchId)} has started your order.`,
              createdAt: new Date().toISOString(),
              read: false,
              link: `/app/orders/${order.id}`,
            });
          }

          // A finished order leaves the queue, so the crowd badge relaxes.
          const leavesQueue = status === 'collected' || status === 'cancelled';
          const branchOverrides = leavesQueue
            ? {
                ...s.branchOverrides,
                [order.branchId]: {
                  ...s.branchOverrides[order.branchId],
                  activeOrderCount: Math.max(
                    0,
                    (s.branchOverrides[order.branchId]?.activeOrderCount ??
                      BRANCHES.find((b) => b.id === order.branchId)!.activeOrderCount) - 1,
                  ),
                },
              }
            : s.branchOverrides;

          return {
            notifications,
            branchOverrides,
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status,
                    cancelReason: reason ?? o.cancelReason,
                    // Marking an order ready implies every item is plated.
                    items:
                      status === 'ready' || status === 'collected'
                        ? o.items.map((it) => ({ ...it, prepState: 'done' as ItemPrepState }))
                        : o.items,
                  }
                : o,
            ),
          };
        }),

      setItemPrepState: (orderId, itemIndex, prepState) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, items: o.items.map((it, i) => (i === itemIndex ? { ...it, prepState } : it)) }
              : o,
          ),
        }));

        // When the kitchen finishes the last item the order flips to ready,
        // which is what the counter and the student's tracker both watch.
        const order = get().orders.find((o) => o.id === orderId);
        if (order && order.status === 'preparing' && order.items.every((it) => it.prepState === 'done')) {
          get().setOrderStatus(orderId, 'ready');
        }
      },

      markHeadingOver: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, headingOver: true } : o)),
        })),

      simulateIncomingOrder: (branchId) => {
        const pool = SEED_MENU_ITEMS.filter((i) => i.branchId === branchId && i.available);
        const names = ['Aditya R.', 'Sneha P.', 'Karthik M.', 'Ishita B.', 'Rohan G.', 'Meera S.'];
        const count = 1 + Math.floor(Math.random() * 3);
        const chosen: CartItem[] = [];
        for (let i = 0; i < count; i++) {
          const item = pool[Math.floor(Math.random() * pool.length)];
          if (!item) continue;
          const variant = item.variants[Math.floor(Math.random() * item.variants.length)];
          chosen.push({
            lineId: uid('line'),
            itemId: item.id,
            branchId,
            name: item.name,
            variantId: variant.id,
            variantLabel: variant.label,
            unitPrice: variant.price,
            quantity: 1 + Math.floor(Math.random() * 2),
            diet: item.diet,
          });
        }
        return get().placeOrder({
          branchId,
          studentName: names[Math.floor(Math.random() * names.length)],
          phone: '98765 00000',
          pickupLocation: 'AB-1, Ground Floor',
          paymentMethod: Math.random() > 0.4 ? 'upi' : 'counter',
          cutlery: Math.random() > 0.5,
          items: chosen,
        });
      },

      // ---------------- reviews ----------------
      addReview: (review) =>
        set((s) => {
          const existing = s.reviews.find(
            (r) => r.orderId === review.orderId && r.itemId === review.itemId,
          );
          const reviews = existing
            ? s.reviews.map((r) => (r.id === existing.id ? { ...r, ...review } : r))
            : [
                { ...review, id: uid('rev'), createdAt: new Date().toISOString() },
                ...s.reviews,
              ];
          return {
            reviews,
            orders: s.orders.map((o) => (o.id === review.orderId ? { ...o, reviewed: true } : o)),
          };
        }),

      // ---------------- notifications ----------------
      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid('ntf'), createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      // ---------------- menu management ----------------
      setItemAvailability: (itemId, available) =>
        set((s) => ({
          menuOverrides: { ...s.menuOverrides, [itemId]: { ...s.menuOverrides[itemId], available } },
          customItems: s.customItems.map((i) => (i.id === itemId ? { ...i, available } : i)),
        })),

      bulkSetAvailability: (itemIds, available) =>
        set((s) => {
          const menuOverrides = { ...s.menuOverrides };
          for (const id of itemIds) menuOverrides[id] = { ...menuOverrides[id], available };
          return {
            menuOverrides,
            customItems: s.customItems.map((i) =>
              itemIds.includes(i.id) ? { ...i, available } : i,
            ),
          };
        }),

      updateMenuItem: (itemId, patch) =>
        set((s) => ({
          menuOverrides: { ...s.menuOverrides, [itemId]: { ...s.menuOverrides[itemId], ...patch } },
          customItems: s.customItems.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
        })),

      addMenuItem: (item) => set((s) => ({ customItems: [...s.customItems, item] })),

      deleteMenuItem: (itemId) =>
        set((s) => ({
          deletedItemIds: [...s.deletedItemIds, itemId],
          customItems: s.customItems.filter((i) => i.id !== itemId),
        })),

      setBranchOpen: (branchId, isOpen) =>
        set((s) => ({
          branchOverrides: {
            ...s.branchOverrides,
            [branchId]: { ...s.branchOverrides[branchId], isOpen },
          },
        })),

      // ---------------- discounts ----------------
      startDiscount: (d) =>
        set((s) => ({
          discounts: [{ ...d, id: uid('dsc'), active: true }, ...s.discounts],
          notifications: [
            {
              id: uid('ntf'),
              type: 'discount' as const,
              title: `${d.percent}% off ${d.itemName}`,
              body: `${branchName(d.branchId)} has surplus stock near closing. Order ahead before it goes.`,
              createdAt: new Date().toISOString(),
              read: false,
              link: `/app/cafe/${d.branchId}`,
            },
            ...s.notifications,
          ],
        })),

      endDiscount: (id) =>
        set((s) => ({
          discounts: s.discounts.map((d) => (d.id === id ? { ...d, active: false } : d)),
        })),

      // ---------------- group orders ----------------
      createGroupOrder: (branchId, creatorName) => {
        const group: GroupOrder = {
          id: uid('grp'),
          code: makeCode(),
          branchId,
          participants: [
            {
              id: uid('p'),
              name: creatorName,
              initials: creatorName.slice(0, 2).toUpperCase(),
              isCreator: true,
              joinedAt: new Date().toISOString(),
            },
          ],
          items: [],
          expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
          locked: false,
          payerName: creatorName,
        };
        set((s) => ({ groupOrders: [group, ...s.groupOrders] }));
        return group;
      },

      joinGroupOrder: (groupId, name) =>
        set((s) => ({
          groupOrders: s.groupOrders.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  participants: [
                    ...g.participants,
                    {
                      id: uid('p'),
                      name,
                      initials: name.slice(0, 2).toUpperCase(),
                      isCreator: false,
                      joinedAt: new Date().toISOString(),
                    },
                  ],
                }
              : g,
          ),
        })),

      addGroupItem: (groupId, item) =>
        set((s) => ({
          groupOrders: s.groupOrders.map((g) =>
            g.id === groupId ? { ...g, items: [...g.items, { ...item, lineId: uid('line') }] } : g,
          ),
        })),

      removeGroupItem: (groupId, lineId) =>
        set((s) => ({
          groupOrders: s.groupOrders.map((g) =>
            g.id === groupId ? { ...g, items: g.items.filter((i) => i.lineId !== lineId) } : g,
          ),
        })),

      lockGroupOrder: (groupId) =>
        set((s) => ({
          groupOrders: s.groupOrders.map((g) => (g.id === groupId ? { ...g, locked: true } : g)),
        })),

      // ---------------- prototype lifecycle ----------------
      /**
       * Demo orders carry relative timestamps ("4 minutes ago"), so a store
       * restored from yesterday would show every ticket as hours overdue.
       * Re-seed the demo rows while keeping anything the user created.
       */
      refreshDemoData: () =>
        set((s) => {
          const userOrders = s.orders.filter((o) => !o.id.startsWith('demo_'));
          const fresh = makeDemoOrders();
          return {
            demoSeededAt: Date.now(),
            orders: [...userOrders, ...fresh].sort(
              (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
            ),
          };
        }),

      resetPrototype: () =>
        set({
          ...initialData(),
          role: null,
          student: null,
          vendor: null,
          cart: [],
          cartNote: '',
          coupon: null,
          favorites: emptyFavorites,
          groupOrders: [],
          menuOverrides: {},
          customItems: [],
          deletedItemIds: [],
          branchOverrides: {},
          discounts: [],
          staffBranchId: null,
          staffMode: null,
        }),
    }),
    {
      name: 'vitebites-prototype',
      version: STORE_VERSION,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...((persistedState as Record<string, unknown>) ?? {}),
      }),
    },
  ),
);

// ---------------- helpers ----------------

function branchName(branchId: string): string {
  return BRANCHES.find((b) => b.id === branchId)?.name ?? 'the cafe';
}

/** Tokens restart per branch per day: UB-14, MA-07, DK-22 … */
function nextToken(orders: Order[], branchId: string): string {
  const prefix = TOKEN_PREFIX[branchId] ?? 'VB';
  const today = new Date().toDateString();
  const todays = orders.filter(
    (o) => o.branchId === branchId && new Date(o.placedAt).toDateString() === today,
  );
  const highest = todays.reduce((max, o) => {
    const n = parseInt(o.token.split('-')[1] ?? '0', 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(2, '0')}`;
}

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `VB-${out}`;
}
