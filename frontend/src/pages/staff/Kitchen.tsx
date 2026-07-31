import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowLeft, Expand, Minimize } from 'lucide-react';
import { useBranch, useTick } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, minutesSince } from '../../utils';
import type { ItemPrepState, Order } from '../../types';

const PREP_FLOW: ItemPrepState[] = ['pending', 'in_prep', 'done'];

function nextPrep(current: ItemPrepState): ItemPrepState | null {
  const idx = PREP_FLOW.indexOf(current);
  return idx >= 0 && idx < PREP_FLOW.length - 1 ? PREP_FLOW[idx + 1] : null;
}

const PREP_STYLES: Record<ItemPrepState, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'PENDING' },
  in_prep: { bg: 'bg-amber-400', text: 'text-white', label: 'IN PREP' },
  done: { bg: 'bg-emerald-500', text: 'text-white', label: 'DONE' },
};

function urgencyLevel(mins: number): 'green' | 'amber' | 'red' {
  if (mins <= 5) return 'green';
  if (mins <= 10) return 'amber';
  return 'red';
}

const URGENCY_BORDER: Record<string, string> = {
  green: 'border-emerald-400/60',
  amber: 'border-amber-400',
  red: 'border-red-500',
};
const URGENCY_BG: Record<string, string> = {
  green: 'bg-emerald-50/40',
  amber: 'bg-amber-50/50',
  red: 'bg-red-50/50',
};
const URGENCY_TIMER: Record<string, string> = {
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
};

function ElapsedTimer({ iso }: { iso: string }) {
  useTick(1000);
  const totalSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const urgency = urgencyLevel(m);

  return (
    <span className={cx('font-mono font-black tabular-nums text-2xl', URGENCY_TIMER[urgency])}>
      {m}:{String(s).padStart(2, '0')}
    </span>
  );
}

export default function StaffKitchen() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const branch = useBranch(cafeId);
  useTick(10000); // urgency re-render

  const orders = useStore((s) => s.orders);
  const setItemPrepState = useStore((s) => s.setItemPrepState);
  const setOrderStatus = useStore((s) => s.setOrderStatus);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeOrders = useMemo(
    () =>
      orders
        .filter((o) => o.branchId === cafeId && (o.status === 'placed' || o.status === 'preparing'))
        .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()),
    [orders, cafeId],
  );

  const urgentCount = useMemo(
    () => activeOrders.filter((o) => minutesSince(o.placedAt) > 10).length,
    [activeOrders],
  );

  function handleItemTap(order: Order, itemIndex: number) {
    const item = order.items[itemIndex];
    const next = nextPrep(item.prepState);
    if (!next) return;

    setItemPrepState(order.id, itemIndex, next);

    // If the order was 'placed' and a cook starts work, move it to 'preparing'.
    if (order.status === 'placed' && next === 'in_prep') {
      setOrderStatus(order.id, 'preparing');
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  if (!branch) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — compact, high-contrast */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(`/staff/${cafeId}/counter`)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-800 tracking-tight">
                🍳 KITCHEN — {branch.shortName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 bg-gray-100 rounded-xl px-5 py-2">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{activeOrders.length}</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Active</p>
              </div>
              {urgentCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-black text-red-600 flex items-center gap-1">
                    <AlertTriangle size={18} /> {urgentCount}
                  </p>
                  <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Urgent</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-lg hover:bg-gray-100"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize size={20} className="text-gray-500" /> : <Expand size={20} className="text-gray-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Order grid */}
      <div className="flex-1 p-4 max-w-[1800px] mx-auto w-full">
        {activeOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <span className="text-7xl mb-6 block">👨‍🍳</span>
              <h2 className="text-2xl font-black text-gray-400 mb-2">All clear!</h2>
              <p className="text-base text-gray-400">Waiting for new orders…</p>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {activeOrders.map((order) => {
                const mins = minutesSince(order.placedAt);
                const urgency = urgencyLevel(mins);
                const allDone = order.items.every((it) => it.prepState === 'done');

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -20 }}
                    transition={{ layout: { type: 'spring', damping: 20 } }}
                    className={cx(
                      'rounded-2xl border-2 p-4 flex flex-col',
                      URGENCY_BORDER[urgency],
                      URGENCY_BG[urgency],
                      urgency === 'red' && 'pulse-urgent',
                    )}
                  >
                    {/* Token + timer */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-3xl font-black text-gray-800 tracking-tight">
                          {order.token}
                        </span>
                        {order.headingOver && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded mt-0.5 inline-block ml-2">
                            🚶 On the way!
                          </div>
                        )}
                      </div>
                      <ElapsedTimer iso={order.placedAt} />
                    </div>

                    {/* Items — large for distance */}
                    <div className="flex-1 space-y-2">
                      {order.items.map((item, idx) => {
                        const prep = item.prepState;
                        const style = PREP_STYLES[prep];
                        const hasNext = !!nextPrep(prep);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleItemTap(order, idx)}
                            disabled={!hasNext}
                            className={cx(
                              'w-full text-left rounded-xl p-3 transition-all flex items-center gap-3',
                              hasNext ? 'cursor-pointer hover:brightness-95 active:scale-[0.98]' : 'cursor-default',
                              prep === 'done' && 'opacity-50',
                              prep === 'pending' ? 'bg-gray-100' : prep === 'in_prep' ? 'bg-amber-50' : 'bg-emerald-50',
                            )}
                          >
                            {/* Veg indicator */}
                            <span
                              className={cx(
                                'diet-mark',
                                item.diet === 'nonveg' ? 'diet-mark-nonveg border-[var(--color-nonveg)] text-[var(--color-nonveg)]' :
                                item.diet === 'egg' ? 'border-[var(--color-egg)] text-[var(--color-egg)]' :
                                'border-[var(--color-veg)] text-[var(--color-veg)]',
                              )}
                            />

                            <div className="flex-1 min-w-0">
                              <p className={cx(
                                'text-base font-bold truncate',
                                prep === 'done' ? 'line-through text-gray-400' : 'text-gray-800',
                              )}>
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.variantLabel} × {item.quantity}
                              </p>
                            </div>

                            <span className={cx(
                              'px-3 py-1.5 rounded-lg text-xs font-black tracking-wider shrink-0',
                              style.bg, style.text,
                            )}>
                              {style.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Auto-ready indicator */}
                    {allDone && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 pt-3 border-t border-gray-200 text-center"
                      >
                        <span className="text-sm font-bold text-emerald-600">
                          ✅ All items done — moved to READY
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
