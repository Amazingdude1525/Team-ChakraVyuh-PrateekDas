import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ChevronDown, LifeBuoy, UtensilsCrossed } from 'lucide-react';
import { Button, Card, Chip } from '../../components/ui/primitives';
import { cx } from '../../utils';

const FAQ_GROUPS = [
  {
    group: 'Ordering',
    items: [
      {
        q: 'Do you deliver to my hostel or classroom?',
        a: 'No. Everything on VITeBites is campus pickup — you collect it yourself from the counter you ordered from. The point is to remove the queue, not to add a runner.',
      },
      {
        q: 'Can I order from two cafes in one go?',
        a: 'Not in a single order. Each order is collected from one counter, so your cart holds one cafe at a time. If you add something from a different cafe we will ask whether to start a fresh cart. Place them as two orders if you need both.',
      },
      {
        q: 'How far ahead can I order?',
        a: 'Whenever the counter is open. If you order well in advance and then find yourself walking over early, tap "I\'m heading over" on the tracking screen — the counter sees it and can start your order sooner.',
      },
      {
        q: 'What does the pickup window mean?',
        a: 'It is a five-minute slot when your food should be ready. We work it out from the counter\'s current queue depth rather than a fixed guess, and it spreads pickups out so everyone does not arrive at once.',
      },
    ],
  },
  {
    group: 'Tokens and pickup',
    items: [
      {
        q: 'What is my token number for?',
        a: 'It identifies your order at the counter. Each counter has its own prefix — UB for Under Belly, MA for Mayuri AB-1, DK for Dakshin and so on — so UB-14 and DK-14 are never confused. Show it when you collect.',
      },
      {
        q: 'What if I am late for my window?',
        a: 'Your order is held at the counter. The window is a guide for when it will be freshest, not a deadline that voids the order.',
      },
      {
        q: 'How do I know it is actually ready?',
        a: 'The kitchen ticks each item off as it is plated. When the last item is done your order flips to Ready and you get a notification — not before.',
      },
    ],
  },
  {
    group: 'Payments and deals',
    items: [
      {
        q: 'How do I pay?',
        a: 'UPI, card, or pay at the counter when you collect. In this prototype all three are simulated and no money moves.',
      },
      {
        q: 'What is a surplus deal?',
        a: 'Near closing time a counter may discount food it has already made rather than waste it. Staff activate these manually in their closing window. They have nothing to do with cancellations or refunds.',
      },
      {
        q: 'Are there coupon codes?',
        a: 'VIT10 takes 10% off in this prototype. Enter it in the cart before checking out.',
      },
    ],
  },
  {
    group: 'Group orders',
    items: [
      {
        q: 'How does a group order work?',
        a: 'Start one from any cafe and share the code with your table. Everyone adds their own items within the window, and it goes to the kitchen as one ticket, itemised per person so nothing gets mixed up.',
      },
      {
        q: 'Who pays for a group order?',
        a: 'Whoever started it. That is shown clearly on the group screen so there is no confusion at the counter.',
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-beige)] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-[14px] font-medium text-[var(--color-charcoal)]">{q}</span>
        <ChevronDown
          size={17}
          className={cx(
            'shrink-0 text-[var(--color-ink-soft)] transition-transform duration-250',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-[13.5px] text-[var(--color-ink-muted)] leading-relaxed pb-4 pr-8">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Help() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--color-saffron)] flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-[var(--color-charcoal)]" />
          </span>
          <span className="font-display text-[20px] leading-none text-[var(--color-charcoal)]">
            VITe<span className="text-[var(--color-terracotta)]">Bites</span>
          </span>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={15} />
            Home
          </Button>
        </Link>
      </header>

      <main className="flex-1 max-w-[760px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <Chip tone="saffron" className="mb-4">
          <LifeBuoy size={11} />
          Help
        </Chip>

        <h1 className="font-display text-[clamp(28px,4.6vw,44px)] leading-tight text-[var(--color-charcoal)]">
          Questions, answered
        </h1>
        <p className="mt-3 text-[14.5px] text-[var(--color-ink-muted)] leading-relaxed">
          Everything students ask at the counter, in one place.
        </p>

        <div className="mt-9 space-y-6">
          {FAQ_GROUPS.map((group) => (
            <div key={group.group}>
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)] mb-2">
                {group.group}
              </h2>
              <Card className="px-5">
                {group.items.map((item) => (
                  <FaqItem key={item.q} {...item} />
                ))}
              </Card>
            </div>
          ))}
        </div>

        <Card className="mt-8 p-5 bg-[var(--color-paper)]">
          <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)]">
            Something wrong with an order?
          </h2>
          <p className="text-[13.5px] text-[var(--color-ink-muted)] leading-relaxed mt-1.5">
            Speak to the counter directly — they can see your token and everything on it. In this
            prototype there is no support inbox behind this page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link to="/app/orders">
              <Button variant="secondary" size="sm">
                View my orders
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm">
                About this project
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
