import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, X } from 'lucide-react';
import Header from './Header';
import BottomNav from './BottomNav';
import { supabase } from '../../lib/supabase';

interface AppLayoutProps {
  title?: string;
  showBack?: boolean;
}

export default function AppLayout({ title, showBack }: AppLayoutProps) {
  const navigate = useNavigate();
  const [flashBanner, setFlashBanner] = useState<{
    itemId: string;
    itemName: string;
    vendorId: string;
    vendorName: string;
    discountPercent: number;
  } | null>(null);

  useEffect(() => {
    // Agent O: Realtime listener for flash surplus discount activation
    const channel = supabase
      .channel('flash-discounts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'menu_items',
        },
        async (payload) => {
          const item = payload.new as any;
          if (item.flash_discount_percent > 0) {
            // Fetch vendor name
            const { data: vendorData } = await supabase
              .from('vendors')
              .select('name')
              .eq('id', item.vendor_id)
              .single();

            setFlashBanner({
              itemId: item.id,
              itemName: item.name,
              vendorId: item.vendor_id,
              vendorName: vendorData?.name || 'Cafe',
              discountPercent: item.flash_discount_percent,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header title={title} showBack={showBack} />

      {/* Live Flash Discount Banner */}
      <AnimatePresence>
        {flashBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg mx-auto px-4 pt-2"
          >
            <div
              onClick={() => {
                const vid = flashBanner.vendorId;
                setFlashBanner(null);
                navigate(`/app/vendor/${vid}`);
              }}
              className="bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-xl p-3 shadow-md flex items-center justify-between cursor-pointer hover:brightness-105 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="p-1 bg-white/20 rounded-lg">
                  <Flame size={18} className="animate-bounce" />
                </span>
                <div>
                  <p className="font-bold text-xs">
                    🔥 {flashBanner.discountPercent}% OFF {flashBanner.itemName}!
                  </p>
                  <p className="text-[10px] opacity-90">
                    Active at {flashBanner.vendorName} — Tap to view menu
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFlashBanner(null);
                }}
                className="p-1 hover:bg-white/20 rounded-md cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-lg mx-auto pb-24 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
