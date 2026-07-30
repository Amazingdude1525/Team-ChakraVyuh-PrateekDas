import { useState } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ItemReviewButtonProps {
  orderId: string;
  menuItemId: string;
  userId: string;
  initialLiked?: boolean | null;
}

export default function ItemReviewButton({
  orderId,
  menuItemId,
  userId,
  initialLiked = null,
}: ItemReviewButtonProps) {
  const [liked, setLiked] = useState<boolean | null>(initialLiked);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = async (isLike: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newStatus = liked === isLike ? null : isLike;

    if (newStatus === null) {
      // Remove review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('order_id', orderId)
        .eq('menu_item_id', menuItemId)
        .eq('user_id', userId);

      if (!error) setLiked(null);
    } else {
      // Upsert review
      const { error } = await supabase
        .from('reviews')
        .upsert(
          {
            order_id: orderId,
            menu_item_id: menuItemId,
            user_id: userId,
            liked: isLike,
          },
          { onConflict: 'order_id,menu_item_id' }
        );

      if (error) {
        toast.error('Review failed: Only completed orders can be reviewed!');
      } else {
        setLiked(isLike);
        toast.success(isLike ? 'Thanks for liking! 👍' : 'Feedback recorded 👎');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-border-light">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleReview(true)}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          liked === true ? 'bg-veg text-white shadow-xs' : 'text-text-muted hover:text-veg'
        }`}
        title="Like item"
      >
        <ThumbsUp size={14} />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleReview(false)}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          liked === false ? 'bg-nonveg text-white shadow-xs' : 'text-text-muted hover:text-nonveg'
        }`}
        title="Dislike item"
      >
        <ThumbsDown size={14} />
      </motion.button>
    </div>
  );
}
