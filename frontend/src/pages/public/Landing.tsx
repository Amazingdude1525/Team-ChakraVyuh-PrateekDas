import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  MapPin,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { CampusScene } from '../../components/landing/CampusScene';
import { AiAssistantFloatingWidget } from '../../components/student/AiAssistantFloatingWidget';
import { Button, Card, Chip, CrowdChip, Stars } from '../../components/ui/primitives';
import { Drawer, Sheet } from '../../components/ui/Overlay';
import { useBranches } from '../../hooks';
import { getCafe } from '../../data/cafes';
import { crowdLevel, cx, isBranchOpen, waitMinutes } from '../../utils';

/* ---------------------------------- Dynamic Glassmorphic Morphing Navbar ---------------------------------- */

function DynamicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 35);
    }
    window.addEventListener('scroll', handleScroll);

    const sectionIds = ['cafes', 'zomato-showcase', 'app-features'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: 0.1 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ease-out ${
        scrolled
          ? 'top-0 left-0 w-full rounded-none backdrop-blur-2xl bg-slate-950/92 border-b border-slate-800 text-white shadow-2xl py-3 px-6'
          : 'top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[1080px] rounded-full backdrop-blur-2xl bg-white/20 border border-white/35 text-white shadow-2xl py-3 px-6'
      }`}
    >
      <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-full bg-[var(--color-saffron)] flex items-center justify-center shadow-md">
            <UtensilsCrossed size={18} className="text-[var(--color-charcoal)]" />
          </span>
          <span className="font-display text-[22px] leading-none tracking-tight text-white drop-shadow-md">
            VIT<span className="text-[var(--color-saffron)] font-black">eBites</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5 text-[13.5px] font-semibold">
          <a
            href="#cafes"
            onClick={(e) => scrollToSection(e, 'cafes')}
            className={cx(
              'px-4 py-2 rounded-full transition-all duration-300',
              activeSection === 'cafes'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg scale-105'
                : 'text-white/85 hover:text-white hover:bg-white/20',
            )}
          >
            Cafes
          </a>
          <a
            href="#zomato-showcase"
            onClick={(e) => scrollToSection(e, 'zomato-showcase')}
            className={cx(
              'px-4 py-2 rounded-full transition-all duration-300',
              activeSection === 'zomato-showcase'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg scale-105'
                : 'text-white/85 hover:text-white hover:bg-white/20',
            )}
          >
            Why VITeBites
          </a>
          <a
            href="#app-features"
            onClick={(e) => scrollToSection(e, 'app-features')}
            className={cx(
              'px-4 py-2 rounded-full transition-all duration-300',
              activeSection === 'app-features'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg scale-105'
                : 'text-white/85 hover:text-white hover:bg-white/20',
            )}
          >
            Features
          </a>
          <Link
            to="/about"
            className="px-4 py-2 rounded-full text-white/85 hover:text-white hover:bg-white/20 transition-colors"
          >
            About &amp; Architecture
          </Link>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/vendor-login" className="hidden sm:block">
            <Button variant="secondary" size="sm" className="rounded-full border-white/35 bg-white/10 text-white hover:bg-white/25">
              <Store size={15} />
              Cafe staff
            </Button>
          </Link>
          <Link to="/choose-role">
            <Button size="sm" className="rounded-full bg-[#D95D39] hover:bg-[#c44e2b] text-white shadow-lg border border-rose-400/40">
              Order ahead
              <ArrowRight size={15} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------ Zomato-Style Showcase (ZERO OVERLAPPING) ------------------------------------------------ */

function ZomatoStyleShowcase() {
  return (
    <section id="zomato-showcase" className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-white overflow-hidden border-b border-[var(--color-beige)]">
      {/* Decorative Organic Curved Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-100,200 C300,50 800,350 1400,100"
          fill="none"
          stroke="#D95D39"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M-200,450 C400,600 900,250 1600,500"
          fill="none"
          stroke="#F3A712"
          strokeWidth="1.5"
        />
      </svg>

      {/* Floating 3D Food Items (Positioned far out on the outer sides so they NEVER overlap central cards or text) */}
      <div className="absolute inset-0 max-w-[1380px] mx-auto pointer-events-none z-10 hidden xl:block">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[3%] top-[18%] bg-white p-3.5 rounded-2xl shadow-lg border border-rose-100 flex items-center gap-3"
        >
          <span className="text-3xl">🍛</span>
          <div>
            <p className="text-[12px] font-bold text-slate-800">Special Thali</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Mayuri AB-1</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute right-[3%] top-[18%] bg-white p-3.5 rounded-2xl shadow-lg border border-rose-100 flex items-center gap-3"
        >
          <span className="text-3xl">🥟</span>
          <div>
            <p className="text-[12px] font-bold text-slate-800">Steamed Momos</p>
            <p className="text-[10px] text-amber-600 font-semibold">UnderBelly</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-[900px] mx-auto px-4 text-center z-20">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-1.5 rounded-full bg-rose-50 text-[#D95D39] text-[13px] font-bold uppercase tracking-wider mb-4 border border-rose-200"
        >
          Better Food For Every Student
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-[clamp(32px,5vw,56px)] leading-[1.08] text-[#1E293B]"
        >
          Authentic Indian flavors &amp; quick campus bites,{' '}
          <span className="text-[#D95D39]">delivered straight to counter.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-5 text-[16px] sm:text-[18px] text-slate-600 max-w-[660px] mx-auto leading-relaxed"
        >
          For every class break, lunch hour, and late-night study session — discover fresh meals
          across 5 campus counters with zero queue delay.
        </motion.p>

        {/* Clean Central Stats Card (Zero Overlap with Food Items) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-14 p-6 sm:p-8 rounded-3xl bg-[#0F172A] text-white shadow-2xl grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800"
        >
          <div className="pt-4 sm:pt-0 sm:px-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-amber-400">5 Counters</div>
            <div className="text-[13px] text-slate-300 mt-1 font-medium">AB-1, Special Block &amp; UB</div>
          </div>
          <div className="pt-4 sm:pt-0 sm:px-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-rose-400">480+ Dishes</div>
            <div className="text-[13px] text-slate-300 mt-1 font-medium">Authentic South, North &amp; Fast Food</div>
          </div>
          <div className="pt-4 sm:pt-0 sm:px-4 text-center">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">0 Queue Wait</div>
            <div className="text-[13px] text-slate-300 mt-1 font-medium">Guaranteed token pickup slot</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------- Smartphone Feature Showcase with Soft Glowing Gradient Cutoff ------------------------------------------- */

function ZomatoStyleAppFeatures() {
  return (
    <section id="app-features" className="pt-24 pb-20 sm:pt-32 sm:pb-28 bg-[#FFF0F3] border-b border-rose-100 overflow-hidden relative">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(30px,4.8vw,52px)] leading-tight text-[#1E293B]"
        >
          What's waiting for you on <span className="text-[#D95D39]">VITeBites</span>?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-[15px] sm:text-[17px] text-slate-600 max-w-[580px] mx-auto"
        >
          Packed with features designed for VIT Bhopal students — from veg modes to group ordering.
        </motion.p>

        {/* Smartphone Mockup Showcase with Glowing Blur Bottom Gradient */}
        <div className="mt-14 relative flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-[300px] sm:w-[340px] rounded-[44px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-800 relative z-20 overflow-hidden"
          >
            {/* Phone Screen Mock */}
            <div className="w-full rounded-[36px] bg-[var(--color-ivory)] overflow-hidden flex flex-col justify-start p-5 text-left border border-slate-700/50 relative">
              {/* Notch */}
              <div className="w-20 h-4 bg-slate-950 rounded-b-xl mx-auto mb-4" />

              {/* Animated Pop-Up Token Card Inside Phone */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 200 }}
                className="space-y-4 text-center py-4 bg-white rounded-3xl p-5 shadow-xl border border-amber-200"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl bg-[var(--color-saffron)] text-slate-900 mx-auto flex items-center justify-center font-black text-2xl shadow-lg"
                >
                  #42
                </motion.div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wider uppercase">
                    ● Order Preparing
                  </span>
                  <h4 className="text-[17px] font-bold text-slate-900 mt-2">AB Dakshin</h4>
                  <p className="text-[12.5px] text-slate-500 font-medium">Masala Dosa + Filter Coffee</p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[12px] text-amber-900 font-bold">
                  Pickup slot: 1:15 PM – 1:20 PM
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Surrounding Floating Feature Cards */}
          <div className="absolute inset-0 pointer-events-none hidden lg:block z-30">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[10%] top-[10%] bg-white p-4 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-3 text-left w-52"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                🥗
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Veg Mode</p>
                <p className="text-[11px] text-slate-500">Filter 100% vegetarian</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute left-[8%] bottom-[22%] bg-white p-4 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-3 text-left w-56"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                👥
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Group Orders</p>
                <p className="text-[11px] text-slate-500">1 Code for the whole table</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute right-[10%] top-[12%] bg-white p-4 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-3 text-left w-52"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Surplus Deals</p>
                <p className="text-[11px] text-slate-500">Up to 30% off closing time</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4.7, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
              className="absolute right-[8%] bottom-[20%] bg-white p-4 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-3 text-left w-56"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                🎫
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Token Pickup</p>
                <p className="text-[11px] text-slate-500">No queue standing required</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------- Zomato-Style Sleek Dark Footer --------------------------------------------- */

function ZomatoDarkFooter() {
  const branches = useBranches();

  return (
    <footer className="bg-[#0B0F19] text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-10 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#D95D39] text-white flex items-center justify-center shadow-lg font-bold text-xl">
              V
            </span>
            <span className="font-display text-3xl font-black text-white tracking-tight">
              VIT<span className="text-[#D95D39]">eBites</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Built for VIT Bhopal</span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-[11px] font-bold border border-slate-700">
              Summer of CodeFest 2.0
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          <div>
            <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">
              Campus Cafes
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              {branches.map((b) => (
                <li key={b.id}>
                  <Link to={`/app/cafe/${b.id}`} className="hover:text-rose-400 transition-colors">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">
              For Students
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/choose-role" className="hover:text-rose-400 transition-colors">
                  Order Ahead
                </Link>
              </li>
              <li>
                <Link to="/app" className="hover:text-rose-400 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/app/search" className="hover:text-rose-400 transition-colors">
                  Search &amp; Filters
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-rose-400 transition-colors">
                  AI Menu Assistant
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">
              Project Creators
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li className="font-semibold text-white">Prateek Das</li>
              <li className="text-slate-400 text-[12px]">25BCE10599 · VIT Bhopal</li>
              <li className="font-semibold text-white pt-2">Anushka Chatterjee</li>
              <li className="text-slate-400 text-[12px]">25BCE11276 · VIT Bhopal</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">
              Learn More
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link to="/about" className="hover:text-rose-400 transition-colors">
                  System Architecture &amp; About
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-rose-400 transition-colors">
                  Help &amp; FAQ
                </Link>
              </li>
              <li>
                <Link to="/vendor-login" className="hover:text-rose-400 transition-colors">
                  Cafe Staff Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; 2026 VITeBites — Frontend prototype built for the Canteen Queue &amp; Pre-Order problem statement.
          </p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link to="/help" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- Main Landing Page ------------------------------------------------ */

export default function Landing() {
  const navigate = useNavigate();
  const branches = useBranches();
  const [previewBranchId, setPreviewBranchId] = useState<string | null>(null);
  const [mayuriOpen, setMayuriOpen] = useState(false);

  const previewBranch = useMemo(
    () => branches.find((b) => b.id === previewBranchId),
    [branches, previewBranchId],
  );

  const mayuriBranches = useMemo(
    () => branches.filter((b) => b.cafeId === 'mayuri'),
    [branches],
  );

  function handleSceneSelect(id: string) {
    if (id === 'mayuri') {
      setMayuriOpen(true);
      return;
    }
    setPreviewBranchId(id);
  }

  function goToMenu(branchId: string) {
    navigate(`/app/cafe/${branchId}`);
  }

  return (
    <div className="min-h-screen bg-[var(--color-ivory)]">
      {/* 1. Dynamic Glassmorphic Morphing Navbar (Top Rounded Pill -> Full Width Rectangle on Scroll) */}
      <DynamicNavbar />

      {/* 2. FIRST VIEW: Full-Bleed Edge-to-Edge Photorealistic Campus Image Hero */}
      <section className="relative w-full pt-0">
        <CampusScene onSelect={handleSceneSelect} />
      </section>

      {/* 3. Hero Text Header Positioned Directly BELOW the Campus Photo */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-slate-900 via-[#0F172A] to-slate-950 text-white text-center">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Chip tone="saffron" className="shadow-md bg-amber-400/10 border border-amber-400/40 text-amber-300 px-4 py-1 rounded-full">
              <MapPin size={13} className="text-[#D95D39]" />
              VIT Bhopal · campus pickup only
            </Chip>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-[clamp(34px,5.8vw,64px)] leading-[1.05] text-white tracking-tight"
          >
            Five counters.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-[#D95D39]">
              One queue you never stand in.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-5 text-[17px] sm:text-[19px] leading-relaxed text-slate-300 max-w-[660px] mx-auto"
          >
            Order ahead from any campus cafe, get a token and a five-minute pickup window, and
            collect it from the counter when it is ready.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" onClick={() => navigate('/choose-role')} className="shadow-2xl hover:scale-105 transition-transform bg-[#D95D39] text-white rounded-full px-7">
              Explore cafes
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/vendor-login')} className="hover:scale-105 transition-transform border-slate-700 bg-white/10 text-white rounded-full px-7">
              <Store size={17} />
              Cafe staff login
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 4. Zomato Food Showcase Section */}
      <ZomatoStyleShowcase />

      {/* 5. Zomato App Features Section */}
      <ZomatoStyleAppFeatures />

      {/* 6. Campus Cafe Grid Section */}
      <section id="cafes" className="max-w-[1180px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <h2 className="font-display text-[clamp(26px,3.6vw,40px)] leading-tight text-[#1E293B]">
            Where you can order from
          </h2>
          <p className="mt-3 text-[14px] text-slate-600 leading-relaxed">
            Live queue depth and wait estimates from each counter, updated as orders move through
            the kitchen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch, i) => {
            const cafe = getCafe(branch.cafeId);
            const open = isBranchOpen(branch);
            return (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
              >
                <Card className="p-5 h-full flex flex-col hover:shadow-warm-lg transition-shadow bg-white rounded-2xl border border-slate-200">
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      aria-hidden
                      className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 font-display text-[17px] text-white shadow-md"
                      style={{ background: cafe?.brandColor ?? 'var(--color-saffron)' }}
                    >
                      {branch.shortName.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-[#1E293B] truncate">
                        {branch.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 truncate">
                        {branch.location}
                      </p>
                    </div>
                    <Chip tone={open ? 'veg' : 'wine'}>{open ? 'Open' : 'Closed'}</Chip>
                  </div>

                  <p className="text-[13px] text-slate-600 leading-relaxed flex-1">
                    {branch.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Stars rating={branch.rating} count={branch.ratingCount} />
                    <CrowdChip level={crowdLevel(branch.activeOrderCount)} />
                    <Chip tone="brass">
                      <Clock3 size={11} />~{waitMinutes(branch)} min
                    </Chip>
                  </div>

                  <Button
                    variant="secondary"
                    fullWidth
                    className="mt-4 rounded-xl"
                    onClick={() => setPreviewBranchId(branch.id)}
                  >
                    View details
                    <ChevronRight size={15} />
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 7. Dark Premium Footer */}
      <ZomatoDarkFooter />

      {/* 8. Cafe Preview Drawer */}
      <Drawer
        open={!!previewBranch}
        onClose={() => setPreviewBranchId(null)}
        title={previewBranch?.name}
        footer={
          previewBranch && (
            <Button fullWidth size="lg" onClick={() => goToMenu(previewBranch.id)} className="bg-[#D95D39] text-white">
              View menu
              <ArrowRight size={16} />
            </Button>
          )
        }
      >
        {previewBranch && (
          <div className="p-5 space-y-5">
            <div
              className="h-28 rounded-[14px] flex items-end p-4 arch-top shadow-md"
              style={{
                background: `linear-gradient(140deg, ${getCafe(previewBranch.cafeId)?.brandColor ?? '#F3A712'} 0%, #4a3a24 130%)`,
              }}
            >
              <div>
                <div className="font-display text-[22px] text-white leading-tight">
                  {getCafe(previewBranch.cafeId)?.name}
                </div>
                <div className="text-[12px] text-white/80">
                  {getCafe(previewBranch.cafeId)?.tagline}
                </div>
              </div>
            </div>

            <p className="text-[13px] text-slate-600 leading-relaxed">
              {previewBranch.description}
            </p>
          </div>
        )}
      </Drawer>

      {/* 9. Mayuri Branch Chooser Sheet */}
      <Sheet
        open={mayuriOpen}
        onClose={() => setMayuriOpen(false)}
        size="lg"
        title="Which Mayuri counter?"
        description="Mayuri runs two counters on campus. Pick whichever is closer to your next class."
      >
        <div className="grid gap-3 sm:grid-cols-2 pb-1">
          {mayuriBranches.map((branch) => {
            const open = isBranchOpen(branch);
            return (
              <Card key={branch.id} className="p-4 flex flex-col bg-[var(--color-paper)]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#1E293B]">
                      {branch.shortName}
                    </h3>
                    <p className="text-[12px] text-slate-500">{branch.location}</p>
                  </div>
                  <Chip tone={open ? 'veg' : 'wine'}>{open ? 'Open' : 'Closed'}</Chip>
                </div>

                <p className="text-[12px] text-slate-600 leading-relaxed flex-1">
                  {branch.description}
                </p>

                <Button fullWidth className="mt-3" onClick={() => goToMenu(branch.id)}>
                  View menu
                  <ArrowRight size={15} />
                </Button>
              </Card>
            );
          })}
        </div>
      </Sheet>

      {/* 10. Floating AI Assistant Widget & Pop-Up Mini Drawer */}
      <AiAssistantFloatingWidget />
    </div>
  );
}
