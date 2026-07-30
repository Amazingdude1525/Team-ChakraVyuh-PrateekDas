import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X } from 'lucide-react';
import { askAI } from '../../lib/ai';
import type { MenuItem } from '../../lib/types';

interface AIStockQueryProps {
  items: MenuItem[];
  vendorName: string;
}

const SYSTEM_PROMPT = `You are a menu information assistant for a campus food ordering app. You will be given a JSON list of menu items with their exact serving sizes and piece counts. Answer the user's question using ONLY the data provided in this context. Do not estimate, guess, or invent any quantity, price, or ingredient information not explicitly present in the provided data. If the answer isn't in the provided data, say so clearly and suggest they ask the vendor directly. Keep answers to 1-2 short sentences.`;

export default function AIStockQuery({ items, vendorName }: AIStockQueryProps) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setAnswer(null);

    // Filter key menu fields to send as compact JSON context
    const menuContext = items.map(i => ({
      name: i.name,
      veg: i.veg ? 'Vegetarian' : 'Non-Vegetarian',
      price_full: i.price_full,
      price_half: i.price_half,
      pieces_full: i.pieces_full,
      pieces_half: i.pieces_half,
      serving_note: i.serving_note,
      available: i.available ? 'Available' : 'Sold Out',
      description: i.description,
    }));

    const response = await askAI(SYSTEM_PROMPT, query, { vendor: vendorName, items: menuContext });

    setAnswer(response);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary-light/60 to-primary-50 rounded-2xl p-3.5 border border-primary/20 shadow-sm mb-4">
      <div className="flex items-center gap-1.5 text-xs font-bold text-primary-dark mb-2">
        <Sparkles size={14} className="text-primary" />
        <span>Ask AI about pieces, quantity & ingredients</span>
      </div>

      <form onSubmit={handleQuerySubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='e.g., "How many pieces in Momos?" or "Price of Cold Coffee?"'
          className="w-full pl-3 pr-10 py-2 rounded-xl bg-white border border-primary/30 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-40 transition-all cursor-pointer"
        >
          <Send size={12} />
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary animate-pulse">
          <Sparkles size={12} className="text-primary animate-spin" />
          <span>Searching menu data...</span>
        </div>
      )}

      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2.5 bg-white rounded-xl p-3 border border-primary/20 text-xs text-text-primary flex items-start gap-2 shadow-xs"
          >
            <span className="text-sm flex-shrink-0">🤖</span>
            <div className="flex-1">
              <p className="leading-relaxed">{answer}</p>
            </div>
            <button
              onClick={() => setAnswer(null)}
              className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
