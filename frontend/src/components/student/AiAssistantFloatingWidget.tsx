import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Sparkles, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBranches, useMenuItems } from '../../hooks';
import { cx, rupees } from '../../utils';
import type { MenuItem } from '../../types';

const AUTO_CAPTIONS = [
  '🌶️ Craving something spicy? Tap me to ask AI!',
  '☕ Need a study booster? Tap me to ask AI!',
  '🍔 Late night lab hunger? Tap me to ask AI!',
  '🍕 Woodfire Pizza craving? Tap me to ask AI!',
  '✨ Unsure what to order? Tap me to ask AI!',
];

const SUGGESTIONS = [
  'What is under ₹100?',
  'Cheapest veg dish',
  'Quickest to make',
  'Is there filter coffee?',
  'Show me bestsellers',
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  items?: MenuItem[];
}

export function AiAssistantFloatingWidget() {
  const [captionIndex, setCaptionIndex] = useState(0);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const branches = useBranches();
  const allItems = useMenuItems();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hey! I am your VITeBites AI Assistant. Ask me anything about menus, prices, vegetarian dishes, or what is quick to pick up!',
    },
  ]);

  // Auto-cycle captions
  useEffect(() => {
    const timer = setInterval(() => {
      setCaptionIndex((prev) => (prev + 1) % AUTO_CAPTIONS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  function handleSend(queryText: string) {
    const text = queryText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Answer logic
    setTimeout(() => {
      const q = text.toLowerCase();
      let replyText = 'Here is what I found on the menu:';
      let matchedItems: MenuItem[] = [];

      if (/under|below|less than|budget|cheap/.test(q)) {
        const priceCap = q.match(/\d+/) ? Number(q.match(/\d+/)?.[0]) : 100;
        matchedItems = allItems
          .filter((i) => i.available && i.basePrice <= priceCap)
          .sort((a, b) => a.basePrice - b.basePrice)
          .slice(0, 4);
        replyText = `Found ${matchedItems.length} dishes under ${rupees(priceCap)}:`;
      } else if (/quick|fast|hurry/.test(q)) {
        matchedItems = allItems
          .filter((i) => i.available)
          .sort((a, b) => a.prepMinutes - b.prepMinutes)
          .slice(0, 4);
        replyText = 'Here are the quickest dishes to prepare right now:';
      } else if (/bestseller|popular|best/.test(q)) {
        matchedItems = allItems
          .filter((i) => i.available && (i.bestseller || i.recommended))
          .slice(0, 4);
        replyText = 'Top recommended bestsellers across campus counters:';
      } else {
        const keywords = q.split(' ').filter((w) => w.length > 2);
        matchedItems = allItems
          .filter((i) => i.available && keywords.some((k) => i.name.toLowerCase().includes(k)))
          .slice(0, 4);
        if (matchedItems.length === 0) {
          replyText = 'I checked all 5 counters! Try searching for "masala dosa", "burger", "momos" or "coffee".';
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        items: matchedItems,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 350);
  }

  return (
    <>
      {/* --------------------------------- FLOATING BOT ICON & SPEECH BUBBLE --------------------------------- */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end select-none">
        {/* Speech Bubble Above Bot (Does NOT overlap bot icon) */}
        <AnimatePresence>
          {!bubbleDismissed && !drawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="mb-3 max-w-[280px] sm:max-w-[310px] pointer-events-auto"
            >
              <div className="relative px-3.5 py-2.5 rounded-2xl bg-slate-950/95 text-white text-[12px] font-medium shadow-2xl border border-amber-400/50 backdrop-blur-xl flex items-center gap-2.5">
                <Sparkles size={14} className="text-amber-400 shrink-0 animate-pulse" />
                <div className="min-w-0 flex-1 h-5 relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={captionIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="truncate text-amber-200 font-semibold"
                    >
                      {AUTO_CAPTIONS[captionIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBubbleDismissed(true);
                  }}
                  className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 shrink-0"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>

                {/* Downward Speech Bubble Triangle */}
                <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-slate-950 border-r border-b border-amber-400/50 transform rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Animated Avatar Button */}
        <motion.button
          type="button"
          onClick={() => {
            setDrawerOpen(!drawerOpen);
            setBubbleDismissed(true);
          }}
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Open AI Assistant Chat Drawer"
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#E23744] via-[var(--color-terracotta)] to-[var(--color-saffron)] text-white flex items-center justify-center shadow-2xl border-2 border-white/90 cursor-pointer group"
        >
          <span className="absolute -inset-1 rounded-2xl bg-amber-400/40 animate-ping pointer-events-none opacity-60" />
          <Bot size={26} className="relative z-10 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 z-20" />
        </motion.button>
      </div>

      {/* --------------------------------- POP-UP RIGHT-SIDE MINI AI CHAT DRAWER --------------------------------- */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-22 md:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] max-h-[calc(100vh-120px)] rounded-3xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-amber-300/80 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#0F172A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                  <Bot size={18} />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold leading-tight">VITeBites AI Assistant</h3>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Menu Knowledge
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cx(
                    'flex flex-col max-w-[85%]',
                    m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
                  )}
                >
                  <div
                    className={cx(
                      'p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm',
                      m.sender === 'user'
                        ? 'bg-[#D95D39] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none',
                    )}
                  >
                    {m.text}
                  </div>

                  {/* Matched Dishes */}
                  {m.items && m.items.length > 0 && (
                    <div className="mt-2 space-y-1.5 w-full">
                      {m.items.map((item) => {
                        const b = branches.find((x) => x.id === item.branchId);
                        return (
                          <Link
                            key={item.id}
                            to={`/app/cafe/${item.branchId}`}
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 transition-colors text-[12px] shadow-sm group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-900 block truncate">
                                {item.name}
                              </span>
                              <span className="text-[10.5px] text-slate-500 block truncate">
                                {b?.shortName} · ~{item.prepMinutes}m prep
                              </span>
                            </div>
                            <span className="font-bold text-[#D95D39] shrink-0 flex items-center gap-0.5">
                              {rupees(item.basePrice)}
                              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about dishes, prices, speed..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 text-slate-900 text-[13px] border border-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#D95D39] text-white flex items-center justify-center shadow-md hover:bg-[#c44e2b] transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
