import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Order } from '../../lib/types';
import OrderCard from '../../components/order/OrderCard';
import Spinner from '../../components/ui/Spinner';
import { ClipboardList } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      setupRealtime();
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, vendor:vendors(*), order_items(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as any);
    }
    setLoading(false);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('user-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user!.id}`,
        },
        () => {
          // Refetch on any change
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
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const activeOrders = orders.filter(o =>
    ['placed', 'preparing', 'ready', 'pending_sync'].includes(o.status)
  );
  const pastOrders = orders.filter(o =>
    ['completed', 'cancelled_soldout', 'cancelled_other'].includes(o.status)
  );

  return (
    <div className="py-4">
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <ClipboardList size={64} className="text-text-muted/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No orders yet</h2>
          <p className="text-sm text-text-secondary">
            Place your first order from any campus cafe!
          </p>
        </motion.div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Active Orders
              </h2>
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-text-secondary mb-3">
                Past Orders
              </h2>
              <div className="space-y-3">
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
