import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Timer,
  QrCode,
  Mic,
  Users,
  BadgePercent,
  WifiOff,
  ThumbsUp,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CafeStreetScene, { type CafeDef } from '../components/landing/CafeStreetScene';

/* Mayuri operates two outlets — clicking the storefront asks which one. */
const MAYURI_OUTLETS = [
  {
    slug: 'mayuri-ab',
    name: 'Mayuri (AB-1)',
    blurb: 'Academic Block · quick bites between lectures',
    hint: 'Samosa, kachori, chai',
  },
  {
    slug: 'mayuri-sb',
    name: 'Mayuri (Special Block)',
    blurb: 'Special Block · full thali & gravy counter',
    hint: 'Thali, paneer, tandoori',
  },
];

const PILLARS = [
  {
    icon: Clock,
    title: 'Skip the Queue',
    desc: 'Order between classes. Walk in, show your token, walk out.',
  },
  {
    icon: Timer,
    title: 'Timed Pickup Slots',
    desc: 'A 5-minute window that spreads the rush instead of clumping it.',
  },
  {
    icon: MapPin,
    title: 'Five Cafes, One App',
    desc: 'Every counter on campus, live availability, one cart.',
  },
  {
    icon: ShieldCheck,
    title: 'VIT-Only Access',
    desc: 'Sign-in restricted to @vitbhopal.ac.in. Campus stays campus.',
  },
];

const CAPABILITIES = [
  { icon: Sparkles, label: 'Ask the menu', desc: 'AI answers portion & ingredient questions from real vendor data — never guesses.' },
  { icon: Mic, label: 'Voice ordering', desc: 'Say it, confirm it, done. Never auto-adds without your nod.' },
  { icon: QrCode, label: 'Scan at counter', desc: 'One scan drops you straight into that cafe’s menu.' },
  { icon: ThumbsUp, label: 'Honest reviews', desc: 'Only orders you actually collected can be rated.' },
  { icon: Users, label: 'Group cart', desc: 'One link, one ticket, everyone’s items itemised by name.' },
  { icon: BadgePercent, label: 'Closing-hour deals', desc: 'Vendors flash 10% off surplus stock before shutters roll down.' },
  { icon: WifiOff, label: 'Works offline', desc: 'Dead zone near AB-2? Queue the order, it syncs and confirms.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [outletPicker, setOutletPicker] = useState(false);

  const handleCafeSelect = (cafe: CafeDef) => {
    if (cafe.hasBranches) {
      setOutletPicker(true);
      return;
    }
    navigate(`/auth?cafe=${cafe.key}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ============ NAV ============ */}
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-3 z-50 mx-auto flex max-w-5xl items-center justify-between rounded-full glass-strong px-5 py-2.5 shadow-glass"
        style={{ width: 'calc(100% - 1.5rem)' }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
            <MapPin size={16} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-text-primary">
            VITe<span className="text-primary">Bites</span>
          </span>
        </div>

        <div className="hidden items-center gap-7 text-sm font-medium text-text-secondary md:flex">
          <a href="#cafes" className="transition-colors hover:text-primary">Cafes</a>
          <a href="#features" className="transition-colors hover:text-primary">Features</a>
          <a href="#how" className="transition-colors hover:text-primary">How it works</a>
        </div>

        <Button size="sm" onClick={() => navigate('/auth')}>
          Sign In <ArrowRight size={15} />
        </Button>
      </motion.nav>

      {/* ============ HERO ============ */}
      <section className="relative pt-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary-dark"
          >
            <Sparkles size={13} /> Built for VIT Bhopal · Summer of CodeFest 2.0
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mx-auto mt-5 max-w-3xl font-display text-[2.6rem] font-black leading-[1.05] tracking-tight text-text-primary sm:text-6xl"
          >
            Campus food,
            <br />
            <span className="text-gradient">ready when you are.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mx-auto mt-4 max-w-xl text-base text-text-secondary sm:text-lg"
          >
            Order ahead from every cafe on campus, pay once, and collect at your
            slot. No delivery, no waiting — just walk up to the counter and pick it up.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={() => navigate('/auth')}>
              Start Ordering <ArrowRight size={19} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('cafes')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Cafes
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-xs font-medium text-text-muted"
          >
            Hover a storefront below — the lights come on. Tap to step inside.
          </motion.p>
        </div>

        {/* ============ THE PARALLAX STREET ============ */}
        <div id="cafes" className="mt-6 scroll-mt-24">
          <CafeStreetScene onSelect={handleCafeSelect} />
        </div>
      </section>

      {/* ============ PILLARS STRIP ============ */}
      <section className="relative z-40 -mt-10 px-4">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-3xl glass-strong shadow-glass lg:grid-cols-4">
          {PILLARS.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col gap-2 px-5 py-6"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary">
                <f.icon size={18} />
              </span>
              <h3 className="text-sm font-bold text-text-primary">{f.title}</h3>
              <p className="text-xs leading-relaxed text-text-secondary">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="kolam-divider mx-auto my-16 h-[22px] max-w-3xl opacity-70" aria-hidden="true" />

      {/* ============ CAPABILITIES ============ */}
      <section id="features" className="scroll-mt-24 px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
              More than a menu
            </h2>
            <p className="mt-2 text-text-secondary">
              Everything a campus canteen actually needs — and a few things it didn’t know it did.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: (i % 3) * 0.08 }}
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <c.icon size={19} />
                </span>
                <h3 className="mb-1 font-bold text-text-primary">{c.label}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="scroll-mt-24 gradient-warm px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-text-primary sm:text-4xl">
            Four taps to lunch
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Sign in', 'Your @vitbhopal.ac.in ID, nothing else.'],
              ['Pick a cafe', 'Live availability, veg/non-veg, real portion sizes.'],
              ['Pay once', 'Secure checkout. Sold out? You’re not charged.'],
              ['Collect', 'Token + pickup window. Kitchen already knows you’re coming.'],
            ].map(([title, desc], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <span className="mb-3 block font-display text-4xl font-black text-primary/35">
                  0{i + 1}
                </span>
                <h3 className="mb-1 font-bold text-text-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl glass-strong px-8 py-14 shadow-glass"
        >
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
            The queue starts in 40 minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-text-secondary">
            Order now and it won’t be your problem.
          </p>
          <div className="mt-7 flex justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Sign in with VIT email <ArrowRight size={19} />
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border-light px-6 py-8 text-center">
        <p className="text-sm text-text-muted">
          VITeBites · Made at VIT Bhopal · Pickup only, no delivery
        </p>
      </footer>

      {/* ============ MAYURI OUTLET PICKER ============ */}
      <Modal isOpen={outletPicker} onClose={() => setOutletPicker(false)} title="Mayuri’s — two outlets">
        <p className="mb-4 text-sm text-text-secondary">
          Mayuri runs two counters on campus with different menus. Which one are you heading to?
        </p>
        <div className="space-y-3">
          {MAYURI_OUTLETS.map((o) => (
            <button
              key={o.slug}
              onClick={() => navigate(`/auth?cafe=${o.slug}`)}
              className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary-50 hover:shadow-card-hover"
            >
              <span>
                <span className="block font-bold text-text-primary">{o.name}</span>
                <span className="block text-xs text-text-secondary">{o.blurb}</span>
                <span className="mt-1 block text-[11px] font-medium text-primary-dark">{o.hint}</span>
              </span>
              <ArrowRight
                size={18}
                className="shrink-0 text-text-muted transition-all group-hover:translate-x-1 group-hover:text-primary"
              />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
