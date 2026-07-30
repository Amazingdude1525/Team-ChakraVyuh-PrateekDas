import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, MenuItem, PrepStatus } from '../../lib/types';
import toast from 'react-hot-toast';

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
};

// ============ URGENCY CONFIG ============
const URGENCY_THRESHOLDS = {
  GREEN_MAX: 5 * 60,    // 0-5 min = green
  AMBER_MAX: 10 * 60,   // 5-10 min = amber
};

function getUrgencyLevel(elapsedSeconds: number): 'green' | 'amber' | 'red' {
  if (elapsedSeconds <= URGENCY_THRESHOLDS.GREEN_MAX) return 'green';
  if (elapsedSeconds <= URGENCY_THRESHOLDS.AMBER_MAX) return 'amber';
  return 'red';
}

const URGENCY_STYLES = {
  green: {
    border: 'border-emerald-400/60',
    bg: 'bg-emerald-50/40',
    glow: '',
    timer: 'text-emerald-600',
  },
  amber: {
    border: 'border-amber-400',
    bg: 'bg-amber-50/50',
    glow: '',
    timer: 'text-amber-600',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-50/50',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    timer: 'text-red-600',
  },
};

// Prep status visuals
const PREP_STYLES: Record<PrepStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'PENDING' },
  in_prep: { bg: 'bg-amber-400', text: 'text-white', label: 'IN PREP' },
  done: { bg: 'bg-emerald-500', text: 'text-white', label: 'DONE' },
};

const PREP_FLOW: PrepStatus[] = ['pending', 'in_prep', 'done'];

function getNextPrepStatus(current: PrepStatus): PrepStatus | null {
  const idx = PREP_FLOW.indexOf(current);
  return idx >= 0 && idx < PREP_FLOW.length - 1 ? PREP_FLOW[idx + 1] : null;
}

// ============ LIVE ELAPSED TIMER ============
function ElapsedTimer({ createdAt, className = '' }: { createdAt: string; className?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    setElapsed(calc());
    const interval = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className={`font-mono font-bold tabular-nums ${className}`}>
      {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

// ============ MAIN KDS COMPONENT ============
export default function Kitchen() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [, setTick] = useState(0); // for urgency re-renders

  const channelRef = useRef<any>(null);

  // ============ DATA ============
  const fetchVendor = useCallback(async () => {
    const { data } = await supabase.from('vendors').select('name').eq('id', vendorId!).single();
    if (data) setVendorName(data.name);
  }, [vendorId]);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_item:menu_items(*))')
      .eq('vendor_id', vendorId!)
      .in('status', ['placed', 'preparing'])
      .order('created_at', { ascending: true });
    if (data) setOrders(data as any);
    setLoading(false);
  }, [vendorId]);

  // ============ REALTIME + URGENCY TICKER ============
  useEffect(() => {
    if (!vendorId) return;

    fetchVendor();
    fetchOrders();

    const channel = supabase
      .channel(`kds-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Re-render every 10s to update urgency colors
    const urgencyTicker = setInterval(() => setTick(t => t + 1), 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(urgencyTicker);
    };
  }, [vendorId, fetchVendor, fetchOrders]);

  // ============ PER-ITEM PREP STATUS UPDATE ============
  const advancePrepStatus = async (orderItemId: string, currentStatus: PrepStatus) => {
    const next = getNextPrepStatus(currentStatus);
    if (!next) return;

    const { error } = await supabase
      .from('order_items')
      .update({ prep_status: next })
      .eq('id', orderItemId);

    if (error) {
      toast.error('Failed to update prep status');
    } else {
      // Optimistic update
      setOrders(prev => prev.map(o => ({
        ...o,
        order_items: o.order_items.map(oi =>
          oi.id === orderItemId ? { ...oi, prep_status: next } : oi
        ),
      })) as OrderWithItems[]);
    }
  };

  // ============ SORT BY URGENCY (oldest first) ============
  const sortedOrders = [...orders].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // ============ SUMMARY STATS ============
  const urgentCount = sortedOrders.filter(o => {
    const elapsed = (Date.now() - new Date(o.created_at).getTime()) / 1000;
    return elapsed > URGENCY_THRESHOLDS.AMBER_MAX;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ============ RECONNECTION BANNER ============ */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-3 text-base font-bold flex items-center justify-center gap-2"
          >
            <WifiOff size={20} /> Reconnecting to live orders...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ HEADER — always visible summary strip ============ */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/select-role')} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-800 tracking-tight">
                🍳 KITCHEN — {vendorName}
              </h1>
            </div>
          </div>

          {/* Summary strip */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 bg-gray-100 rounded-xl px-5 py-2">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{sortedOrders.length}</p>
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
            <button onClick={fetchOrders} className="p-2.5 rounded-lg hover:bg-gray-100 cursor-pointer">
              <RefreshCw size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ ORDER GRID ============ */}
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {sortedOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <span className="text-7xl mb-6 block">👨‍🍳</span>
              <h2 className="text-2xl font-black text-gray-400 mb-2">All clear!</h2>
              <p className="text-base text-gray-400">Waiting for new orders...</p>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {sortedOrders.map(order => {
                const elapsedSec = (Date.now() - new Date(order.created_at).getTime()) / 1000;
                const urgency = getUrgencyLevel(elapsedSec);
                const styles = URGENCY_STYLES[urgency];
                const allDone = order.order_items.every(oi => oi.prep_status === 'done');

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{
                      opacity: 1, scale: 1, y: 0,
                      ...(urgency === 'red' ? {
                        // subtle pulse for urgent orders
                        boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 15px rgba(239,68,68,0.2)', '0 0 0px rgba(239,68,68,0)'],
                      } : {}),
                    }}
                    exit={{ opacity: 0, scale: 0.85, y: -20 }}
                    transition={{
                      layout: { type: 'spring', damping: 20 },
                      ...(urgency === 'red' ? {
                        boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                      } : {}),
                    }}
                    className={`rounded-2xl border-2 ${styles.border} ${styles.bg} ${styles.glow} p-4 flex flex-col`}
                  >
                    {/* Token + Timer */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black text-gray-800 tracking-tight">
                        #{order.token_number || '—'}
                      </span>
                      <ElapsedTimer createdAt={order.created_at} className={`text-xl ${styles.timer}`} />
                    </div>

                    {/* Items — large font for distance viewing */}
                    <div className="flex-1 space-y-2">
                      {order.order_items.map(item => {
                        const prep = item.prep_status || 'pending';
                        const prepStyle = PREP_STYLES[prep];
                        const nextPrep = getNextPrepStatus(prep);

                        return (
                          <button
                            key={item.id}
                            onClick={() => nextPrep && advancePrepStatus(item.id, prep)}
                            disabled={!nextPrep}
                            className={`w-full text-left rounded-xl p-3 transition-all flex items-center gap-3 ${
                              nextPrep ? 'cursor-pointer hover:brightness-95 active:scale-[0.98]' : 'cursor-default'
                            } ${prep === 'done' ? 'opacity-50' : ''}`}
                            style={{
                              backgroundColor: prep === 'pending' ? '#f3f4f6'
                                : prep === 'in_prep' ? '#fef3c7'
                                : '#d1fae5',
                            }}
                          >
                            {/* Veg indicator */}
                            <div
                              className="w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: item.menu_item?.veg ? '#0F8A0F' : '#E23744' }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.menu_item?.veg ? '#0F8A0F' : '#E23744' }}
                              />
                            </div>

                            {/* Item name — LARGE for distance */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-base font-bold truncate ${prep === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {item.menu_item?.name || 'Item'}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {item.size} × {item.quantity}
                              </p>
                            </div>

                            {/* Prep badge — large tap target */}
                            <span className={`${prepStyle.bg} ${prepStyle.text} px-3 py-1.5 rounded-lg text-xs font-black tracking-wider flex-shrink-0`}>
                              {prepStyle.label}
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
                          ✅ All items done — auto-moving to READY
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
