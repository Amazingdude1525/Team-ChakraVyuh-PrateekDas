import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  Heart,
  Home,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useCartTotals } from '../hooks';
import { useStore } from '../store/useStore';
import { cx, rupees } from '../utils';

/**
 * Shell for every signed-in student screen: a compact top bar on desktop,
 * a thumb-reachable bottom bar on phones, and a persistent cart pill so the
 * cart is never more than one tap away.
 */

const NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/search', label: 'Search', icon: Search, end: false },
  { to: '/app/orders', label: 'Orders', icon: Receipt, end: false },
  { to: '/app/favorites', label: 'Saved', icon: Heart, end: false },
  { to: '/app/profile', label: 'Profile', icon: null, end: false },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const student = useStore((s) => s.student);
  const notifications = useStore((s) => s.notifications);
  const { itemCount, total } = useCartTotals();

  const unread = notifications.filter((n) => !n.read).length;
  const initials = (student?.name ?? 'VB')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // The cart pill would sit on top of the cart and checkout screens themselves.
  const showCartPill =
    itemCount > 0 && !['/app/cart', '/app/checkout'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ------------------------------------------------------- top bar */}
      <header className="sticky top-0 z-30 glass-warm border-b border-[var(--color-beige)]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-15 py-3 flex items-center justify-between gap-4">
          <Link to="/app" className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-[9px] bg-[var(--color-saffron)] flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-[var(--color-charcoal)]" />
            </span>
            <span className="font-display text-[19px] leading-none text-[var(--color-charcoal)] hidden xs:inline">
              VITe<span className="text-[var(--color-terracotta)]">Bites</span>
            </span>
          </Link>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.filter((n) => n.icon).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'px-3 py-2 rounded-[9px] text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-charcoal)] hover:bg-[var(--color-sand)]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/app/assistant"
              aria-label="Menu assistant"
              title="Menu assistant"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)] hover:text-[var(--color-charcoal)] transition-colors"
            >
              <Sparkles size={17} />
            </Link>

            <Link
              to="/app/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)] hover:text-[var(--color-charcoal)] transition-colors"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-terracotta)] text-white text-[10px] font-semibold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <Link
              to="/app/cart"
              aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)] hover:text-[var(--color-charcoal)] transition-colors"
            >
              <ShoppingBag size={17} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-saffron)] text-[var(--color-charcoal)] text-[10px] font-semibold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              to="/app/profile"
              aria-label="Profile"
              className="w-9 h-9 rounded-full bg-[var(--color-charcoal)] text-[var(--color-cream)] text-[12px] font-semibold flex items-center justify-center ml-0.5"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- content */}
      <main className="flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* ------------------------------------------------------- cart pill */}
      <AnimatePresence>
        {showCartPill && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => navigate('/app/cart')}
            className="fixed left-1/2 -translate-x-1/2 bottom-[76px] md:bottom-6 z-30 w-[calc(100%-2rem)] max-w-md h-13 px-4 rounded-[14px] bg-[var(--color-charcoal)] text-[var(--color-cream)] shadow-warm-lg flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[var(--color-saffron)] text-[var(--color-charcoal)] text-[12px] font-bold flex items-center justify-center shrink-0">
                {itemCount}
              </span>
              <span className="text-[13px] truncate">
                {itemCount === 1 ? '1 item' : `${itemCount} items`} in cart
              </span>
            </span>
            <span className="flex items-center gap-2 shrink-0 text-[14px] font-semibold">
              {rupees(total)}
              <span className="text-[var(--color-saffron)]">View cart</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- bottom nav */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-solid border-t border-[var(--color-beige)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-ink-soft)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon ? (
                    <item.icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
                  ) : (
                    <span
                      className={cx(
                        'w-[19px] h-[19px] rounded-full text-[9px] font-bold flex items-center justify-center',
                        isActive
                          ? 'bg-[var(--color-terracotta)] text-white'
                          : 'bg-[var(--color-beige)] text-[var(--color-ink-muted)]',
                      )}
                    >
                      {initials}
                    </span>
                  )}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
