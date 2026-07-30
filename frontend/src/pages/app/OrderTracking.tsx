import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, MenuItem } from '../../lib/types';
import StatusTracker from '../../components/order/StatusTracker';
import TokenDisplay from '../../components/order/TokenDisplay';
import VegIndicator from '../../components/ui/VegIndicator';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<(OrderItem & { menu_item: MenuItem })[]>([]);
  const [vendorName, setVendorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      setupRealtime();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*, vendor:vendors(*)')
      .eq('id', orderId!)
      .single();

    if (error || !orderData) {
      setLoading(false);
      return;
    }

    setOrder(orderData as any);
    setVendorName((orderData as any).vendor?.name || '');

    // Fetch order items with menu item details
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*, menu_item:menu_items(*)')
      .eq('order_id', orderId!);

    if (itemsData) {
      setOrderItems(itemsData as any);
    }

    setLoading(false);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrder(prev => prev ? { ...prev, ...updated } : null);

          // Show toast on status change
          if (updated.status === 'preparing') {
            toast('🍳 Your order is being prepared!', { icon: '👨‍🍳' });
          } else if (updated.status === 'ready') {
            toast.success('🎉 Your order is ready for pickup!');
          } else if (updated.status === 'completed') {
            toast.success('✅ Order completed. Enjoy your meal!');
          }
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">Order not found</p>
          <button
            onClick={() => navigate('/app/orders')}
            className="mt-4 text-primary font-semibold cursor-pointer"
          >
            View all orders
          </button>
        </div>
      </div>
    );
  }

  const formattedTime = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-strong border-b border-border-light px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/app/orders')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
          <div>
            <h1 className="text-base font-bold text-text-primary">Order Tracking</h1>
            <p className="text-xs text-text-muted">{vendorName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Token display */}
        {order.token_number && (
          <TokenDisplay tokenNumber={order.token_number} vendorName={vendorName} />
        )}

        {/* Status tracker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-card border border-border-light"
        >
          <h3 className="font-bold text-text-primary text-sm mb-4">Order Status</h3>
          <StatusTracker currentStatus={order.status} />
        </motion.div>

        {/* Pickup info */}
        {(order.pickup_window_start || order.status === 'ready') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-crowd-green/10 rounded-2xl p-4 flex items-center gap-3"
          >
            <Clock size={20} className="text-crowd-green" />
            <div>
              <p className="font-semibold text-text-primary text-sm">
                {order.status === 'ready' ? 'Ready for pickup!' : 'Estimated pickup'}
              </p>
              {order.pickup_window_start && (
                <p className="text-xs text-text-secondary">
                  {new Date(order.pickup_window_start).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {order.pickup_window_end && ` - ${new Date(order.pickup_window_end).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Order details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-4 shadow-card border border-border-light"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-text-primary text-sm">Order Details</h3>
            <span className="text-xs text-text-muted">Placed at {formattedTime}</span>
          </div>

          <div className="space-y-3">
            {orderItems.map(item => (
              <div key={item.id} className="flex items-start gap-2.5">
                <VegIndicator veg={item.menu_item?.veg ?? true} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item.menu_item?.name || 'Item'}
                  </p>
                  <p className="text-xs text-text-muted capitalize">
                    {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  ₹{Math.round(item.price_at_order * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border-light mt-3 pt-3">
            <div className="flex justify-between">
              <span className="font-bold text-text-primary">Total</span>
              <span className="font-bold text-text-primary">₹{order.total_amount}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
