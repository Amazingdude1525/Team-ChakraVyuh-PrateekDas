import { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MenuItem } from '../../lib/types';
import MenuItemCard from '../../components/menu/MenuItemCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(MenuItem & { vendor_name: string; vendor_id: string })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchItems(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchItems = async (q: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*, vendor:vendors(name)')
      .or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('available', true)
      .limit(20);

    if (data) {
      setResults(
        data.map((item: any) => ({
          ...item,
          vendor_name: item.vendor?.name || '',
          vendor_id: item.vendor_id,
        }))
      );
    }
    setLoading(false);
  };

  return (
    <div className="py-4">
      <div className="relative mb-4">
        <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search across all cafes..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-text-muted text-sm">Searching...</div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <span className="text-3xl mb-2 block">🔍</span>
          <p>No items found for "{query}"</p>
        </div>
      )}

      {!loading && query.length < 2 && (
        <div className="text-center py-12 text-text-muted">
          <span className="text-3xl mb-2 block">🍽️</span>
          <p>Search for any item across all 5 cafes</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map(item => (
          <div key={item.id}>
            <p className="text-[10px] font-semibold text-primary mb-1 px-1">
              {item.vendor_name}
            </p>
            <MenuItemCard
              item={item}
              vendorId={item.vendor_id}
              vendorName={item.vendor_name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
