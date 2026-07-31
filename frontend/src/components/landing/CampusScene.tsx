import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock3, Sparkles, Users } from 'lucide-react';
import { useBranches } from '../../hooks';
import { crowdLevel, cx, isBranchOpen, waitMinutes } from '../../utils';
import type { CafeBranch } from '../../types';

export interface SceneStorefront {
  id: string;
  name: string;
  sub?: string;
  brandColor: string;
  description: string;
  tag: string;
}

export const SCENE_STOREFRONTS: SceneStorefront[] = [
  {
    id: 'underbelly',
    name: 'Under Belly',
    sub: 'Burgers & Fast Bites',
    brandColor: '#D95D39',
    description: 'Burgers, rolls, fries & late-night cravings at UB ground floor.',
    tag: 'Popular for Quick Snacks',
  },
  {
    id: 'mayuri',
    name: "Mayuri's",
    sub: 'AB-1 & Special Block',
    brandColor: '#F3A712',
    description: 'North & South Indian meals, thalis, fresh juices & combo platters.',
    tag: '2 Counters on Campus',
  },
  {
    id: 'dakshin',
    name: 'AB Dakshin',
    sub: 'South Indian Kitchen',
    brandColor: '#196B45',
    description: 'Authentic crispy dosas, idlis, vada & piping hot filter coffee.',
    tag: 'Freshly Made Dosas',
  },
  {
    id: 'bistro-safal',
    name: 'BISTRO',
    sub: 'by Safal Café',
    brandColor: '#A92F34',
    description: 'Artisanal coffee, woodfire pizzas, pasta & gourmet pastries.',
    tag: 'Premium Cafe & Coffee',
  },
];

/* -------------------------------------------------- Flying Birds Animation */

function FlyingBird({
  delay = 0,
  duration = 18,
  top = '12%',
  scale = 1,
  opacity = 0.8,
}: {
  delay?: number;
  duration?: number;
  top?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <motion.div
      initial={{ x: '-10%', top }}
      animate={{ x: '110vw' }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
      className="absolute pointer-events-none z-10"
      style={{ opacity }}
    >
      <motion.svg
        width={36 * scale}
        height={24 * scale}
        viewBox="0 0 50 35"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ y: [0, -6, 0, 4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.path
          d="M0,18 Q12,2 25,18 Q38,2 50,18 Q38,12 25,22 Q12,12 0,18 Z"
          fill="#1E293B"
          animate={{
            d: [
              'M0,18 Q12,2 25,18 Q38,2 50,18 Q38,12 25,22 Q12,12 0,18 Z',
              'M0,18 Q12,28 25,18 Q38,28 50,18 Q38,16 25,20 Q12,16 0,18 Z',
              'M0,18 Q12,2 25,18 Q38,2 50,18 Q38,12 25,22 Q12,12 0,18 Z',
            ],
          }}
          transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
    </motion.div>
  );
}

function FlockOfBirds() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <FlyingBird top="18%" duration={16} delay={0} scale={0.9} opacity={0.85} />
      <FlyingBird top="22%" duration={18} delay={1.8} scale={0.7} opacity={0.75} />
      <FlyingBird top="20%" duration={15} delay={3.2} scale={0.5} opacity={0.65} />
      <FlyingBird top="25%" duration={20} delay={6} scale={0.85} opacity={0.8} />
      <FlyingBird top="28%" duration={22} delay={10} scale={0.6} opacity={0.7} />
    </div>
  );
}

/* ----------------------------------------------- Interactive Campus Scene */

export function CampusScene({
  onSelect,
  className,
}: {
  onSelect: (id: string) => void;
  className?: string;
}) {
  const branches = useBranches();
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);

  const shopData = useMemo(() => {
    return SCENE_STOREFRONTS.map((shop) => {
      let branch: CafeBranch | undefined;
      if (shop.id === 'mayuri') {
        branch = branches.find((b) => b.cafeId === 'mayuri');
      } else {
        branch = branches.find((b) => b.id === shop.id);
      }

      const open = branch ? isBranchOpen(branch) : true;
      const wait = branch ? waitMinutes(branch) : 10;
      const queueCount = branch ? branch.activeOrderCount : 3;
      const crowd = crowdLevel(queueCount);

      return {
        ...shop,
        branch,
        open,
        wait,
        queueCount,
        crowd,
      };
    });
  }, [branches]);

  return (
    <div
      className={cx(
        'relative w-full overflow-hidden select-none shadow-2xl bg-slate-950 border-b border-slate-800',
        // Taller height so VIT BHOPAL facade is completely clear below floating navbar
        'h-[clamp(540px,70vw,820px)] pt-24',
        className,
      )}
    >
      {/* Edge-to-Edge Photorealistic Image */}
      <motion.img
        src="/campus_cafes.jpeg"
        alt="VIT Bhopal Campus & Food Street"
        className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Subtle Atmospheric Gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-950/40 via-transparent to-amber-950/30"
      />

      {/* Flying Birds */}
      <FlockOfBirds />

      {/* Floating Instructions Pill (Positioned cleanly out of the way) */}
      <div className="absolute top-24 right-6 z-20 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/20 text-white text-[12px] shadow-2xl">
        <Sparkles size={14} className="text-amber-400 animate-pulse" />
        <span>Tap any cafe storefront to order</span>
      </div>

      {/* Clean Storefront Hotspots (NO TEXT OVERLAYS OVER PHYSICAL SIGNS) */}
      <div className="absolute inset-x-0 bottom-0 top-[52%] z-20 px-4 sm:px-10 pb-6 flex items-end justify-between gap-4 max-w-[1400px] mx-auto">
        {shopData.map((shop) => {
          const isHovered = hoveredShop === shop.id;

          return (
            <motion.div
              key={shop.id}
              className="relative flex-1 h-full max-h-[360px] flex flex-col justify-end"
              onMouseEnter={() => setHoveredShop(shop.id)}
              onMouseLeave={() => setHoveredShop(null)}
            >
              {/* Floating Live Glassmorphism Status Card on Hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-[108%] left-1/2 -translate-x-1/2 w-[calc(100%+24px)] min-w-[210px] max-w-[270px] p-4 rounded-2xl shadow-2xl z-30 pointer-events-none backdrop-blur-2xl bg-slate-900/90 text-white border border-amber-300/80"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[14px] font-bold text-white truncate">
                        {shop.name}
                      </span>
                      <span
                        className={cx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          shop.open
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
                        )}
                      >
                        {shop.open ? '● Open' : 'Closed'}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-300 line-clamp-2 mb-3 leading-snug">
                      {shop.description}
                    </p>

                    <div className="flex items-center justify-between gap-1.5 text-[11px] pt-2 border-t border-slate-800">
                      <span className="flex items-center gap-1 font-bold text-amber-300">
                        <Clock3 size={12} />
                        ~{shop.wait} min wait
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 font-medium">
                        <Users size={11} />
                        {shop.queueCount} in queue
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Clean Transparent Hotspot (Subtle Pinch of Warm Light Glow on Hover) */}
              <button
                type="button"
                onClick={() => onSelect(shop.id)}
                aria-label={`Order from ${shop.name}`}
                className={cx(
                  'w-full h-[90%] rounded-2xl p-3 sm:p-4 text-left flex flex-col justify-between transition-all duration-300 group cursor-pointer relative overflow-hidden',
                  isHovered
                    ? 'bg-amber-300/5 shadow-[0_0_24px_rgba(243,167,18,0.22)] scale-[1.01]'
                    : 'bg-transparent hover:scale-[1.005]',
                )}
              >
                {/* Storefront Warm Light Glow Effect on Hover (Ultra-subtle pinch) */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, ${shop.brandColor}25 0%, transparent 75%)`,
                  }}
                />

                {/* Small Subtle Wait Badge Top Right */}
                <div className="relative z-10 flex justify-end">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-amber-300 text-[10.5px] font-bold shadow-md border border-white/20 backdrop-blur-md">
                    ~{shop.wait}m wait
                  </span>
                </div>

                {/* Bottom Action Trigger Circle on Hover */}
                <div className="relative z-10 flex justify-end items-center pt-2">
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:scale-110 transition-all shadow-2xl">
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
