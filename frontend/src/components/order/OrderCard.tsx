import { motion } from 'motion/react';
import { Clock, ChevronRight } from 'lucide-react';
import type { Order } from '../../lib/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../lib/constants';
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();
  const isActive = ['placed', 'preparing', 'ready', 'pending_sync'].includes(order.status);

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate(`/app/order/${order.id}`)}
      className={`bg-white rounded-2xl p-4 shadow-card border cursor-pointer transition-all ${
        isActive ? 'border-primary/30' : 'border-border-light'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-text-primary text-sm">
            {order.vendor?.name || 'Order'}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
            <Clock size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: ORDER_STATUS_COLORS[order.status] + '15',
              color: ORDER_STATUS_COLORS[order.status],
            }}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <ChevronRight size={16} className="text-text-muted" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {order.token_number && (
            <span className="bg-primary/10 text-primary font-bold text-sm px-2.5 py-1 rounded-lg">
              #{order.token_number}
            </span>
          )}
          {order.order_items && (
            <span className="text-xs text-text-muted">
              {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="font-bold text-text-primary">₹{order.total_amount}</span>
      </div>

      {isActive && (
        <motion.div
          className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] }}
            initial={{ width: '0%' }}
            animate={{
              width: order.status === 'placed' ? '25%'
                : order.status === 'preparing' ? '50%'
                : order.status === 'ready' ? '75%'
                : '10%',
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
