import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  JaaliDivider,
  SectionHeading,
  Textarea,
} from '../../components/ui/primitives';
import { useBranches } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, formatDate, relativeTime } from '../../utils';
import type { Order } from '../../types';

/**
 * Feedback is gated on a collected order: you can only rate something you
 * actually picked up. That constraint is the point of the feature, so the UI
 * only ever offers items from orders in the student's own history.
 */

function ThumbButton({
  active,
  onClick,
  variant,
  label,
}: {
  active: boolean;
  onClick: () => void;
  variant: 'up' | 'down';
  label: string;
}) {
  const Icon = variant === 'up' ? ThumbsUp : ThumbsDown;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-pressed={active}
      aria-label={label}
      className={cx(
        'w-10 h-10 rounded-full flex items-center justify-center border transition-colors',
        active
          ? variant === 'up'
            ? 'bg-[var(--color-veg-tint)] border-[var(--color-veg)] text-[var(--color-veg)]'
            : 'bg-[var(--color-wine-tint)] border-[var(--color-wine)] text-[var(--color-wine)]'
          : 'bg-[var(--color-cream)] border-[var(--color-beige)] text-[var(--color-ink-soft)] hover:border-[var(--color-brass)]',
      )}
    >
      <Icon size={17} className={cx(active && 'fill-current')} />
    </motion.button>
  );
}

function OrderReviewCard({ order }: { order: Order }) {
  const branches = useBranches();
  const reviews = useStore((s) => s.reviews);
  const addReview = useStore((s) => s.addReview);

  const branch = branches.find((b) => b.id === order.branchId);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [openComment, setOpenComment] = useState<string | null>(null);

  function reviewFor(itemId: string) {
    return reviews.find((r) => r.orderId === order.id && r.itemId === itemId);
  }

  function submit(itemId: string, itemName: string, liked: boolean) {
    addReview({
      orderId: order.id,
      itemId,
      itemName,
      branchId: order.branchId,
      liked,
      comment: comments[itemId]?.trim() || undefined,
    });
    toast.success('Thanks — that helps the next person');
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-semibold text-[var(--color-charcoal)] truncate">
            {branch?.name}
          </h3>
          <p className="text-[12px] text-[var(--color-ink-soft)]">{formatDate(order.placedAt)}</p>
        </div>
        <Chip tone="neutral" className="shrink-0">
          {order.token}
        </Chip>
      </div>

      <JaaliDivider className="my-3.5" />

      <div className="space-y-4">
        {order.items.map((item) => {
          const existing = reviewFor(item.itemId);
          return (
            <div key={item.itemId}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-[13.5px] text-[var(--color-charcoal)] leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[11.5px] text-[var(--color-ink-soft)]">
                    {item.quantity} × {item.variantLabel}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <ThumbButton
                    variant="up"
                    active={existing?.liked === true}
                    label={`Liked ${item.name}`}
                    onClick={() => submit(item.itemId, item.name, true)}
                  />
                  <ThumbButton
                    variant="down"
                    active={existing?.liked === false}
                    label={`Did not like ${item.name}`}
                    onClick={() => submit(item.itemId, item.name, false)}
                  />
                </div>
              </div>

              {existing && (
                <div className="mt-2">
                  {openComment === item.itemId ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={2}
                        maxLength={200}
                        autoFocus
                        defaultValue={existing.comment ?? ''}
                        placeholder="What was good, or what was off?"
                        onChange={(e) =>
                          setComments((c) => ({ ...c, [item.itemId]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            submit(item.itemId, item.name, existing.liked);
                            setOpenComment(null);
                          }}
                        >
                          Save note
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setOpenComment(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenComment(item.itemId)}
                      className="text-[11.5px] text-[var(--color-terracotta)] hover:underline"
                    >
                      {existing.comment ? `“${existing.comment}” — edit` : 'Add a note'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function Reviews() {
  const navigate = useNavigate();
  const branches = useBranches();
  const orders = useStore((s) => s.orders);
  const reviews = useStore((s) => s.reviews);
  const student = useStore((s) => s.student);

  /** Collected orders with at least one item not yet rated. */
  const awaiting = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.studentName === student?.name &&
          o.status === 'collected' &&
          o.items.some((i) => !reviews.some((r) => r.orderId === o.id && r.itemId === i.itemId)),
      ),
    [orders, reviews, student?.name],
  );

  const history = useMemo(
    () => [...reviews].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [reviews],
  );

  const likes = history.filter((r) => r.liked).length;
  const dislikes = history.length - likes;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 space-y-7">
      <SectionHeading
        title="Your feedback"
        subtitle="Rate what you have actually collected — that is what keeps it honest"
        serif
      />

      {/* Aggregate */}
      {history.length > 0 && (
        <Card className="p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display text-[28px] leading-none text-[var(--color-charcoal)]">
                {history.length}
              </div>
              <div className="text-[11.5px] text-[var(--color-ink-muted)] mt-1.5">rated</div>
            </div>
            <div>
              <div className="font-display text-[28px] leading-none text-[var(--color-veg)]">
                {likes}
              </div>
              <div className="text-[11.5px] text-[var(--color-ink-muted)] mt-1.5">liked</div>
            </div>
            <div>
              <div className="font-display text-[28px] leading-none text-[var(--color-wine)]">
                {dislikes}
              </div>
              <div className="text-[11.5px] text-[var(--color-ink-muted)] mt-1.5">not for you</div>
            </div>
          </div>
        </Card>
      )}

      {/* Awaiting review */}
      <section>
        <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-3">
          Waiting on your verdict
        </h2>

        {awaiting.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={<MessageSquare size={22} />}
              title="Nothing to rate right now"
              body="Once you collect an order it shows up here, item by item."
              action={<Button variant="secondary" onClick={() => navigate('/app/orders')}>
                View orders
              </Button>}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {awaiting.map((order) => (
              <OrderReviewCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-3">
            What you have said
          </h2>
          <Card className="px-5">
            {history.map((review) => {
              const branch = branches.find((b) => b.id === review.branchId);
              return (
                <div
                  key={review.id}
                  className="py-3.5 border-b border-[var(--color-beige-soft)] last:border-0 flex items-start gap-3"
                >
                  <span
                    className={cx(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      review.liked
                        ? 'bg-[var(--color-veg-tint)] text-[var(--color-veg)]'
                        : 'bg-[var(--color-wine-tint)] text-[var(--color-wine)]',
                    )}
                  >
                    {review.liked ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] text-[var(--color-charcoal)] leading-snug">
                      {review.itemName}
                    </h3>
                    <p className="text-[11.5px] text-[var(--color-ink-soft)]">
                      {branch?.shortName} · {relativeTime(review.createdAt)}
                    </p>
                    {review.comment && (
                      <p className="text-[12.5px] text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">
                        “{review.comment}”
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      )}
    </div>
  );
}
