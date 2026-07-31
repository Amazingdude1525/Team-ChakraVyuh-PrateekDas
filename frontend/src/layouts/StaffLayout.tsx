import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart3,
  ChefHat,
  LayoutGrid,
  LogOut,
  Monitor,
  Tag,
  UtensilsCrossed,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button, Chip, Switch } from '../components/ui/primitives';
import { CafeMark } from '../components/student/cards';
import { useBranch, useTick } from '../hooks';
import { useStore } from '../store/useStore';
import { cx, isBranchOpen } from '../utils';
import NotFound from '../pages/public/NotFound';

/**
 * Staff shell for the counter-side screens.
 *
 * The kitchen display deliberately does not use this — it runs full-bleed with
 * no chrome, because it is read from across the room.
 */

const TABS = [
  { to: 'counter', label: 'Counter', icon: LayoutGrid },
  { to: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { to: 'insights', label: 'Insights', icon: BarChart3 },
  { to: 'discounts', label: 'Deals', icon: Tag },
];

export default function StaffLayout() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const now = useTick(1000);

  const branch = useBranch(cafeId);
  const vendor = useStore((s) => s.vendor);
  const setBranchOpen = useStore((s) => s.setBranchOpen);
  const signOut = useStore((s) => s.signOut);

  /** Simulated connection state — staff must never silently miss an order. */
  const [connected, setConnected] = useState(true);

  // Reconnect on its own, the way a dropped socket would.
  useEffect(() => {
    if (connected) return;
    const t = setTimeout(() => {
      setConnected(true);
      toast.success('Reconnected — order feed is live again');
    }, 4000);
    return () => clearTimeout(t);
  }, [connected]);

  if (!branch) return <NotFound />;

  const open = isBranchOpen(branch);
  const clock = new Date(now).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-ivory)]">
      {/* Reconnecting banner */}
      {!connected && (
        <div className="bg-[var(--color-wine)] text-white text-[13px] py-2 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff size={14} />
          Reconnecting to the order feed — new orders may be delayed
        </div>
      )}

      {/* ------------------------------------------------------------ header */}
      <header className="sticky top-0 z-30 glass-solid border-b border-[var(--color-beige)]">
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CafeMark branch={branch} size={40} />
            <div className="min-w-0">
              <h1 className="text-[14.5px] font-semibold text-[var(--color-charcoal)] truncate leading-tight">
                {branch.name}
              </h1>
              <p className="text-[11.5px] text-[var(--color-ink-soft)] truncate">
                {vendor?.name ?? 'Counter staff'} · {branch.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Open / closed */}
            <div className="hidden sm:block w-[168px]">
              <Switch
                checked={branch.isOpen}
                onChange={(v) => {
                  setBranchOpen(branch.id, v);
                  toast.success(v ? 'Counter marked open' : 'Counter marked closed');
                }}
                label={branch.isOpen ? 'Taking orders' : 'Closed'}
              />
            </div>

            <Chip tone={open ? 'veg' : 'wine'} className="sm:hidden">
              {open ? 'Open' : 'Closed'}
            </Chip>

            {/* Connection */}
            <button
              type="button"
              onClick={() => {
                setConnected(false);
                toast('Simulating a dropped connection');
              }}
              title={connected ? 'Simulate a dropped connection' : 'Reconnecting'}
              aria-label="Connection status"
              className={cx(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                connected
                  ? 'text-[var(--color-veg)] hover:bg-[var(--color-veg-tint)]'
                  : 'text-[var(--color-wine)] bg-[var(--color-wine-tint)]',
              )}
            >
              {connected ? <Wifi size={17} /> : <WifiOff size={17} />}
            </button>

            <span className="hidden md:block text-[13px] tabular-nums text-[var(--color-ink-muted)] font-medium">
              {clock}
            </span>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/staff/${branch.id}/kitchen`)}
            >
              <Monitor size={15} />
              <span className="hidden sm:inline">Kitchen</span>
            </Button>

            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/', { replace: true });
              }}
              aria-label="Sign out"
              title="Sign out"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-soft)] hover:bg-[var(--color-sand)] hover:text-[var(--color-charcoal)] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="px-3 sm:px-5 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={`/staff/${branch.id}/${tab.to}`}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2 px-3.5 h-10 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-[var(--color-saffron)] text-[var(--color-charcoal)]'
                    : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-charcoal)]',
                )
              }
            >
              <tab.icon size={15} />
              {tab.label}
            </NavLink>
          ))}

          <NavLink
            to={`/staff/${branch.id}/kitchen`}
            className="flex items-center gap-2 px-3.5 h-10 text-[13px] font-medium border-b-2 border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-charcoal)] transition-colors whitespace-nowrap ml-auto"
          >
            <ChefHat size={15} />
            Kitchen display
          </NavLink>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet context={{ connected }} />
      </main>
    </div>
  );
}
