import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateTokenNumber } from '../../lib/constants';
import VegIndicator from '../../components/ui/VegIndicator';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const { items, vendorName, vendorId, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user || !vendorId || items.length === 0) return;

    setIsProcessing(true);

    try {
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKeyId || razorpayKeyId === 'rzp_test_your_key_here') {
        // No Razorpay key — place order directly for demo
        await placeOrder();
        return;
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: razorpayKeyId,
          amount: Math.round(total * 100), // paise
          currency: 'INR',
          name: 'VITeBites',
          description: `Order from ${vendorName}`,
          handler: async (response: any) => {
            // Payment successful — place order
            await placeOrder(response.razorpay_payment_id);
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: '#F5A623',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        toast.error('Failed to load payment gateway');
        setIsProcessing(false);
      };
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Checkout failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const placeOrder = async (paymentId?: string) => {
    try {
      // Get current order count for token generation
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId!);

      const tokenNumber = generateTokenNumber(vendorName || '', count || 0);

      // Agent L: Calculate 5-minute batch pickup window
      const activeCount = count || 0;
      const basePrepMinutes = 8 + (activeCount * 2);
      const now = new Date();

      // Round to nearest 5-minute slot
      const pickupStart = new Date(now.getTime() + basePrepMinutes * 60 * 1000);
      const remainderMinutes = pickupStart.getMinutes() % 5;
      if (remainderMinutes !== 0) {
        pickupStart.setMinutes(pickupStart.getMinutes() + (5 - remainderMinutes));
      }
      pickupStart.setSeconds(0, 0);

      const pickupEnd = new Date(pickupStart.getTime() + 5 * 60 * 1000);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          vendor_id: vendorId!,
          status: 'placed',
          token_number: tokenNumber,
          pickup_window_start: pickupStart.toISOString(),
          pickup_window_end: pickupEnd.toISOString(),
          payment_status: paymentId ? 'authorized' : 'authorized',
          razorpay_order_id: paymentId || null,
          total_amount: Math.round(total),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item.id,
        size: item.size,
        quantity: item.quantity,
        price_at_order: item.size === 'half' && item.menu_item.price_half
          ? item.menu_item.price_half
          : item.menu_item.price_full,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Increment vendor active order count
      try {
        await (supabase as any).rpc('increment_active_orders', { vid: vendorId! });
      } catch {
        await supabase
          .from('vendors')
          .update({ active_order_count: (count || 0) + 1 })
          .eq('id', vendorId!);
      }

      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/app/order/${order.id}`);
    } catch (err) {
      console.error('Error placing order:', err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <ShoppingBag size={64} className="text-text-muted/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">Your cart is empty</h2>
          <p className="text-sm text-text-secondary mb-6">
            Add items from any campus cafe to get started
          </p>
          <Button onClick={() => navigate('/app')} variant="secondary">
            Browse Cafes
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Vendor info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h2 className="text-base font-bold text-text-primary">{vendorName}</h2>
          <p className="text-xs text-text-muted">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            toast.success('Cart cleared');
          }}
          className="text-xs text-nonveg font-semibold hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </motion.div>

      {/* Cart items */}
      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {items.map(item => {
            const price = item.size === 'half' && item.menu_item.price_half
              ? item.menu_item.price_half
              : item.menu_item.price_full;

            return (
              <motion.div
                key={`${item.menu_item.id}-${item.size}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="bg-white rounded-xl p-3.5 shadow-card border border-border-light"
              >
                <div className="flex items-start gap-3">
                  <VegIndicator veg={item.menu_item.veg} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary text-sm truncate">
                      {item.menu_item.name}
                    </h3>
                    <p className="text-xs text-text-muted capitalize">{item.size}</p>
                    <p className="font-bold text-text-primary text-sm mt-1">
                      ₹{Math.round(price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.menu_item.id, item.size, item.quantity - 1)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"
                      >
                        <Minus size={14} className="text-text-secondary" />
                      </button>
                      <span className="px-2 text-sm font-bold text-text-primary min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menu_item.id, item.size, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"
                      >
                        <Plus size={14} className="text-text-secondary" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.menu_item.id, item.size)}
                      className="p-1.5 text-text-muted hover:text-nonveg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bill summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 shadow-card border border-border-light mb-4"
      >
        <h3 className="font-bold text-text-primary text-sm mb-3">Bill Summary</h3>
        <div className="space-y-2 text-sm">
          {items.map(item => {
            const price = item.size === 'half' && item.menu_item.price_half
              ? item.menu_item.price_half
              : item.menu_item.price_full;
            return (
              <div key={`${item.menu_item.id}-${item.size}`} className="flex justify-between text-text-secondary">
                <span className="truncate mr-2">
                  {item.menu_item.name} ({item.size}) × {item.quantity}
                </span>
                <span className="flex-shrink-0">₹{Math.round(price * item.quantity)}</span>
              </div>
            );
          })}
          <div className="border-t border-border-light pt-2 mt-2">
            <div className="flex justify-between font-bold text-text-primary">
              <span>Total</span>
              <span>₹{Math.round(total)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Checkout button */}
      <Button
        onClick={handleCheckout}
        className="w-full"
        size="lg"
        isLoading={isProcessing}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay ₹${Math.round(total)}`}
        {!isProcessing && <ArrowRight size={20} />}
      </Button>
    </div>
  );
}
