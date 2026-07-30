import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { OrderStatus } from '../../lib/types';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../lib/constants';

interface StatusTrackerProps {
  currentStatus: OrderStatus;
}

export default function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const isCancelled = currentStatus.startsWith('cancelled');
  const isPending = currentStatus === 'pending_sync';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-nonveg/10 flex items-center justify-center">
          <span className="text-nonveg text-lg">✕</span>
        </div>
        <div>
          <p className="font-semibold text-nonveg text-sm">
            {ORDER_STATUS_LABELS[currentStatus]}
          </p>
          <p className="text-xs text-text-muted">
            {currentStatus === 'cancelled_soldout'
              ? 'Some items were sold out. Refund will be processed.'
              : 'Order was cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center animate-pulse">
          <span className="text-text-muted text-sm">⏳</span>
        </div>
        <div>
          <p className="font-semibold text-text-secondary text-sm">Syncing Order...</p>
          <p className="text-xs text-text-muted">Waiting for network connection</p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between px-2">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-crowd-green text-white'
                    : isCurrent
                      ? 'text-white shadow-lg'
                      : 'bg-gray-200 text-text-muted'
                }`}
                style={
                  isCurrent
                    ? { backgroundColor: ORDER_STATUS_COLORS[status] }
                    : undefined
                }
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <span
                className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${
                  isCurrent ? 'text-text-primary font-bold' : 'text-text-muted'
                }`}
              >
                {ORDER_STATUS_LABELS[status]}
              </span>
            </div>

            {/* Connector line */}
            {index < ORDER_STATUS_FLOW.length - 1 && (
              <div className="flex-1 mx-1 h-0.5 rounded-full overflow-hidden bg-gray-200">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : isCurrent ? '50%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-crowd-green rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
