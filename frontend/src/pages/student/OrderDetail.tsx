import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Check,
  ChefHat,
  ChevronDown,
  Clock3,
  Footprints,
  LifeBuoy,
  MapPin,
  Navigation,
  PackageCheck,
  Receipt,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Button, Card, Chip, JaaliDivider, StatusPill } from '../../components/ui/primitives';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { CafeMark } from '../../components/student/cards';
import { useBranch, useTick } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, formatWindow, minutesSince, relativeTime, rupees } from '../../utils';
import type { OrderStatus } from '../../types';
import NotFound from '../public/NotFound';

const TIMELINE: { status: OrderStatus; label: string; body: string; icon: typeof Check }[] = [
  { status: 'placed', label: 'Placed', body: 'The counter has your order', icon: Check },
  { status: 'preparing', label: 'Preparing', body: 'The kitchen has started', icon: ChefHat },
  { status: 'ready', label: 'Ready', body: 'Waiting for you at the counter', icon: PackageCheck },
  { status: 'collected', label: 'Collected', body: 'Picked up — enjoy', icon: ThumbsUp },
];

const ORDER: OrderStatus[] = ['placed', 'preparing', 'ready', 'collected'];

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  useTick(15000); // keeps "x min ago" honest

  const order = useStore((s) => (s.orders ?? []).find((o) => o.id === orderId));
  const branch = useBranch(order?.branchId);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const markHeadingOver = useStore((s) => s.markHeadingOver);

  const [showControls, setShowControls] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) return <NotFound />;

  const currentIndex = ORDER.indexOf(order.status);
  const cancelled = order.status === 'cancelled';
  const live = order.status === 'placed' || order.status === 'preparing' || order.status === 'ready';

  function openDirections() {
    // A campus map deep link would go here; the prototype confirms the intent.
    toast(`Head to ${branch?.pickupPoint ?? 'the counter'}`, { icon: '🧭' });
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/orders')}>
          <ArrowLeft size={16} />
          Orders
        </Button>
        <StatusPill status={order.status} />
      </div>

      {/* Token */}
      <div className="rounded-[18px] bg-[var(--color-charcoal)] p-6 text-center relative overflow-hidden">
        <span aria-hidden className="absolute inset-0 jaali opacity-20" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-brass)] mb-1.5">
            Token
          </div>
          <div className="font-display text-[clamp(44px,12vw,68px)] leading-none text-[var(--color-saffron)] tabular-nums">
            {order.token}
          </div>
          {live && (
            <div className="text-[13px] text-[#c4bcae] mt-3 tabular-nums">
              Pickup {formatWindow(order.pickupWindowStart, order.pickupWindowEnd)}
            </div>
          )}
        </div>
      </div>

      {cancelled && (
        <div className="mt-4 rounded-[12px] bg-[var(--color-wine-tint)] text-[var(--color-wine)] p-4 text-[13px] leading-relaxed">
          This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : '.'} Nothing was
          charged.
        </div>
      )}

      {/* Timeline */}
      {!cancelled && (
        <Card className="mt-4 p-5">
          <h2 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-4">Progress</h2>

          <ol className="relative">
            {TIMELINE.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const upcoming = i > currentIndex;

              return (
                <li key={step.status} className="flex gap-3.5 pb-5 last:pb-0 relative">
                  {/* Connector */}
                  {i < TIMELINE.length - 1 && (
                    <span
                      aria-hidden
                      className={cx(
                        'absolute left-[15px] top-8 bottom-0 w-[2px] rounded-full',
                        done ? 'bg-[var(--color-veg)]' : 'bg-[var(--color-beige)]',
                      )}
                    />
                  )}

                  <span
                    className={cx(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors',
                      done
                        ? 'bg-[var(--color-veg)] text-white'
                        : active
                          ? 'bg-[var(--color-saffron)] text-[var(--color-charcoal)]'
                          : 'bg-[var(--color-sand)] text-[var(--color-ink-soft)]',
                    )}
                  >
                    <step.icon size={15} strokeWidth={done || active ? 2.6 : 2} />
                  </span>

                  <div className="min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cx(
                          'text-[14px] font-medium',
                          upcoming ? 'text-[var(--color-ink-soft)]' : 'text-[var(--color-charcoal)]',
                        )}
                      >
                        {step.label}
                      </h3>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-saffron)] animate-pulse" />
                      )}
                    </div>
                    <p className="text-[12.5px] text-[var(--color-ink-muted)] mt-0.5">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {order.status === 'preparing' && (
            <div className="mt-1 pt-4 border-t border-[var(--color-beige-soft)]">
              <p className="text-[12.5px] text-[var(--color-ink-muted)]">
                {order.items.filter((i) => i.prepState === 'done').length} of {order.items.length}{' '}
                items plated · started {relativeTime(order.placedAt)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Live actions */}
      {live && (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {!order.headingOver ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                markHeadingOver(order.id);
                toast.success('The counter knows you are on your way');
              }}
            >
              <Footprints size={16} />
              I'm heading over
            </Button>
          ) : (
            <div className="h-13 px-4 rounded-[10px] bg-[var(--color-veg-tint)] text-[var(--color-veg)] flex items-center justify-center gap-2 text-[13.5px] font-medium">
              <Check size={16} />
              Counter notified
            </div>
          )}

          <Button variant="secondary" size="lg" onClick={openDirections}>
            <Navigation size={16} />
            Directions
          </Button>
        </div>
      )}

      {/* Cafe and items */}
      <Card className="mt-4 p-5">
        {branch && (
          <Link
            to={`/app/cafe/${branch.id}`}
            className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--color-beige-soft)]"
          >
            <CafeMark branch={branch} size={44} />
            <div className="min-w-0 flex-1">
              <h2 className="text-[14.5px] font-semibold text-[var(--color-charcoal)] truncate">
                {branch.name}
              </h2>
              <p className="text-[12px] text-[var(--color-ink-soft)] flex items-center gap-1 truncate">
                <MapPin size={11} />
                {branch.pickupPoint}
              </p>
            </div>
          </Link>
        )}

        <ul className="space-y-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13.5px] text-[var(--color-charcoal)]">
                  <span className="font-medium">{item.quantity}×</span> {item.name}
                  <span className="text-[12px] text-[var(--color-ink-soft)]"> ({item.variantLabel})</span>
                </div>
                {item.participantName && (
                  <div className="text-[11.5px] text-[var(--color-terracotta)] mt-0.5">
                    For {item.participantName}
                  </div>
                )}
                {item.note && (
                  <div className="text-[11.5px] text-[var(--color-ink-muted)] mt-0.5">{item.note}</div>
                )}
                {order.status === 'preparing' && (
                  <Chip
                    tone={
                      item.prepState === 'done'
                        ? 'veg'
                        : item.prepState === 'in_prep'
                          ? 'saffron'
                          : 'neutral'
                    }
                    className="mt-1.5"
                  >
                    {item.prepState === 'done'
                      ? 'Plated'
                      : item.prepState === 'in_prep'
                        ? 'On the stove'
                        : 'Queued'}
                  </Chip>
                )}
              </div>
              <span className="text-[13.5px] tabular-nums shrink-0 text-[var(--color-charcoal)]">
                {rupees(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <JaaliDivider className="my-4" />

        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-muted)]">Item total</dt>
            <dd className="tabular-nums">{rupees(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between gap-3 text-[var(--color-veg)]">
              <dt>{order.discountLabel ?? 'Discount'}</dt>
              <dd className="tabular-nums">−{rupees(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-ink-muted)]">Taxes and charges</dt>
            <dd className="tabular-nums">{rupees(order.taxes)}</dd>
          </div>
          <div className="flex justify-between gap-3 pt-2 border-t border-[var(--color-beige-soft)]">
            <dt className="font-semibold text-[var(--color-charcoal)]">
              {order.paymentState === 'paid' ? 'Paid' : 'Pay at counter'}
            </dt>
            <dd className="font-semibold tabular-nums text-[var(--color-charcoal)]">
              {rupees(order.total)}
            </dd>
          </div>
        </dl>

        {order.note && (
          <div className="mt-4 p-3 rounded-[11px] bg-[var(--color-paper)] text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed">
            <span className="text-[var(--color-charcoal)] font-medium">Your note: </span>
            {order.note}
          </div>
        )}
      </Card>

      {/* Post-pickup review prompt */}
      {order.status === 'collected' && !order.reviewed && (
        <Card className="mt-4 p-5 bg-[var(--color-saffron-tint)]/50 border-[var(--color-saffron)]/50">
          <h2 className="text-[14.5px] font-semibold text-[var(--color-charcoal)]">
            How was it?
          </h2>
          <p className="text-[13px] text-[var(--color-ink-muted)] mt-1 leading-relaxed">
            A thumbs up or down on each item helps the next person ordering from{' '}
            {branch?.shortName}.
          </p>
          <Link to="/app/reviews">
            <Button className="mt-3.5">Leave feedback</Button>
          </Link>
        </Card>
      )}

      {/* Secondary actions */}
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link to="/help">
          <Button variant="ghost" size="sm">
            <LifeBuoy size={15} />
            Get help
          </Button>
        </Link>

        {order.status === 'placed' && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}>
            <X size={15} />
            Cancel order
          </Button>
        )}

        {order.status === 'collected' && (
          <Link to={`/app/cafe/${order.branchId}`}>
            <Button variant="ghost" size="sm">
              <Receipt size={15} />
              Order again
            </Button>
          </Link>
        )}
      </div>

      {/* ------------------------------------------------ prototype controls */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowControls((v) => !v)}
          aria-expanded={showControls}
          className="w-full flex items-center justify-between gap-3 px-4 h-11 rounded-[11px] border border-dashed border-[var(--color-beige)] text-[12.5px] text-[var(--color-ink-soft)] hover:border-[var(--color-brass)] transition-colors"
        >
          <span>Prototype controls — simulate the counter</span>
          <ChevronDown
            size={15}
            className={cx('transition-transform duration-250', showControls && 'rotate-180')}
          />
        </button>

        <AnimatePresence initial={false}>
          {showControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden"
            >
              <Card className="mt-2.5 p-4 bg-[var(--color-paper)]">
                <p className="text-[12px] text-[var(--color-ink-muted)] leading-relaxed mb-3">
                  In the real product these transitions come from the counter and kitchen screens.
                  Here you can drive them yourself — or open the staff panel in another tab and watch
                  this screen update.
                </p>

                <div className="flex flex-wrap gap-2">
                  {ORDER.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={order.status === status ? 'primary' : 'secondary'}
                      onClick={() => {
                        setOrderStatus(order.id, status);
                        toast.success(`Marked ${status}`);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--color-beige)] flex items-center gap-2 text-[11.5px] text-[var(--color-ink-soft)]">
                  <Clock3 size={13} />
                  Placed {minutesSince(order.placedAt)} min ago
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setOrderStatus(order.id, 'cancelled', 'Cancelled by you before the kitchen started');
          toast('Order cancelled');
        }}
        title="Cancel this order?"
        body="The counter has not started cooking yet, so it can still be cancelled. Nothing will be charged."
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        destructive
      />
    </div>
  );
}
