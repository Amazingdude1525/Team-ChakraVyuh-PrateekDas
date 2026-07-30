import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, MenuItem } from '../../lib/types';
import VegIndicator from '../../components/ui/VegIndicator';
import Spinner from '../../components/ui/Spinner';

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
};

export default function Kitchen() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState('');

  useEffect(() => {
    if (vendorId) {
      fetchVendor();
      fetchOrders();
      setupRealtime();
    }
  }, [vendorId]);

  const fetchVendor = async () => {
    const { data } = await supabase
      .from('vendors')
      .select('name')
      .eq('id', vendorId!)
      .single();
    if (data) setVendorName(data.name);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_item:menu_items(*))')
      .eq('vendor_id', vendorId!)
      .in('status', ['placed', 'preparing'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data as any);
    }
    setLoading(false);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`kitchen-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/select-role')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold">Kitchen Display</h1>
              <p className="text-xs opacity-60">{vendorName} • {orders.length} active orders</p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Orders grid */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {orders.map(order => {
              const time = new Date(order.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isPreparing = order.status === 'preparing';

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`rounded-2xl p-4 border-2 ${
                    isPreparing
                      ? 'bg-amber-900/30 border-amber-500/50'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-2xl font-black ${isPreparing ? 'text-amber-400' : 'text-white'}`}>
                      #{order.token_number || '—'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs opacity-60">
                      <Clock size={12} />
                      <span>{time}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.order_items.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <VegIndicator veg={item.menu_item?.veg ?? true} size="sm" />
                        <span className="flex-1 text-sm truncate">
                          {item.menu_item?.name || 'Item'}
                        </span>
                        <span className="text-xs opacity-60 capitalize">{item.size}</span>
                        <span className="font-bold text-sm">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isPreparing
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {isPreparing ? '🍳 PREPARING' : '📥 NEW ORDER'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <span className="text-6xl mb-4 block">👨‍🍳</span>
            <p className="text-xl">No active orders</p>
            <p className="text-sm mt-1">Waiting for new orders...</p>
          </div>
        )}
      </div>
    </div>
  );
}
