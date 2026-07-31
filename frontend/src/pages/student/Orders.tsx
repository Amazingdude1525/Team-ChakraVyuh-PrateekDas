import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt, RotateCcw, Search, X } from 'lucide-react';
import { Button, Card, EmptyState, Segmented, SectionHeading } from '../../components/ui/primitives';
import { Sheet } from '../../components/ui/Overlay';
import { OrderCard } from '../../components/student/cards';
import { useBranches, useMenuItems } from '../../hooks';
import { useStore } from '../../store/useStore';
import { formatDate, formatWindow, rupees } from '../../utils';
import type { Order } from '../../types';

type Tab = 'active' | 'previous';

export default function Orders() {
  const navigate = useNavigate();
  const branches = useBranches();
  const allItems = useMenuItems();

  const orders = useStore((s) => s.orders ?? []);
  const student = useStore((s) => s.student);
  const addToCart = useStore((s) => s.addToCart);
  const clearCart = useStore((s) => s.clearCart);

  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  /** Only this student's orders — staff-simulated ones stay on the counter. */
  const mine = useMemo(
    () => orders.filter((o) => o.studentName === student?.name),
    [orders, student?.name],
  );

  const active = useMemo(
    () => mine.filter((o) => ['placed', 'preparing', 'ready'].includes(o.status)),
    [mine],
  );

  const previous = useMemo(
    () => mine.filter((o) => ['collected', 'cancelled'].includes(o.status)),
    [mine],
  );

  const visible = useMemo(() => {
    const base = tab === 'active' ? active : previous;
    const q = query.trim().toLowerCase();
    return base.filter((o) => {
      if (branchFilter !== 'all' && o.branchId !== branchFilter) return false;
      if (!q) return true;
      return (
        o.token.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q)) ||
        (branches.find((b) => b.id === o.branchId)?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [tab, active, previous, query, branchFilter, branches]);

  /** Rebuilds the cart from a past order, keeping the single-cafe rule. */
  function reorder(order: Order) {
    clearCart();
    let added = 0;
    for (const line of order.items) {
      const item = allItems.find((i) => i.id === line.itemId);
      if (!item?.available) continue;
      const variant =
        item.variants.find((v) => v.label === line.variantLabel) ?? item.variants[0];
      addToCart({
        itemId: item.id,
        branchId: item.branchId,
        name: item.name,
        variantId: variant.id,
        variantLabel: variant.label,
        unitPrice: variant.price,
        quantity: line.quantity,
        diet: item.diet,
        note: line.note,
      });
      added++;
    }

    if (added === 0) {
      toast.error('Nothing from that order is available right now');
      return;
    }
    if (added < order.items.length) {
      toast(`${order.items.length - added} item(s) are sold out and were skipped`);
    } else {
      toast.success('Added back to your cart');
    }
    navigate('/app/cart');
  }

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-5">
      <SectionHeading title="Your orders" subtitle="Everything you have ordered on campus" serif />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: 'Active', count: active.length },
            { value: 'previous', label: 'Previous', count: previous.length },
          ]}
        />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by token, dish or cafe"
            aria-label="Search your orders"
            className="w-full h-11 pl-10 pr-9 rounded-[11px] bg-[var(--color-cream)] border border-[var(--color-beige)] focus:border-[var(--color-saffron)] text-[13.5px] transition-colors placeholder:text-[var(--color-ink-soft)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-charcoal)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          aria-label="Filter by cafe"
          className="h-11 px-3 rounded-[11px] bg-[var(--color-cream)] border border-[var(--color-beige)] text-[13.5px] sm:w-[200px]"
        >
          <option value="all">All cafes</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.shortName}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt size={24} />}
            title={
              query || branchFilter !== 'all'
                ? 'Nothing matches that'
                : tab === 'active'
                  ? 'No orders in progress'
                  : 'No past orders yet'
            }
            body={
              query || branchFilter !== 'all'
                ? 'Try a different token, dish or cafe.'
                : tab === 'active'
                  ? 'When you place an order it will show up here with its token and pickup window.'
                  : 'Once you collect an order it moves here, and you can reorder it in one tap.'
            }
            action={
              query || branchFilter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setBranchFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => navigate('/app')}>Browse cafes</Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const branch = branches.find((b) => b.id === order.branchId);
            return (
              <div key={order.id}>
                <OrderCard order={order} branch={branch} />

                {tab === 'previous' && (
                  <div className="flex flex-wrap gap-2 mt-2 px-1">
                    <Button size="sm" variant="secondary" onClick={() => reorder(order)}>
                      <RotateCcw size={14} />
                      Reorder
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReceiptOrder(order)}>
                      <Receipt size={14} />
                      Receipt
                    </Button>
                    {order.status === 'collected' && !order.reviewed && (
                      <Button size="sm" variant="ghost" onClick={() => navigate('/app/reviews')}>
                        Leave feedback
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt */}
      <Sheet
        open={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        title={receiptOrder ? `Receipt · ${receiptOrder.token}` : undefined}
        description={receiptOrder ? formatDate(receiptOrder.placedAt) : undefined}
      >
        {receiptOrder && (
          <div className="space-y-4 pb-1">
            <div className="text-[12.5px] text-[var(--color-ink-muted)] space-y-1">
              <p>{branches.find((b) => b.id === receiptOrder.branchId)?.name}</p>
              <p>Collected by {receiptOrder.studentName}</p>
              <p className="tabular-nums">
                Pickup {formatWindow(receiptOrder.pickupWindowStart, receiptOrder.pickupWindowEnd)}
              </p>
            </div>

            <div className="brass-rule" />

            <ul className="space-y-2">
              {receiptOrder.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3 text-[13px]">
                  <span className="text-[var(--color-ink-muted)] min-w-0">
                    <span className="text-[var(--color-charcoal)]">{item.quantity}×</span>{' '}
                    {item.name}
                    <span className="text-[11.5px] text-[var(--color-ink-soft)]">
                      {' '}
                      ({item.variantLabel})
                    </span>
                  </span>
                  <span className="tabular-nums shrink-0">
                    {rupees(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="brass-rule" />

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-ink-muted)]">Item total</dt>
                <dd className="tabular-nums">{rupees(receiptOrder.subtotal)}</dd>
              </div>
              {receiptOrder.discount > 0 && (
                <div className="flex justify-between gap-3 text-[var(--color-veg)]">
                  <dt>{receiptOrder.discountLabel ?? 'Discount'}</dt>
                  <dd className="tabular-nums">−{rupees(receiptOrder.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-ink-muted)]">Taxes and charges</dt>
                <dd className="tabular-nums">{rupees(receiptOrder.taxes)}</dd>
              </div>
              <div className="flex justify-between gap-3 pt-2 border-t border-[var(--color-beige)]">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">{rupees(receiptOrder.total)}</dd>
              </div>
            </dl>

            <p className="text-[11.5px] text-[var(--color-ink-soft)] leading-relaxed">
              Paid by {receiptOrder.paymentMethod === 'counter' ? 'cash at the counter' : receiptOrder.paymentMethod.toUpperCase()}.
              Prototype receipt — no real transaction took place.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
