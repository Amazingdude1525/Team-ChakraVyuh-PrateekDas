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
    name: "AB's Dakshin",
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
      <FlyingBird top="8%" duration={16} delay={0} scale={0.9} opacity={0.85} />
      <FlyingBird top="11%" duration={18} delay={1.8} scale={0.7} opacity={0.75} />
      <FlyingBird top="9%" duration={15} delay={3.2} scale={0.5} opacity={0.65} />
      <FlyingBird top="14%" duration={20} delay={6} scale={0.85} opacity={0.8} />
      <FlyingBird top="18%" duration={22} delay={10} scale={0.6} opacity={0.7} />
      <FlyingBird top="21%" duration={24} delay={12} scale={0.5} opacity={0.6} />
      <FlyingBird top="15%" duration={19} delay={14.5} scale={0.75} opacity={0.75} />
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
        'relative w-full overflow-hidden select-none shadow-2xl bg-slate-950 border-b border-[var(--color-beige)]',
        'h-[clamp(500px,64vw,760px)]',
        className,
      )}
    >
      {/* --------------------------- Edge-to-Edge Photorealistic Image --------------------------- */}
      <motion.img
        src="/campus_cafes.jpeg"
        alt="VIT Bhopal Campus & Food Street"
        className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Atmospheric Overlays */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-sky-400/10 via-transparent to-amber-950/30"
      />

      {/* Flying Birds */}
      <FlockOfBirds />

      {/* --------------------------- Storefront Hotspot Overlays (Edge-to-Edge & Glow Only) --------------------------- */}
      <div className="absolute inset-x-0 bottom-0 top-[48%] z-20 px-2 sm:px-8 pb-4 sm:pb-6 flex items-end justify-between gap-2 sm:gap-6 max-w-[1400px] mx-auto">
        {shopData.map((shop) => {
          const isHovered = hoveredShop === shop.id;

          return (
            <motion.div
              key={shop.id}
              className="relative flex-1 h-full max-h-[340px] flex flex-col justify-end"
              onMouseEnter={() => setHoveredShop(shop.id)}
              onMouseLeave={() => setHoveredShop(null)}
            >
              {/* Floating Live Glassmorphism Status Card on Hover (No Border Box On Storefront itself) */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-[108%] left-1/2 -translate-x-1/2 w-[calc(100%+24px)] min-w-[220px] max-w-[280px] p-4 rounded-2xl glass-solid shadow-2xl z-30 pointer-events-none backdrop-blur-xl bg-white/95 border border-amber-300/80"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[14px] font-bold text-slate-900 truncate">
                        {shop.name}
                      </span>
                      <span
                        className={cx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          shop.open
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300',
                        )}
                      >
                        {shop.open ? '● Open' : 'Closed'}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-600 line-clamp-2 mb-3 leading-snug">
                      {shop.description}
                    </p>

                    <div className="flex items-center justify-between gap-1.5 text-[11px] pt-2 border-t border-slate-200">
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <Clock3 size={12} className="text-[#D95D39]" />
                        ~{shop.wait} min wait
                      </span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Users size={11} />
                        {shop.queueCount} in queue
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transparent Clickable Hotspot with SOFT GLOW ONLY (NO RECTANGULAR BORDER ON HOVER) */}
              <button
                type="button"
                onClick={() => onSelect(shop.id)}
                aria-label={`Order from ${shop.name}`}
                className={cx(
                  'w-full h-[88%] rounded-2xl p-3 sm:p-4 text-left flex flex-col justify-between transition-all duration-300 group cursor-pointer relative overflow-hidden',
                  isHovered
                    ? 'bg-amber-300/15 shadow-[0_0_50px_rgba(243,167,18,0.45)] scale-[1.02]'
                    : 'bg-transparent hover:scale-[1.01]',
                )}
              >
                {/* Warm Storefront Light Flare Effect on Hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, ${shop.brandColor}66 0%, transparent 70%)`,
                  }}
                />

                {/* Subtle Floating Storefront Badge */}
                <div className="relative z-10 flex items-center justify-between gap-1">
                  <span
                    className="px-3 py-1 rounded-lg text-[11px] sm:text-[12px] font-bold text-white uppercase tracking-wider shadow-lg backdrop-blur-md transition-transform group-hover:scale-105"
                    style={{ backgroundColor: shop.brandColor }}
                  >
                    {shop.name}
                  </span>

                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/85 text-amber-300 text-[10px] font-bold shadow-md border border-white/20">
                    ~{shop.wait}m
                  </span>
                </div>

                {/* Bottom Storefront Indicator */}
                <div className="relative z-10 flex items-center justify-between gap-2 pt-2">
                  <span className="text-[11.5px] font-bold text-white drop-shadow-md truncate opacity-90 group-hover:opacity-100">
                    {shop.sub ?? 'Campus Counter'}
                  </span>

                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:scale-110 transition-all shadow-xl">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Top Instructions Pill */}
      <div className="absolute top-20 right-6 z-20 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-white text-[12px] shadow-2xl">
        <Sparkles size={14} className="text-amber-400 animate-pulse" />
        <span>Hover &amp; tap any cafe storefront to order</span>
      </div>
    </div>
  );
}
