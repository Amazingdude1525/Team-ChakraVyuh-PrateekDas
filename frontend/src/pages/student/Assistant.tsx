import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Info, Mic, Search, Send, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  DietMark,
  JaaliDivider,
  SectionHeading,
  Select,
} from '../../components/ui/primitives';
import { useBranches, useMenuItems } from '../../hooks';
import { cx, isBranchOpen, rupees, waitMinutes } from '../../utils';
import type { CafeBranch, MenuItem } from '../../types';

/**
 * A deterministic menu lookup, presented as a single-turn assistant.
 *
 * There is no model behind this and it does not pretend otherwise. Every answer
 * is composed from the menu data currently in the store, and when the data
 * cannot answer a question it says so rather than inventing something — which
 * is the only honest behaviour for a screen that quotes prices and portions.
 */

interface Answer {
  headline: string;
  detail?: string;
  items: MenuItem[];
  /** True when we could not answer from the menu data. */
  unresolved?: boolean;
}

const SUGGESTIONS = [
  'What is the cheapest vegetarian dish?',
  'How much is a masala dosa?',
  'What can I get under ₹100?',
  'Show me the bestsellers',
  'Anything with paneer?',
  'What is quickest to make?',
  'Is there filter coffee?',
];

/** Words that carry no signal when matching a dish name. */
const STOPWORDS = new Set([
  'what', 'whats', 'is', 'the', 'a', 'an', 'of', 'in', 'at', 'do', 'does', 'you', 'have',
  'me', 'show', 'get', 'can', 'i', 'how', 'much', 'many', 'any', 'anything', 'there',
  'are', 'for', 'with', 'and', 'to', 'it', 'price', 'cost', 'costs', 'please',
]);

function answerQuestion(question: string, items: MenuItem[], branch: CafeBranch | null): Answer {
  const q = question.toLowerCase().trim();
  const scope = branch ? `at ${branch.shortName}` : 'across campus';

  if (!q) {
    return { headline: 'Ask me something about the menu.', items: [] };
  }

  const available = items.filter((i) => i.available);

  // --- Opening hours and wait, when a cafe is in context ---
  if (branch && /(open|clos|timing|hours|shut)/.test(q)) {
    const open = isBranchOpen(branch);
    return {
      headline: open
        ? `${branch.name} is open right now.`
        : `${branch.name} is closed right now.`,
      detail: `Hours are ${branch.opensAt} to ${branch.closesAt}. ${
        open ? `Current wait is about ${waitMinutes(branch)} minutes with ${branch.activeOrderCount} orders in the queue.` : ''
      }`,
      items: [],
    };
  }

  if (branch && /(wait|how long|busy|queue|crowd)/.test(q)) {
    return {
      headline: `About ${waitMinutes(branch)} minutes ${scope}.`,
      detail: `That is ${branch.basePrepMinutes} minutes of base preparation plus the ${branch.activeOrderCount} orders already in the queue.`,
      items: [],
    };
  }

  // --- Cheapest / under a budget ---
  const priceCap = q.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*(\d+)/);
  if (priceCap) {
    const cap = Number(priceCap[1]);
    const vegOnly = /\bveg\b|vegetarian/.test(q) && !/non.?veg/.test(q);
    const matches = available
      .filter((i) => i.basePrice <= cap && (!vegOnly || i.diet === 'veg'))
      .sort((a, b) => a.basePrice - b.basePrice);

    if (matches.length === 0) {
      return {
        headline: `Nothing ${scope} comes in under ${rupees(cap)}${vegOnly ? ' on the vegetarian menu' : ''}.`,
        detail: `The cheapest is ${available.sort((a, b) => a.basePrice - b.basePrice)[0]?.name} at ${rupees(available.sort((a, b) => a.basePrice - b.basePrice)[0]?.basePrice ?? 0)}.`,
        items: [],
      };
    }
    return {
      headline: `${matches.length} ${vegOnly ? 'vegetarian ' : ''}${matches.length === 1 ? 'dish is' : 'dishes are'} under ${rupees(cap)} ${scope}.`,
      detail: 'Cheapest first.',
      items: matches.slice(0, 8),
    };
  }

  if (/cheap|least expensive|lowest price|budget/.test(q)) {
    const vegOnly = /\bveg\b|vegetarian/.test(q) && !/non.?veg/.test(q);
    const pool = available.filter((i) => !vegOnly || i.diet === 'veg');
    const sorted = [...pool].sort((a, b) => a.basePrice - b.basePrice).slice(0, 6);
    if (sorted.length === 0) return notFound(scope);
    return {
      headline: `${sorted[0].name} at ${rupees(sorted[0].basePrice)} is the cheapest ${vegOnly ? 'vegetarian option ' : ''}${scope}.`,
      items: sorted,
    };
  }

  // --- Quickest ---
  if (/quick|fast|hurry|soon|rush|in a hurry/.test(q)) {
    const sorted = [...available].sort((a, b) => a.prepMinutes - b.prepMinutes).slice(0, 6);
    if (sorted.length === 0) return notFound(scope);
    return {
      headline: `${sorted[0].name} is about the quickest ${scope}, roughly ${sorted[0].prepMinutes} minutes.`,
      detail: 'Sorted by preparation time.',
      items: sorted,
    };
  }

  // --- Bestsellers / recommendations ---
  if (/bestseller|best seller|popular|most ordered|recommend|what should i/.test(q)) {
    const sorted = available
      .filter((i) => i.bestseller || i.recommended)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 8);
    if (sorted.length === 0) return notFound(scope);
    return {
      headline: `Here is what sells most ${scope}.`,
      detail: 'Ordered by how many people gave it a thumbs up.',
      items: sorted,
    };
  }

  // --- Dietary ---
  if (/non.?veg|chicken|mutton|egg\b/.test(q) && !/\bveg\b/.test(q.replace('non-veg', '').replace('nonveg', ''))) {
    const wantsEgg = /egg\b/.test(q);
    const matches = available
      .filter((i) => (wantsEgg ? i.diet === 'egg' : i.diet === 'nonveg'))
      .sort((a, b) => b.likes - a.likes);
    if (matches.length === 0) {
      return {
        headline: `There is nothing ${wantsEgg ? 'with egg' : 'non-vegetarian'} ${scope}.`,
        detail: branch ? 'This counter is fully vegetarian.' : undefined,
        items: [],
      };
    }
    return {
      headline: `${matches.length} ${wantsEgg ? 'egg' : 'non-vegetarian'} ${matches.length === 1 ? 'dish' : 'dishes'} ${scope}.`,
      items: matches.slice(0, 8),
    };
  }

  if (/vegetarian|\bveg\b/.test(q)) {
    const matches = available.filter((i) => i.diet === 'veg').sort((a, b) => b.likes - a.likes);
    return {
      headline: `${matches.length} vegetarian ${matches.length === 1 ? 'dish' : 'dishes'} ${scope}.`,
      detail: 'Most liked first.',
      items: matches.slice(0, 8),
    };
  }

  // --- Name lookup: the common "how much is X" case ---
  const keywords = q
    .replace(/[?.,!₹]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  if (keywords.length > 0) {
    const scored = available
      .map((item) => {
        const name = item.name.toLowerCase();
        let score = 0;
        for (const w of keywords) {
          if (name.includes(w)) score += name.startsWith(w) ? 3 : 2;
          else if (item.description.toLowerCase().includes(w)) score += 1;
        }
        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.item.likes - a.item.likes);

    if (scored.length > 0) {
      const top = scored[0].item;
      const priceText =
        top.variants.length > 1
          ? top.variants.map((v) => `${v.label} ${rupees(v.price)}`).join(', ')
          : rupees(top.basePrice);

      const pieces = top.variants.find((v) => v.pieces != null);

      return {
        headline: `${top.name} — ${priceText}.`,
        detail: [
          pieces ? `${pieces.label} is ${pieces.pieces} pieces.` : null,
          `Roughly ${top.prepMinutes} minutes to make.`,
          scored.length > 1 ? `${scored.length - 1} other ${scored.length === 2 ? 'dish matches' : 'dishes match'} too.` : null,
        ]
          .filter(Boolean)
          .join(' '),
        items: scored.slice(0, 6).map((x) => x.item),
      };
    }
  }

  return notFound(scope);
}

function notFound(scope: string): Answer {
  return {
    headline: `I could not find that on the menu ${scope}.`,
    detail:
      'I only answer from the items and prices currently on the boards, so I will not guess. Try a dish name, or ask the counter directly.',
    items: [],
    unresolved: true,
  };
}

export default function Assistant() {
  const branches = useBranches();
  const [branchId, setBranchId] = useState<string>('all');
  const allItems = useMenuItems();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const listenTimer = useRef<number | null>(null);

  const branch = branchId === 'all' ? null : (branches.find((b) => b.id === branchId) ?? null);
  const scopedItems = useMemo(
    () => (branch ? allItems.filter((i) => i.branchId === branch.id) : allItems),
    [allItems, branch],
  );

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    setQuestion(q);
    setThinking(true);
    setAnswer(null);
    // A short beat so the lookup reads as a considered answer, not a flicker.
    setTimeout(() => {
      setAnswer(answerQuestion(q, scopedItems, branch));
      setThinking(false);
    }, 420);
  }

  /**
   * Microphone is simulated: it shows the listening state and then fills in a
   * plausible spoken question. Wiring the real Web Speech API here would be a
   * drop-in replacement for this timeout.
   */
  function toggleMic() {
    if (listening) {
      setListening(false);
      if (listenTimer.current) window.clearTimeout(listenTimer.current);
      return;
    }
    setListening(true);
    listenTimer.current = window.setTimeout(() => {
      setListening(false);
      const spoken = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
      ask(spoken);
    }, 2200);
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={17} className="text-[var(--color-saffron-deep)]" />
          <Chip tone="saffron">Prototype menu assistant</Chip>
        </div>
        <SectionHeading
          title="Ask about the menu"
          subtitle="Prices, portions, what is quick, what is vegetarian — answered from the live menu data"
          serif
        />
      </div>

      {/* Cafe context */}
      <Card className="p-4">
        <label
          htmlFor="assistant-scope"
          className="block text-[13px] font-medium text-[var(--color-charcoal)] mb-2"
        >
          Which counter are you asking about?
        </label>
        <Select
          id="assistant-scope"
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setAnswer(null);
          }}
        >
          <option value="all">All counters ({allItems.length} items)</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Card>

      {/* Input */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex gap-2.5"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] pointer-events-none"
            />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. how much is a masala dosa?"
              aria-label="Your question"
              className="w-full h-12 pl-10 pr-3 rounded-[12px] bg-[var(--color-paper)] border border-[var(--color-beige)] focus:border-[var(--color-saffron)] text-[14px] transition-colors placeholder:text-[var(--color-ink-soft)]"
            />
          </div>

          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={listening}
            aria-label={listening ? 'Stop listening' : 'Ask by voice'}
            className={cx(
              'relative w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 transition-colors',
              listening
                ? 'bg-[var(--color-terracotta)] text-white'
                : 'bg-[var(--color-sand)] text-[var(--color-ink-muted)] hover:bg-[var(--color-beige-soft)]',
            )}
          >
            {listening && (
              <>
                <span className="listen-ring absolute inset-0 rounded-[12px] bg-[var(--color-terracotta)]" />
                <span
                  className="listen-ring absolute inset-0 rounded-[12px] bg-[var(--color-terracotta)]"
                  style={{ animationDelay: '0.55s' }}
                />
              </>
            )}
            <Mic size={19} className="relative" />
          </button>

          <Button type="submit" size="lg" className="w-12 px-0 shrink-0" aria-label="Ask">
            <Send size={17} />
          </Button>
        </form>

        {listening && (
          <p className="text-[12.5px] text-[var(--color-terracotta)] mt-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-terracotta)] animate-pulse" />
            Listening… (simulated in this prototype)
          </p>
        )}
      </Card>

      {/* Suggestions */}
      {!answer && !thinking && (
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5">
            Try one of these
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)}>
                <Chip tone="neutral" className="hover:bg-[var(--color-beige-soft)] cursor-pointer">
                  {s}
                </Chip>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thinking */}
      {thinking && (
        <Card className="p-5 space-y-2.5">
          <div className="shimmer h-4 w-2/3 rounded-[6px]" />
          <div className="shimmer h-3 w-full rounded-[6px]" />
          <div className="shimmer h-3 w-4/5 rounded-[6px]" />
        </Card>
      )}

      {/* Answer */}
      {answer && !thinking && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className={cx(
              'p-5',
              answer.unresolved
                ? 'border-[var(--color-brass)]/50 bg-[var(--color-paper)]'
                : 'border-[var(--color-saffron)]/50 bg-[var(--color-saffron-tint)]/25',
            )}
          >
            <p className="text-[11.5px] text-[var(--color-ink-soft)] mb-1.5">You asked</p>
            <p className="text-[13px] text-[var(--color-ink-muted)] mb-3.5">“{question}”</p>

            <JaaliDivider className="mb-3.5" />

            <h2 className="text-[16px] font-semibold text-[var(--color-charcoal)] leading-snug">
              {answer.headline}
            </h2>
            {answer.detail && (
              <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed mt-2">
                {answer.detail}
              </p>
            )}

            {answer.items.length > 0 && (
              <ul className="mt-4 space-y-2">
                {answer.items.map((item) => {
                  const itemBranch = branches.find((b) => b.id === item.branchId);
                  return (
                    <li key={item.id}>
                      <Link
                        to={`/app/cafe/${item.branchId}`}
                        className="flex items-center gap-3 p-2.5 rounded-[11px] bg-[var(--color-cream)] border border-[var(--color-beige)] hover:border-[var(--color-brass)] transition-colors"
                      >
                        <DietMark diet={item.diet} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] text-[var(--color-charcoal)] truncate">
                            {item.name}
                          </span>
                          <span className="block text-[11.5px] text-[var(--color-ink-soft)] truncate">
                            {itemBranch?.shortName} · ~{item.prepMinutes} min
                          </span>
                        </span>
                        <span className="text-[13.5px] font-semibold text-[var(--color-charcoal)] shrink-0">
                          {rupees(item.basePrice)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex items-start gap-2 mt-4 pt-4 border-t border-[var(--color-beige)]">
              <Info size={14} className="text-[var(--color-brass)] shrink-0 mt-px" />
              <p className="text-[11.5px] text-[var(--color-ink-soft)] leading-relaxed">
                Answered by looking up the menu data directly — no model, no guessing. If it is not
                on the board, this will tell you so rather than make something up.
              </p>
            </div>
          </Card>

          <Button variant="ghost" className="mt-3" onClick={() => { setAnswer(null); setQuestion(''); }}>
            Ask something else
          </Button>
        </motion.div>
      )}
    </div>
  );
}
