import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChefHat, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, MenuItem } from '../../lib/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../lib/constants';
import VegIndicator from '../../components/ui/VegIndicator';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
};

export default function Counter() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [activeTab, setActiveTab] = useState<'placed' | 'preparing' | 'ready' | 'completed'>('placed');

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
      .in('status', ['placed', 'preparing', 'ready', 'completed'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data as any);
    }
    setLoading(false);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`counter-${vendorId}`)
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Order moved to ${ORDER_STATUS_LABELS[newStatus as keyof typeof ORDER_STATUS_LABELS]}`);
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const statusTabs = [
    { key: 'placed', label: 'New', count: orders.filter(o => o.status === 'placed').length },
    { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
    { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
    { key: 'completed', label: 'Done', count: orders.filter(o => o.status === 'completed').length },
  ] as const;

  const getNextStatus = (current: string): string | null => {
    const flow = ['placed', 'preparing', 'ready', 'completed'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-primary text-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/select-role')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold">Counter Panel</h1>
              <p className="text-xs opacity-80">{vendorName}</p>
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

      <div className="max-w-4xl mx-auto">
        {/* Status tabs */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-text-secondary border border-border-light hover:border-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        <div className="px-4 pb-8 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map(order => {
              const nextStatus = getNextStatus(order.status);
              const time = new Date(order.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-4 shadow-card border border-border-light"
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary text-white font-bold text-lg px-3 py-1 rounded-xl">
                        #{order.token_number || '—'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Clock size={12} />
                          <span>{time}</span>
                        </div>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: ORDER_STATUS_COLORS[order.status] + '15',
                            color: ORDER_STATUS_COLORS[order.status],
                          }}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-text-primary text-lg">
                      ₹{order.total_amount}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 mb-4">
                    {order.order_items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <VegIndicator veg={item.menu_item?.veg ?? true} size="sm" />
                        <span className="flex-1 text-text-primary truncate">
                          {item.menu_item?.name || 'Item'}
                        </span>
                        <span className="text-text-muted capitalize text-xs">
                          {item.size}
                        </span>
                        <span className="font-semibold text-text-primary">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {nextStatus && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                      >
                        {nextStatus === 'preparing' && <ChefHat size={16} />}
                        {nextStatus === 'ready' && <CheckCircle2 size={16} />}
                        {nextStatus === 'completed' && <CheckCircle2 size={16} />}
                        Move to {ORDER_STATUS_LABELS[nextStatus as keyof typeof ORDER_STATUS_LABELS]}
                      </Button>
                    )}
                    {order.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateOrderStatus(order.id, 'cancelled_other')}
                        className="text-nonveg hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <span className="text-3xl mb-2 block">📋</span>
              <p>No {activeTab} orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
