import { useMemo, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock3,
  Eye,
  Package,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { Button, Card, Chip, EmptyState, StatusPill } from '../../components/ui/primitives';
import { useBranch, useTick } from '../../hooks';
import { useStore } from '../../store/useStore';
import { formatWindow, minutesSince, rupees, cx } from '../../utils';
import type { Order, OrderStatus } from '../../types';
import toast from 'react-hot-toast';

type OrderFilter = 'placed' | 'preparing' | 'ready' | 'collected';

const FILTER_CONFIG: { key: OrderFilter; label: string; emptyIcon: string; emptyTitle: string }[] = [
  { key: 'placed', label: 'New', emptyIcon: '☕', emptyTitle: 'No new orders' },
  { key: 'preparing', label: 'Preparing', emptyIcon: '🍳', emptyTitle: 'Nothing cooking' },
  { key: 'ready', label: 'Ready', emptyIcon: '✅', emptyTitle: 'Nothing waiting' },
  { key: 'collected', label: 'Completed', emptyIcon: '📦', emptyTitle: 'Empty for now' },
];

function nextStatus(current: OrderStatus): OrderStatus | null {
  const flow: OrderStatus[] = ['placed', 'preparing', 'ready', 'collected'];
  const idx = flow.indexOf(current);
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
}

function actionLabel(next: OrderStatus): string {
  switch (next) {
    case 'preparing': return 'Start preparing';
    case 'ready': return 'Mark ready';
    case 'collected': return 'Mark collected';
    default: return 'Advance';
  }
}

function ElapsedBadge({ iso }: { iso: string }) {
  useTick(15000);
  const mins = minutesSince(iso);
  const color = mins > 10 ? 'var(--color-wine)' : mins > 5 ? 'var(--color-egg)' : 'var(--color-ink-soft)';
  const text = mins < 1 ? 'just now' : `${mins} min ago`;
  return (
    <span className="flex items-center gap-1 text-[11.5px] font-medium" style={{ color }}>
      <Clock3 size={11} /> {text}
    </span>
  );
}

export default function StaffCounter() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const branch = useBranch(cafeId);
  useOutletContext<{ connected: boolean }>();

  const orders = useStore((s) => s.orders);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const simulateIncomingOrder = useStore((s) => s.simulateIncomingOrder);

  const [filter, setFilter] = useState<OrderFilter>('placed');
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

  // Only orders for this branch
  const branchOrders = useMemo(
    () => orders.filter((o) => o.branchId === cafeId),
    [orders, cafeId],
  );

  const counts = useMemo(
    () => ({
      placed: branchOrders.filter((o) => o.status === 'placed').length,
      preparing: branchOrders.filter((o) => o.status === 'preparing').length,
      ready: branchOrders.filter((o) => o.status === 'ready').length,
      collected: branchOrders.filter((o) => o.status === 'collected').length,
    }),
    [branchOrders],
  );

  const filtered = useMemo(
    () =>
      branchOrders
        .filter((o) => o.status === filter)
        .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()),
    [branchOrders, filter],
  );

  const todayOrders = useMemo(
    () => branchOrders.filter((o) => new Date(o.placedAt).toDateString() === new Date().toDateString()),
    [branchOrders],
  );

  const todayRevenue = useMemo(
    () => todayOrders.filter((o) => o.status === 'collected').reduce((s, o) => s + o.total, 0),
    [todayOrders],
  );

  const avgWait = useMemo(() => {
    const completed = todayOrders.filter((o) => o.status === 'collected');
    if (completed.length === 0) return 0;
    const total = completed.reduce((s, o) => {
      return s + (new Date(o.pickupWindowEnd).getTime() - new Date(o.placedAt).getTime()) / 60000;
    }, 0);
    return Math.round(total / completed.length);
  }, [todayOrders]);

  const drawerOrder = useMemo(() => orders.find((o) => o.id === drawerOrderId), [orders, drawerOrderId]);

  function handleAdvance(order: Order) {
    const next = nextStatus(order.status);
    if (!next) return;
    setOrderStatus(order.id, next);
    toast.success(`Token ${order.token} → ${actionLabel(next)}`);
  }

  function handleSimulate() {
    if (!cafeId) return;
    const order = simulateIncomingOrder(cafeId);
    toast.success(`New order: Token ${order.token}`, { icon: '🔔' });
    setFilter('placed');
  }

  if (!branch) return null;

  return (
    <div className="p-3 sm:p-5 space-y-5 max-w-[1400px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active orders', value: String(counts.placed + counts.preparing + counts.ready), accent: 'var(--color-saffron)' },
          { label: 'Avg wait', value: avgWait ? `${avgWait} min` : '—', accent: 'var(--color-brass)' },
          { label: 'Ready now', value: String(counts.ready), accent: 'var(--color-veg)' },
          { label: "Today\u0027s revenue", value: rupees(todayRevenue), accent: 'var(--color-terracotta)' },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-[11.5px] text-[var(--color-ink-soft)] mb-1">{kpi.label}</p>
            <p className="font-display text-[26px] leading-none" style={{ color: kpi.accent }}>
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Simulate + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="secondary" size="sm" onClick={handleSimulate}>
          <Plus size={14} />
          Simulate new order
        </Button>

        <div className="flex-1" />

        {FILTER_CONFIG.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cx(
              'px-3.5 h-9 rounded-[10px] text-[13px] font-medium flex items-center gap-2 transition-colors',
              filter === f.key
                ? 'bg-[var(--color-charcoal)] text-[var(--color-cream)]'
                : 'bg-[var(--color-cream)] text-[var(--color-ink-muted)] border border-[var(--color-beige)] hover:border-[var(--color-brass)]',
            )}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span
                className={cx(
                  'min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center',
                  filter === f.key
                    ? 'bg-[var(--color-saffron)] text-[var(--color-charcoal)]'
                    : 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]',
                )}
              >
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((order) => {
            const next = nextStatus(order.status);
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 80 }}
                transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              >
                <Card className="p-4 hover:shadow-warm-lg transition-shadow">
                  {/* Header: token, elapsed, status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-2 rounded-[11px] bg-[var(--color-charcoal)] text-[var(--color-saffron)] font-bold text-[20px] tabular-nums">
                        {order.token}
                      </span>
                      <div>
                        <ElapsedBadge iso={order.placedAt} />
                        <div className="flex items-center gap-1.5 mt-1">
                          <StatusPill status={order.status} />
                          {order.paymentState === 'pay_at_counter' && (
                            <Chip tone="wine">Pay at counter</Chip>
                          )}
                          {order.isGroupOrder && (
                            <Chip tone="brass"><Users size={10} /> Group</Chip>
                          )}
                          {order.headingOver && (
                            <Chip tone="saffron" className="animate-pulse">🚶 Heading over</Chip>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[16px] font-semibold text-[var(--color-charcoal)] tabular-nums">
                      {rupees(order.total)}
                    </span>
                  </div>

                  {/* Customer note */}
                  {order.note && (
                    <div className="bg-[var(--color-saffron-tint)] rounded-[10px] px-3 py-2 mb-3 text-[12px] text-[var(--color-saffron-deep)]">
                      <strong>Note:</strong> {order.note}
                    </div>
                  )}

                  {/* Pickup window */}
                  <p className="text-[11.5px] text-[var(--color-ink-soft)] flex items-center gap-1 mb-2">
                    <Clock3 size={11} />
                    Pickup {formatWindow(order.pickupWindowStart, order.pickupWindowEnd)}
                  </p>

                  {/* Items */}
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px]">
                        <span
                          className={cx(
                            'diet-mark',
                            item.diet === 'nonveg' ? 'diet-mark-nonveg border-[var(--color-nonveg)] text-[var(--color-nonveg)]' :
                            item.diet === 'egg' ? 'border-[var(--color-egg)] text-[var(--color-egg)]' :
                            'border-[var(--color-veg)] text-[var(--color-veg)]',
                          )}
                        />
                        <span className="flex-1 truncate text-[var(--color-charcoal)] font-medium">
                          {item.name}
                        </span>
                        <span className="text-[11.5px] text-[var(--color-ink-soft)] bg-[var(--color-sand)] px-1.5 py-0.5 rounded">
                          {item.variantLabel}
                        </span>
                        <span className="font-semibold text-[var(--color-charcoal)]">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 5 && (
                      <p className="text-[12px] text-[var(--color-ink-soft)]">
                        +{order.items.length - 5} more items
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {next && (
                      <Button className="flex-1" size="sm" onClick={() => handleAdvance(order)}>
                        {next === 'preparing' && <ChefHat size={14} />}
                        {next === 'ready' && <CheckCircle2 size={14} />}
                        {next === 'collected' && <Package size={14} />}
                        {actionLabel(next)}
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => setDrawerOrderId(order.id)}>
                      <Eye size={14} />
                    </Button>
                    {order.status === 'placed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setOrderStatus(order.id, 'cancelled', 'Cancelled by staff');
                          toast.success(`Token ${order.token} cancelled`);
                        }}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="p-10">
          <EmptyState
            icon={
              filter === 'placed' ? <Package size={28} /> :
              filter === 'preparing' ? <ChefHat size={28} /> :
              filter === 'ready' ? <CheckCircle2 size={28} /> :
              <AlertCircle size={28} />
            }
            title={FILTER_CONFIG.find((f) => f.key === filter)?.emptyTitle ?? 'Empty'}
            body={
              filter === 'placed'
                ? "You're all caught up. Tap \"Simulate new order\" to test the flow."
                : `No orders in the ${filter} state right now.`
            }
          />
        </Card>
      )}

      {/* Order detail drawer (simple inline) */}
      {drawerOrder && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerOrderId(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[var(--color-ivory)] h-full overflow-y-auto shadow-warm-lg"
          >
            <div className="sticky top-0 bg-[var(--color-ivory)] border-b border-[var(--color-beige)] p-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[var(--color-charcoal)]">
                Order {drawerOrder.token}
              </h2>
              <button type="button" onClick={() => setDrawerOrderId(null)} className="p-2 rounded-full hover:bg-[var(--color-sand)]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Status</p>
                  <StatusPill status={drawerOrder.status} />
                </Card>
                <Card className="p-3">
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Total</p>
                  <p className="font-semibold text-[var(--color-charcoal)]">{rupees(drawerOrder.total)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Student</p>
                  <p className="text-[13px] font-medium text-[var(--color-charcoal)]">{drawerOrder.studentName}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Pickup</p>
                  <p className="text-[13px] font-medium text-[var(--color-charcoal)]">{drawerOrder.pickupLocation}</p>
                </Card>
              </div>

              <Card className="p-4">
                <p className="text-[12px] font-semibold text-[var(--color-charcoal)] mb-3">Items</p>
                <div className="space-y-2">
                  {drawerOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px]">
                      <span
                        className={cx(
                          'diet-mark',
                          item.diet === 'nonveg' ? 'diet-mark-nonveg border-[var(--color-nonveg)] text-[var(--color-nonveg)]' :
                          item.diet === 'egg' ? 'border-[var(--color-egg)] text-[var(--color-egg)]' :
                          'border-[var(--color-veg)] text-[var(--color-veg)]',
                        )}
                      />
                      <span className="flex-1 font-medium text-[var(--color-charcoal)]">{item.name}</span>
                      <span className="text-[var(--color-ink-soft)]">{item.variantLabel}</span>
                      <span className="font-semibold">×{item.quantity}</span>
                      <span className="text-[var(--color-ink-muted)]">{rupees(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {drawerOrder.note && (
                <Card className="p-4 bg-[var(--color-saffron-tint)]">
                  <p className="text-[12px] font-semibold text-[var(--color-saffron-deep)] mb-1">Order note</p>
                  <p className="text-[13px] text-[var(--color-charcoal)]">{drawerOrder.note}</p>
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
