import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Vendor, MenuItem } from '../../lib/types';
import CategorySection from '../../components/menu/CategorySection';
import Spinner from '../../components/ui/Spinner';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import CrowdBadge from '../../components/ui/CrowdBadge';
import { useCart } from '../../contexts/CartContext';

export default function VendorMenu() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { itemCount, total, vendorId: cartVendorId } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const categoryNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  const fetchVendorData = async () => {
    const [vendorRes, itemsRes] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId!).single(),
      supabase.from('menu_items').select('*').eq('vendor_id', vendorId!).order('category').order('name'),
    ]);

    if (vendorRes.data) setVendor(vendorRes.data as Vendor);
    if (itemsRes.data) setItems(itemsRes.data as MenuItem[]);
    setLoading(false);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (vegOnly && !item.veg) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by category
  const categories = filteredItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryList = Object.keys(categories);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = document.getElementById(`cat-${cat.replace(/\s+/g, '-').toLowerCase()}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Menu" showBack />
        <div className="flex items-center justify-center py-20"><Spinner /></div>
        <BottomNav />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Menu" showBack />
        <div className="text-center py-20 text-text-muted">Vendor not found</div>
        <BottomNav />
      </div>
    );
  }

  const showCartBar = itemCount > 0 && cartVendorId === vendorId;

  return (
    <div className="min-h-screen bg-background pb-36">
      <Header title={vendor.name} showBack />

      {/* Vendor info banner */}
      <div className="px-4 py-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-text-muted">{vendor.location}</p>
            {!vendor.is_open && (
              <span className="text-xs font-semibold text-nonveg">Currently Closed</span>
            )}
          </div>
          <CrowdBadge activeOrderCount={vendor.active_order_count} />
        </motion.div>
      </div>

      {/* Search + Veg toggle */}
      <div className="px-4 mb-3 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              vegOnly
                ? 'bg-veg text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <div className="w-3 h-3 border-2 border-current rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
            Veg Only
          </button>
          <span className="text-xs text-text-muted">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Category tabs */}
      {categoryList.length > 1 && (
        <div
          ref={categoryNavRef}
          className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar"
        >
          {categoryList.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary border border-border-light hover:border-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div className="px-4">
        {categoryList.map(cat => (
          <CategorySection
            key={cat}
            category={cat}
            items={categories[cat]}
            vendorId={vendor.id}
            vendorName={vendor.name}
          />
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <span className="text-3xl mb-2 block">🔍</span>
            <p>No items found</p>
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {showCartBar && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2"
        >
          <button
            onClick={() => window.location.href = '/app/cart'}
            className="w-full max-w-lg mx-auto flex items-center justify-between bg-primary text-white px-5 py-3.5 rounded-2xl shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-bold">
                {itemCount}
              </span>
              <span className="font-semibold text-sm">
                {itemCount} item{itemCount > 1 ? 's' : ''} added
              </span>
            </div>
            <span className="font-bold">
              View Cart • ₹{Math.round(total)}
            </span>
          </button>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
}
