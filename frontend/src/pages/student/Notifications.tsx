import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Bell,
  BellRing,
  PackageCheck,
  Sparkles,
  Store,
  Tag,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { Button, Card, EmptyState, SectionHeading } from '../../components/ui/primitives';
import { useStore } from '../../store/useStore';
import { cx, relativeTime } from '../../utils';
import type { Notification, NotificationType } from '../../types';

const TYPE_STYLE: Record<
  NotificationType,
  { icon: typeof Bell; className: string; label: string }
> = {
  order_update: {
    icon: BellRing,
    className: 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]',
    label: 'Order update',
  },
  ready: {
    icon: PackageCheck,
    className: 'bg-[var(--color-veg-tint)] text-[var(--color-veg)]',
    label: 'Ready for pickup',
  },
  discount: {
    icon: Tag,
    className: 'bg-[var(--color-wine-tint)] text-[var(--color-wine)]',
    label: 'Surplus deal',
  },
  group_invite: {
    icon: Users,
    className: 'bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)]',
    label: 'Group order',
  },
  review_reminder: {
    icon: ThumbsUp,
    className: 'bg-[#f6efe1] text-[var(--color-brass)]',
    label: 'Feedback',
  },
  cafe_closed: {
    icon: Store,
    className: 'bg-[var(--color-sand)] text-[var(--color-ink-muted)]',
    label: 'Cafe status',
  },
  new_item: {
    icon: Sparkles,
    className: 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]',
    label: 'New on the menu',
  },
};

function NotificationRow({ notification }: { notification: Notification }) {
  const navigate = useNavigate();
  const markRead = useStore((s) => s.markNotificationRead);
  const style = TYPE_STYLE[notification.type];

  function open() {
    markRead(notification.id);
    if (notification.link) navigate(notification.link);
  }

  const interactive = !!notification.link;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={cx(
          'p-4 transition-shadow',
          !notification.read && 'border-[var(--color-saffron)]/50 bg-[var(--color-saffron-tint)]/25',
          interactive && 'hover:shadow-warm-lg',
        )}
      >
        <button
          type="button"
          onClick={open}
          disabled={!interactive && notification.read}
          className="w-full flex items-start gap-3.5 text-left disabled:cursor-default"
        >
          <span
            className={cx(
              'w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0',
              style.className,
            )}
          >
            <style.icon size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-medium text-[var(--color-charcoal)] leading-snug">
                {notification.title}
              </h3>
              {!notification.read && (
                <span
                  aria-label="Unread"
                  className="w-2 h-2 rounded-full bg-[var(--color-terracotta)] shrink-0 mt-1.5"
                />
              )}
            </div>

            <p className="text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed mt-1">
              {notification.body}
            </p>

            <div className="flex items-center gap-2 mt-2 text-[11.5px] text-[var(--color-ink-soft)]">
              <span>{style.label}</span>
              <span aria-hidden>·</span>
              <span>{relativeTime(notification.createdAt)}</span>
            </div>
          </div>
        </button>
      </Card>
    </motion.div>
  );
}

export default function Notifications() {
  const notifications = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);

  const { today, earlier } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      today: notifications.filter((n) => new Date(n.createdAt) >= startOfToday),
      earlier: notifications.filter((n) => new Date(n.createdAt) < startOfToday),
    };
  }, [notifications]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5">
      <SectionHeading
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'You are all caught up'}
        serif
        action={
          unread > 0 ? (
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell size={24} />}
            title="Nothing here yet"
            body="Order updates, pickup alerts and surplus deals from the counters will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {today.length > 0 && (
            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)] mb-2.5">
                Today
              </h2>
              <div className="space-y-2.5">
                {today.map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            </section>
          )}

          {earlier.length > 0 && (
            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)] mb-2.5">
                Earlier
              </h2>
              <div className="space-y-2.5">
                {earlier.map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
