import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { motion } from 'motion/react';

const navItems = [
  { to: '/app', icon: Home, label: 'Home' },
  { to: '/app/search', icon: Search, label: 'Search' },
  { to: '/app/cart', icon: ShoppingBag, label: 'Cart' },
  { to: '/app/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/app/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border-light">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to ||
            (to === '/app' && location.pathname === '/app') ||
            (to !== '/app' && location.pathname.startsWith(to));

          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={`transition-colors ${isActive ? 'text-primary' : 'text-text-muted'}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {label === 'Cart' && itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-text-muted'}`}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
