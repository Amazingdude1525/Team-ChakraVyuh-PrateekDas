import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Vendor } from '../../lib/types';
import CrowdBadge from '../../components/ui/CrowdBadge';
import Spinner from '../../components/ui/Spinner';

const vendorEmojis: Record<string, string> = {
  'Mayuri (AB)': '🍛',
  'Mayuri (Special Block)': '🍜',
  'UnderBelly (UB)': '🍔',
  'Dakshin': '🥘',
  'Bistro Cafe by Safal': '☕',
};

export default function Home() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();

    // Realtime subscription for vendor updates (crowd density, open/closed)
    const channel = supabase
      .channel('vendors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendors' },
        (payload) => {
          setVendors(prev =>
            prev.map(v => v.id === (payload.new as Vendor).id ? payload.new as Vendor : v)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name');

    if (!error && data) {
      setVendors(data as Vendor[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 mb-6 text-white"
      >
        <h2 className="text-lg font-bold mb-1">Hungry? 🍕</h2>
        <p className="text-sm opacity-90">Order from any cafe and skip the line!</p>
      </motion.div>

      {/* Vendor grid */}
      <h2 className="text-base font-bold text-text-primary mb-3">Campus Cafes</h2>

      <div className="space-y-3">
        {vendors.map((vendor, i) => (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/app/vendor/${vendor.id}`)}
            className="bg-white rounded-2xl p-4 shadow-card border border-border-light cursor-pointer hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Vendor emoji/logo */}
              <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-2xl flex-shrink-0">
                {vendor.logo_url ? (
                  <img
                    src={vendor.logo_url}
                    alt={vendor.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  vendorEmojis[vendor.name] || '🍽️'
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-text-primary text-sm truncate">
                    {vendor.name}
                  </h3>
                  {!vendor.is_open && (
                    <span className="text-[10px] font-semibold text-nonveg bg-red-50 px-1.5 py-0.5 rounded">
                      CLOSED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {vendor.location}
                  </span>
                  {vendor.closing_time && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Until {vendor.closing_time.slice(0, 5)}
                    </span>
                  )}
                </div>
              </div>

              {/* Crowd badge */}
              <CrowdBadge activeOrderCount={vendor.active_order_count} />
            </div>
          </motion.div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <span className="text-4xl mb-3 block">🏪</span>
          <p>No cafes available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
