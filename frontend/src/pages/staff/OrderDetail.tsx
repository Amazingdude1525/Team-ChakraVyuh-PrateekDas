import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChefHat, Clock3, MapPin, Package, Phone, User, X } from 'lucide-react';
import { Button, Card, Chip, JaaliDivider, StatusPill } from '../../components/ui/primitives';
import { useBranch } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, formatClock, formatWindow, minutesSince, rupees } from '../../utils';
import type { OrderStatus } from '../../types';
import toast from 'react-hot-toast';

function nextStatus(current: OrderStatus): OrderStatus | null {
  const flow: OrderStatus[] = ['placed', 'preparing', 'ready', 'collected'];
  const idx = flow.indexOf(current);
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
}

export default function StaffOrderDetail() {
  const { cafeId, orderId } = useParams<{ cafeId: string; orderId: string }>();
  const branch = useBranch(cafeId);
  const orders = useStore((s) => s.orders);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const setItemPrepState = useStore((s) => s.setItemPrepState);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!branch || !order) {
    return (
      <div className="p-5 text-center">
        <p className="text-[var(--color-ink-muted)]">Order not found</p>
        <Link to={`/staff/${cafeId}/counter`}>
          <Button variant="secondary" size="sm" className="mt-4">
            <ArrowLeft size={14} /> Back to counter
          </Button>
        </Link>
      </div>
    );
  }

  const next = nextStatus(order.status);
  const elapsed = minutesSince(order.placedAt);

  return (
    <div className="p-3 sm:p-5 max-w-[800px] mx-auto space-y-5">
      {/* Back link */}
      <Link to={`/staff/${cafeId}/counter`} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-terracotta)] hover:underline">
        <ArrowLeft size={14} /> Back to counter
      </Link>

      {/* Token header */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="px-4 py-3 rounded-[14px] bg-[var(--color-charcoal)] text-[var(--color-saffron)] font-bold text-[28px] tabular-nums">
              {order.token}
            </span>
            <div>
              <StatusPill status={order.status} />
              <p className="text-[12px] text-[var(--color-ink-soft)] mt-1.5 flex items-center gap-1">
                <Clock3 size={11} /> {elapsed} min ago · Placed at {formatClock(order.placedAt)}
              </p>
            </div>
          </div>
          <span className="font-display text-[26px] text-[var(--color-charcoal)]">{rupees(order.total)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {next && (
            <Button
              className="flex-1"
              onClick={() => {
                setOrderStatus(order.id, next);
                toast.success(`Token ${order.token} → ${next}`);
              }}
            >
              {next === 'preparing' && <ChefHat size={15} />}
              {next === 'ready' && <CheckCircle2 size={15} />}
              {next === 'collected' && <Package size={15} />}
              Mark {next}
            </Button>
          )}
          {order.status === 'placed' && (
            <Button
              variant="secondary"
              onClick={() => {
                setOrderStatus(order.id, 'cancelled', 'Cancelled by staff');
                toast.success(`Token ${order.token} cancelled`);
              }}
            >
              <X size={15} /> Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Customer info */}
      <Card className="p-4">
        <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-3">Customer</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-[13px]">
            <User size={14} className="text-[var(--color-ink-soft)]" />
            <span className="text-[var(--color-charcoal)]">{order.studentName}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <Phone size={14} className="text-[var(--color-ink-soft)]" />
            <span className="text-[var(--color-charcoal)]">{order.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <MapPin size={14} className="text-[var(--color-ink-soft)]" />
            <span className="text-[var(--color-charcoal)]">{order.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <Clock3 size={14} className="text-[var(--color-ink-soft)]" />
            <span className="text-[var(--color-charcoal)]">
              {formatWindow(order.pickupWindowStart, order.pickupWindowEnd)}
            </span>
          </div>
        </div>
        {order.headingOver && (
          <Chip tone="saffron" className="mt-3 animate-pulse">🚶 Student is heading over</Chip>
        )}
      </Card>

      {/* Items with prep states */}
      <Card className="p-4">
        <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-3">Items</h3>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-[var(--color-cream)]">
              <span
                className={cx(
                  'diet-mark',
                  item.diet === 'nonveg' ? 'diet-mark-nonveg border-[var(--color-nonveg)] text-[var(--color-nonveg)]' :
                  item.diet === 'egg' ? 'border-[var(--color-egg)] text-[var(--color-egg)]' :
                  'border-[var(--color-veg)] text-[var(--color-veg)]',
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-charcoal)] truncate">{item.name}</p>
                <p className="text-[11px] text-[var(--color-ink-soft)]">{item.variantLabel} × {item.quantity}</p>
              </div>
              <span className="text-[13px] text-[var(--color-ink-muted)]">{rupees(item.unitPrice * item.quantity)}</span>
              <button
                type="button"
                onClick={() => {
                  const flow = ['pending', 'in_prep', 'done'] as const;
                  const idx = flow.indexOf(item.prepState);
                  if (idx < flow.length - 1) setItemPrepState(order.id, i, flow[idx + 1]);
                }}
                className={cx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold',
                  item.prepState === 'done' ? 'bg-emerald-500 text-white' :
                  item.prepState === 'in_prep' ? 'bg-amber-400 text-white cursor-pointer' :
                  'bg-gray-200 text-gray-600 cursor-pointer',
                )}
              >
                {item.prepState === 'done' ? 'DONE' : item.prepState === 'in_prep' ? 'IN PREP' : 'PENDING'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Order note */}
      {order.note && (
        <Card className="p-4 bg-[var(--color-saffron-tint)]">
          <p className="text-[12px] font-semibold text-[var(--color-saffron-deep)] mb-1">Order note</p>
          <p className="text-[13px] text-[var(--color-charcoal)]">{order.note}</p>
        </Card>
      )}

      {/* Price breakdown */}
      <Card className="p-4">
        <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-3">Summary</h3>
        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Subtotal</span>
            <span className="text-[var(--color-charcoal)]">{rupees(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[var(--color-veg)]">
              <span>{order.discountLabel ?? 'Discount'}</span>
              <span>-{rupees(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Taxes</span>
            <span className="text-[var(--color-charcoal)]">{rupees(order.taxes)}</span>
          </div>
          <JaaliDivider className="my-2" />
          <div className="flex justify-between font-semibold text-[15px]">
            <span className="text-[var(--color-charcoal)]">Total</span>
            <span className="text-[var(--color-charcoal)]">{rupees(order.total)}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Chip tone={order.paymentState === 'paid' ? 'veg' : 'wine'}>
            {order.paymentState === 'paid' ? '💳 Paid' : 'Pay at counter'}
          </Chip>
          <Chip tone="brass">{order.paymentMethod.toUpperCase()}</Chip>
          {order.cutlery && <Chip tone="saffron">🍴 Cutlery</Chip>}
          {order.isGroupOrder && <Chip tone="brass">👥 Group</Chip>}
        </div>
      </Card>
    </div>
  );
}
