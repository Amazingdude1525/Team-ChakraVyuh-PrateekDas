import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Clock3, Home, MapPin, Receipt, Wallet } from 'lucide-react';
import { Button, Card, JaaliDivider } from '../../components/ui/primitives';
import { CafeMark } from '../../components/student/cards';
import { useBranch } from '../../hooks';
import { useStore } from '../../store/useStore';
import { formatWindow, minutesSince, rupees } from '../../utils';
import NotFound from '../public/NotFound';

/**
 * Confirmation. The token is the largest thing on the screen because it is the
 * only thing the student needs at the counter.
 */
export default function OrderConfirmed() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const order = useStore((s) => (s.orders ?? []).find((o) => o.id === orderId));
  const branch = useBranch(order?.branchId);

  // Landing here directly with a stale id should not show a broken shell.
  useEffect(() => {
    if (!order) return;
  }, [order]);

  if (!order) return <NotFound />;

  const waitLeft = Math.max(
    0,
    Math.round((new Date(order.pickupWindowStart).getTime() - Date.now()) / 60000),
  );

  return (
    <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.12 }}
          className="w-16 h-16 rounded-full bg-[var(--color-veg-tint)] text-[var(--color-veg)] flex items-center justify-center mx-auto mb-5"
        >
          <Check size={32} strokeWidth={3} />
        </motion.span>

        <h1 className="font-display text-[clamp(26px,4.2vw,36px)] leading-tight text-[var(--color-charcoal)]">
          Order placed
        </h1>
        <p className="text-[14px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">
          {branch?.name} has your order. Watch for your token on the counter board.
        </p>
      </motion.div>

      {/* Token — the hero of this screen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="mt-7"
      >
        <div className="rounded-[18px] bg-[var(--color-charcoal)] p-7 text-center relative overflow-hidden">
          <span aria-hidden className="absolute inset-0 jaali opacity-20" />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-brass)] mb-2">
              Your token
            </div>
            <div className="font-display text-[clamp(52px,14vw,80px)] leading-none text-[var(--color-saffron)] tabular-nums">
              {order.token}
            </div>
            <div className="text-[12.5px] text-[#b5ada0] mt-3">
              Show this at the counter when you collect
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details */}
      <Card className="mt-4 p-5">
        {branch && (
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--color-beige-soft)]">
            <CafeMark branch={branch} size={44} />
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-semibold text-[var(--color-charcoal)] truncate">
                {branch.name}
              </h2>
              <p className="text-[12px] text-[var(--color-ink-soft)] truncate">{branch.location}</p>
            </div>
          </div>
        )}

        <dl className="space-y-3.5">
          <div className="flex items-start gap-3">
            <Clock3 size={17} className="text-[var(--color-saffron-deep)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <dt className="text-[12px] text-[var(--color-ink-soft)]">Pickup window</dt>
              <dd className="text-[14.5px] font-semibold text-[var(--color-charcoal)] tabular-nums">
                {formatWindow(order.pickupWindowStart, order.pickupWindowEnd)}
              </dd>
              <dd className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">
                {waitLeft > 0 ? `About ${waitLeft} minutes away` : 'Should be ready any moment'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={17} className="text-[var(--color-terracotta)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <dt className="text-[12px] text-[var(--color-ink-soft)]">Collect from</dt>
              <dd className="text-[14px] text-[var(--color-charcoal)]">
                {branch?.pickupPoint ?? order.pickupLocation}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Wallet size={17} className="text-[var(--color-brass)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <dt className="text-[12px] text-[var(--color-ink-soft)]">
                {order.paymentState === 'paid' ? 'Paid' : 'Pay at the counter'}
              </dt>
              <dd className="text-[14.5px] font-semibold text-[var(--color-charcoal)] tabular-nums">
                {rupees(order.total)}
              </dd>
            </div>
          </div>
        </dl>

        <JaaliDivider className="my-4" />

        <div>
          <h3 className="text-[12px] text-[var(--color-ink-soft)] mb-2">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </h3>
          <ul className="space-y-1.5">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 text-[13px]">
                <span className="text-[var(--color-ink-muted)] min-w-0">
                  <span className="text-[var(--color-charcoal)]">{item.quantity}×</span> {item.name}
                  <span className="text-[11.5px] text-[var(--color-ink-soft)]">
                    {' '}
                    ({item.variantLabel})
                  </span>
                </span>
                <span className="tabular-nums shrink-0 text-[var(--color-charcoal)]">
                  {rupees(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="mt-5 space-y-2.5">
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate(`/app/orders/${order.id}`, { replace: true })}
        >
          <Receipt size={16} />
          View live status
        </Button>
        <Link to="/app" className="block">
          <Button variant="secondary" fullWidth size="lg">
            <Home size={16} />
            Back to cafes
          </Button>
        </Link>
      </div>

      <p className="text-[11.5px] text-[var(--color-ink-soft)] text-center mt-5 leading-relaxed">
        Placed {minutesSince(order.placedAt) === 0 ? 'just now' : `${minutesSince(order.placedAt)} min ago`}.
        This is a prototype — no payment was taken.
      </p>
    </div>
  );
}
