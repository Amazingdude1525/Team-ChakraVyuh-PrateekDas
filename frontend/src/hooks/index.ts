import { useEffect, useMemo, useRef, useState } from 'react';
import { BRANCHES } from '../data/cafes';
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from '../data/menu';
import { COUPONS, TAX_RATE, useStore } from '../store/useStore';
import type { CafeBranch, MenuCategory, MenuItem } from '../types';

/**
 * Branches with staff overrides (early closing, live queue depth) folded in.
 * Every screen reads branches through here so the counter's open/closed switch
 * is felt immediately on the student side.
 */
export function useBranches(): CafeBranch[] {
  const overrides = useStore((s) => s.branchOverrides);
  return useMemo(
    () => BRANCHES.map((b) => ({ ...b, ...overrides[b.id] })),
    [overrides],
  );
}

export function useBranch(branchId: string | undefined): CafeBranch | undefined {
  const branches = useBranches();
  return useMemo(() => branches.find((b) => b.id === branchId), [branches, branchId]);
}

/**
 * The live menu: seed data plus staff edits, minus deleted rows, plus items
 * staff added themselves. This is the single source the student menu, search,
 * cart suggestions and the assistant all read from.
 */
export function useMenuItems(branchId?: string): MenuItem[] {
  const overrides = useStore((s) => s.menuOverrides);
  const custom = useStore((s) => s.customItems);
  const deleted = useStore((s) => s.deletedItemIds);
  const discounts = useStore((s) => s.discounts);

  return useMemo(() => {
    const deletedSet = new Set(deleted);
    const activeDiscounts = new Map(
      discounts.filter((d) => d.active && new Date(d.endsAt) > new Date()).map((d) => [d.itemId, d]),
    );

    const merged = [...SEED_MENU_ITEMS, ...custom]
      .filter((i) => !deletedSet.has(i.id))
      .filter((i) => !branchId || i.branchId === branchId)
      .map((i) => {
        const withOverride = overrides[i.id] ? { ...i, ...overrides[i.id] } : i;
        const discount = activeDiscounts.get(i.id);
        if (!discount) return withOverride;
        // A surplus discount rewrites every variant price so the student sees
        // the same number in the menu, the cart and the receipt.
        return {
          ...withOverride,
          variants: withOverride.variants.map((v) => ({
            ...v,
            price: Math.round(v.price * (1 - discount.percent / 100)),
          })),
          basePrice: Math.round(withOverride.basePrice * (1 - discount.percent / 100)),
        };
      });

    return merged;
  }, [branchId, overrides, custom, deleted, discounts]);
}

export function useCategories(branchId: string | undefined): MenuCategory[] {
  const custom = useStore((s) => s.customItems);
  return useMemo(() => {
    if (!branchId) return [];
    const seeded = SEED_CATEGORIES.filter((c) => c.branchId === branchId);
    // Staff can file a new item under a category name that doesn't exist yet.
    const extra = custom
      .filter((i) => i.branchId === branchId && !seeded.some((c) => c.id === i.categoryId))
      .map<MenuCategory>((i, idx) => ({
        id: i.categoryId,
        branchId,
        name: i.categoryId.split('-').slice(1).join(' ') || 'New items',
        order: seeded.length + idx,
      }));
    const unique = [...seeded, ...extra.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i)];
    return unique.sort((a, b) => a.order - b.order);
  }, [branchId, custom]);
}

/** Original (pre-discount) price, used to render the struck-through figure. */
export function useOriginalPrice(itemId: string): number | null {
  const discounts = useStore((s) => s.discounts);
  return useMemo(() => {
    const active = discounts.find(
      (d) => d.itemId === itemId && d.active && new Date(d.endsAt) > new Date(),
    );
    if (!active) return null;
    const seed = SEED_MENU_ITEMS.find((i) => i.id === itemId);
    return seed?.basePrice ?? null;
  }, [itemId, discounts]);
}

export function useActiveDiscounts() {
  const discounts = useStore((s) => s.discounts);
  const [, tick] = useState(0);
  // Discounts expire on a clock, so re-evaluate every 15 seconds.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);
  return discounts.filter((d) => d.active && new Date(d.endsAt) > new Date());
}

/** Cart totals with the coupon and tax lines the checkout screen itemises. */
export function useCartTotals() {
  const cart = useStore((s) => s.cart);
  const coupon = useStore((s) => s.coupon);

  return useMemo(() => {
    const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const def = coupon ? COUPONS[coupon] : null;
    const discount = def ? Math.round((subtotal * def.percent) / 100) : 0;
    const taxes = Math.round((subtotal - discount) * TAX_RATE);
    const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);
    return {
      subtotal,
      discount,
      discountLabel: def?.label,
      taxes,
      total: subtotal - discount + taxes,
      itemCount,
      branchId: cart[0]?.branchId ?? null,
    };
  }, [cart, coupon]);
}

/** Re-renders on an interval so elapsed timers and countdowns stay live. */
export function useTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** True after the first paint — used to stagger entrance animations once. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Honours both the OS setting and the in-app accessibility toggle. */
export function usePrefersReducedMotion(): boolean {
  const userPref = useStore((s) => s.student?.reduceMotion ?? false);
  const [osPref, setOsPref] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsPref(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsPref(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return userPref || osPref;
}

/** Simulated realtime: fires `onTick` on an interval while `enabled`. */
export function useSimulatedRealtime(enabled: boolean, onTick: () => void, intervalMs: number) {
  const saved = useRef(onTick);
  saved.current = onTick;

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => saved.current(), intervalMs);
    return () => clearInterval(t);
  }, [enabled, intervalMs]);
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
