import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

/* ------------------------------------------------------------------ *
 *  CafeStreetScene
 *  A layered, scroll-parallaxed illustration of the VIT Bhopal campus
 *  street: sky -> treeline -> academic block -> shopfront row -> road.
 *  Every shopfront is a real, focusable button. Hovering one ignites its
 *  interior lamps (see .lamp / .shop-spill in index.css) and dims the
 *  neighbours so the hovered cafe reads as "open".
 * ------------------------------------------------------------------ */

export type CafeKey = 'underbelly' | 'mayuri' | 'dakshin' | 'bistro';

export interface CafeDef {
  key: CafeKey;
  /** Signage line 1 */
  sign: string;
  /** Signage line 2 (optional, smaller) */
  signSub?: string;
  /** Chalkboard copy on the pavement */
  chalk: string[];
  location: string;
  /** Facade + trim palette */
  facade: string;
  facadeDark: string;
  trim: string;
  signBoard: string;
  signColor: string;
  /** true -> the striped awning treatment (Mayuri) */
  striped?: boolean;
  /** shows the "2 outlets" affordance */
  hasBranches?: boolean;
  signFont: string;
}

export const CAFES: CafeDef[] = [
  {
    key: 'underbelly',
    sign: 'UNDER',
    signSub: 'Belly',
    chalk: ['Good Food', 'Good Mood'],
    location: 'Near AB-1',
    facade: '#3A2B26',
    facadeDark: '#241A16',
    trim: '#E8A33D',
    signBoard: '#141414',
    signColor: '#F26430',
    signFont: 'var(--font-display)',
  },
  {
    key: 'mayuri',
    sign: "MAYURI'S",
    chalk: ['Homely Meals', 'Happy Feels'],
    location: 'AB-1 & Special Block',
    facade: '#8A5A32',
    facadeDark: '#5E3A1E',
    trim: '#F2C744',
    signBoard: '#6B3F1D',
    signColor: '#FFF0CE',
    striped: true,
    hasBranches: true,
    signFont: 'var(--font-display)',
  },
  {
    key: 'dakshin',
    sign: "AB'S DAKSHIN",
    signSub: 'Food for Thought',
    chalk: ['South Indian', 'Flavours'],
    location: 'Special Block',
    facade: '#1F6B3A',
    facadeDark: '#134525',
    trim: '#F2C744',
    signBoard: '#17703C',
    signColor: '#FFFFFF',
    signFont: 'var(--font-sans)',
  },
  {
    key: 'bistro',
    sign: 'BISTRO',
    signSub: 'by Safal Cafe',
    chalk: ['Coffee, Snacks', 'Good Times'],
    location: 'Special Block',
    facade: '#7A5334',
    facadeDark: '#4E3320',
    trim: '#D9A15B',
    signBoard: '#3B2617',
    signColor: '#FFF6E8',
    signFont: 'var(--font-display)',
  },
];

/* ---------------------------- sub-parts ---------------------------- */

function Lamp({ delay, size = 16 }: { delay: number; size?: number }) {
  return (
    <span className="relative flex items-end justify-center" style={{ width: size + 8 }}>
      {/* cord */}
      <span className="absolute -top-4 h-4 w-px bg-black/30" />
      {/* shade */}
      <span
        className="relative z-10 block rounded-b-full"
        style={{
          width: size,
          height: size * 0.6,
          background: 'linear-gradient(180deg,#C98A3C,#8A5A22)',
        }}
      />
      {/* glow */}
      <span
        className="lamp absolute -bottom-1 rounded-full"
        style={{
          width: size * 1.7,
          height: size * 1.7,
          animationDelay: `${delay}ms`,
          background:
            'radial-gradient(circle, rgba(255,214,140,1) 0%, rgba(255,183,77,0.75) 38%, rgba(255,167,38,0) 72%)',
        }}
      />
    </span>
  );
}

function Chalkboard({ lines, side }: { lines: string[]; side: 'left' | 'right' }) {
  return (
    <div
      className="absolute bottom-1 z-20 hidden w-[62px] rotate-[-4deg] rounded-[4px] border-2 px-1 py-1.5 text-center leading-tight sm:block"
      style={{
        left: side === 'left' ? '-16px' : undefined,
        right: side === 'right' ? '-16px' : undefined,
        background: '#2B211B',
        borderColor: '#8A5A32',
      }}
    >
      {lines.map((l) => (
        <span key={l} className="block text-[7px] font-semibold tracking-wide text-[#FFE7B8]">
          {l}
        </span>
      ))}
    </div>
  );
}

function Shopfront({
  cafe,
  onSelect,
  index,
}: {
  cafe: CafeDef;
  onSelect: (c: CafeDef) => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      aria-label={`Open ${cafe.sign} ${cafe.signSub ?? ''}`.trim()}
      onClick={() => onSelect(cafe)}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="shopfront group relative flex w-full max-w-[300px] flex-1 cursor-pointer flex-col rounded-t-[10px] text-left"
    >
      {/* warm light spilling onto the pavement when open */}
      <span
        className="shop-spill pointer-events-none absolute -bottom-8 left-1/2 h-16 w-[130%] -translate-x-1/2 rounded-[50%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,190,90,0.55) 0%, rgba(255,190,90,0) 70%)',
        }}
      />

      {/* ---- signboard ---- */}
      <div
        className="relative z-10 rounded-t-[10px] border-b-4 px-2 py-2.5 text-center"
        style={{ background: cafe.signBoard, borderColor: cafe.trim }}
      >
        <span
          className="shop-sign block truncate text-[13px] font-black leading-none tracking-wide sm:text-[15px]"
          style={{ color: cafe.signColor, fontFamily: cafe.signFont }}
        >
          {cafe.sign}
        </span>
        {cafe.signSub && (
          <span
            className="shop-sign mt-0.5 block truncate text-[8px] font-medium italic opacity-90"
            style={{ color: cafe.trim }}
          >
            {cafe.signSub}
          </span>
        )}
      </div>

      {/* ---- awning ---- */}
      <div
        className="h-3 w-full"
        style={
          cafe.striped
            ? {
                background:
                  'repeating-linear-gradient(90deg,#E23744 0 10px,#FFF6E8 10px 20px)',
              }
            : { background: cafe.trim }
        }
      />

      {/* ---- facade + window ---- */}
      <div
        className="relative overflow-hidden px-2 pb-0 pt-2"
        style={{
          background: `linear-gradient(180deg, ${cafe.facade} 0%, ${cafe.facadeDark} 100%)`,
        }}
      >
        {/* interior */}
        <div
          className="relative flex h-[104px] items-start justify-around rounded-t-[6px] border-2 px-2 pt-5 sm:h-[124px]"
          style={{
            borderColor: cafe.trim,
            background:
              'linear-gradient(180deg,#412C1B 0%,#5C3E24 45%,#2A1B10 100%)',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Lamp key={i} delay={i * 220} size={i % 2 ? 14 : 17} />
          ))}

          {/* seating silhouettes */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-2 opacity-70">
            {[0, 1, 2].map((i) => (
              <span key={i} className="flex flex-col items-center">
                <span className="h-3 w-3 rounded-full bg-black/45" />
                <span className="h-4 w-6 rounded-t-md bg-black/45" />
              </span>
            ))}
          </div>
        </div>

        {/* planters */}
        <div className="flex items-end justify-between px-1">
          {[0, 1].map((i) => (
            <span key={i} className="flex flex-col items-center">
              <span className="text-[10px] leading-none">🪴</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---- hover label ---- */}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-text-primary px-3 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        {cafe.hasBranches ? 'Choose an outlet →' : `View menu · ${cafe.location}`}
      </span>

      <Chalkboard lines={cafe.chalk} side={index % 2 === 0 ? 'left' : 'right'} />
    </motion.button>
  );
}

/* --------------------------- the backdrop -------------------------- */

function AcademicBlock() {
  return (
    <svg viewBox="0 0 620 380" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBF3E6" />
          <stop offset="100%" stopColor="#EADCC6" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C3D6E0" />
          <stop offset="100%" stopColor="#8FAFC0" />
        </linearGradient>
      </defs>

      {/* wings */}
      <rect x="20" y="120" width="180" height="250" fill="url(#wall)" stroke="#D8C6A8" strokeWidth="2" />
      <rect x="420" y="120" width="180" height="250" fill="url(#wall)" stroke="#D8C6A8" strokeWidth="2" />
      {/* centre tower */}
      <rect x="200" y="70" width="220" height="300" fill="url(#wall)" stroke="#D8C6A8" strokeWidth="2" />
      {/* pediment */}
      <polygon points="310,10 415,72 205,72" fill="url(#wall)" stroke="#D8C6A8" strokeWidth="2" />
      <text x="310" y="44" textAnchor="middle" fontSize="21" fontWeight="700" fill="#B03A34" fontFamily="var(--font-display)">
        VIT
      </text>
      <text x="310" y="63" textAnchor="middle" fontSize="12" fontWeight="600" fill="#B03A34" letterSpacing="2">
        BHOPAL
      </text>
      {/* dome */}
      <path d="M540 120 a34 34 0 0 1 68 0 z" fill="#C0392B" />
      {/* window grid */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
          const x = col < 3 ? 40 + col * 52 : col < 7 ? 216 + (col - 3) * 50 : 440 + (col - 7) * 52;
          const y = (col >= 3 && col < 7 ? 96 : 146) + row * 48;
          if (y > 350) return null;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width="30"
              height="34"
              rx="2"
              fill="url(#glass)"
              stroke="#D8C6A8"
              strokeWidth="1.5"
            />
          );
        })
      )}
    </svg>
  );
}

function Treeline({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 1200 220" className="h-full w-full" preserveAspectRatio="none">
        {Array.from({ length: 16 }).map((_, i) => {
          const x = i * 78 + 20;
          const r = 42 + ((i * 13) % 22);
          return (
            <g key={i}>
              <rect x={x - 4} y={140} width="9" height="80" fill="#6E5533" />
              <circle cx={x} cy={140} r={r} fill={i % 2 ? '#7FA05A' : '#6B8F4E'} opacity="0.95" />
              <circle cx={x - r * 0.5} cy={158} r={r * 0.7} fill="#5F8446" opacity="0.9" />
              <circle cx={x + r * 0.5} cy={158} r={r * 0.7} fill="#87A961" opacity="0.9" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------ scene ------------------------------ */

export default function CafeStreetScene({ onSelect }: { onSelect: (c: CafeDef) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const p = (v: number) => (reduce ? '0%' : `${v}%`);
  const skyY = useTransform(scrollYProgress, [0, 1], [p(0), p(14)]);
  const treesY = useTransform(scrollYProgress, [0, 1], [p(0), p(26)]);
  const buildingY = useTransform(scrollYProgress, [0, 1], [p(0), p(-18)]);
  const streetY = useTransform(scrollYProgress, [0, 1], [p(0), p(-38)]);
  const foreY = useTransform(scrollYProgress, [0, 1], [p(0), p(-58)]);

  return (
    <div
      ref={ref}
      className="relative h-[520px] w-full select-none overflow-hidden sm:h-[600px] lg:h-[660px]"
    >
      {/* ---- L1 sky ---- */}
      <motion.div style={{ y: skyY }} className="absolute inset-0 -top-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,#FDF4E6 0%,#FBE9D2 42%,#F7DCC0 72%,#F3D3B4 100%)',
          }}
        />
        <div className="float-slow absolute right-[12%] top-[8%] h-24 w-24 rounded-full bg-[#FFE0B2] opacity-60 blur-2xl" />
        {/* birds */}
        {[
          { l: '18%', t: '14%', s: 1 },
          { l: '30%', t: '9%', s: 0.7 },
          { l: '68%', t: '12%', s: 0.85 },
          { l: '80%', t: '18%', s: 0.6 },
        ].map((b, i) => (
          <svg
            key={i}
            className="float-slow absolute text-[#8A7B66]"
            style={{ left: b.l, top: b.t, transform: `scale(${b.s})`, animationDelay: `${i * 800}ms` }}
            width="26"
            height="10"
            viewBox="0 0 26 10"
            fill="none"
            aria-hidden="true"
          >
            <path d="M1 6c4-5 7-5 11 0 4-5 7-5 12 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ))}
      </motion.div>

      {/* ---- L2 far treeline ---- */}
      <motion.div style={{ y: treesY }} className="absolute inset-x-0 bottom-[34%] h-[180px] opacity-55">
        <Treeline className="h-full w-full" />
      </motion.div>

      {/* ---- L3 academic block ---- */}
      <motion.div
        style={{ y: buildingY }}
        className="absolute left-1/2 top-[6%] h-[62%] w-[min(640px,78vw)] -translate-x-1/2"
      >
        <AcademicBlock />
      </motion.div>

      {/* ---- L4 near treeline ---- */}
      <motion.div style={{ y: treesY }} className="absolute inset-x-0 bottom-[30%] h-[200px] opacity-85">
        <Treeline className="h-full w-full" />
      </motion.div>

      {/* ---- L5 the street of cafes ---- */}
      <motion.div
        style={{ y: streetY }}
        className="street absolute inset-x-0 bottom-[16%] z-20 mx-auto flex w-full max-w-6xl items-end gap-2 px-3 sm:gap-4 sm:px-6"
      >
        {CAFES.map((cafe, i) => (
          <Shopfront key={cafe.key} cafe={cafe} index={i} onSelect={onSelect} />
        ))}
      </motion.div>

      {/* ---- L6 pavement + road ---- */}
      <motion.div style={{ y: foreY }} className="absolute inset-x-0 bottom-0 z-30 h-[18%]">
        <div className="h-[45%] w-full bg-[#E4D3B8]" />
        <div className="h-[55%] w-full bg-[#5C5751]">
          <div className="mt-3 flex justify-around">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="h-1 w-8 rounded bg-[#E8DFCB]/70" />
            ))}
          </div>
        </div>
        {/* street lamps */}
        {['4%', '96%'].map((left, i) => (
          <div key={i} className="absolute bottom-[45%]" style={{ left }}>
            <div className="h-24 w-1 rounded bg-[#3B3730]" />
            <div className="absolute -top-2 -left-1.5 h-3 w-4 rounded-t-full bg-[#3B3730]" />
            <div className="absolute -top-3 -left-4 h-9 w-9 rounded-full bg-[#FFD08A] opacity-40 blur-lg" />
          </div>
        ))}
      </motion.div>

      {/* bottom fade into the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-16 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
