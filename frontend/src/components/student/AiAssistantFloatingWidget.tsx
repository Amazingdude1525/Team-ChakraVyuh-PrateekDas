import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, X } from 'lucide-react';

const AUTO_CAPTIONS = [
  '🌶️ Craving something spicy? Try Mayuri\'s Special Thali!',
  '☕ Need a study booster? AB\'s Dakshin Filter Kaapi is ready in ~8 min.',
  '🍔 Late night lab hunger? UnderBelly burgers are open till 10:30 PM.',
  '🍕 Woodfire Pizza craving? Bistro by Safal has 0 min queue wait!',
  '✨ Unsure what to order? Tap me to ask the AI Menu Assistant!',
];

export function AiAssistantFloatingWidget() {
  const navigate = useNavigate();
  const [captionIndex, setCaptionIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Auto-cycle captions every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCaptionIndex((prev) => (prev + 1) % AUTO_CAPTIONS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none">
      {/* Auto-Cycling Caption Bubble */}
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white text-[12.5px] font-medium shadow-2xl border border-amber-400/40 backdrop-blur-xl max-w-[310px] relative"
      >
        <Sparkles size={15} className="text-amber-400 shrink-0 animate-pulse" />
        <div className="min-w-0 flex-1 h-5 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={captionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="truncate text-amber-100"
            >
              {AUTO_CAPTIONS[captionIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="text-slate-400 hover:text-white p-0.5"
          title="Dismiss tooltip"
        >
          <X size={13} />
        </button>
      </motion.div>

      {/* Floating Animated Avatar Button */}
      <motion.button
        type="button"
        onClick={() => navigate('/app/assistant')}
        whileHover={{ scale: 1.1, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Menu Assistant"
        className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E23744] via-[var(--color-terracotta)] to-[var(--color-saffron)] text-white flex items-center justify-center shadow-2xl border-2 border-white/80 cursor-pointer group"
      >
        {/* Pulsating Glow Ring */}
        <span className="absolute -inset-1 rounded-2xl bg-amber-400/40 animate-ping pointer-events-none opacity-75" />

        <Bot size={26} className="relative z-10 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 z-20" />
      </motion.button>
    </div>
  );
}
