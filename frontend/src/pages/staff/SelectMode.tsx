import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ChefHat, LayoutGrid, Monitor } from 'lucide-react';
import { Button, Card, JaaliDivider } from '../../components/ui/primitives';
import { CafeMark } from '../../components/student/cards';
import { useBranch } from '../../hooks';
import { useStore } from '../../store/useStore';
import NotFound from '../public/NotFound';

const MODES = [
  {
    mode: 'counter' as const,
    icon: LayoutGrid,
    title: 'Counter panel',
    who: 'For whoever is at the till',
    body: 'The live order queue, one tap per status change, plus the menu, daily insights and closing-time deals.',
    points: [
      'Queue sorted newest first',
      'Toggle items sold out instantly',
      'Today\'s revenue and top sellers',
    ],
  },
  {
    mode: 'kitchen' as const,
    icon: Monitor,
    title: 'Kitchen display',
    who: 'For whoever is cooking',
    body: 'Full-screen tickets sized to read from across the kitchen. Tap each item off as it is plated.',
    points: [
      'Large tokens and item names',
      'Colour escalates as tickets age',
      'Auto-marks ready when all items are done',
    ],
  },
];

export default function SelectMode() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const branch = useBranch(cafeId);
  const loginStaff = useStore((s) => s.loginStaff);

  if (!branch) return <NotFound />;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-charcoal)]">
      <header className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--color-saffron)] flex items-center justify-center">
            <ChefHat size={18} className="text-[var(--color-charcoal)]" />
          </span>
          <span className="font-display text-[20px] leading-none text-[var(--color-cream)]">
            VITe<span className="text-[var(--color-saffron)]">Bites</span>
            <span className="text-[13px] text-[#8d857a] ml-2 font-sans">Staff</span>
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-[#b5ada0] hover:bg-[#2a2723] hover:text-white"
          onClick={() => navigate('/staff/select-cafe')}
        >
          <ArrowLeft size={15} />
          Change counter
        </Button>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-[900px] w-full mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3.5 mb-8">
            <CafeMark branch={branch} size={52} />
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(24px,3.6vw,34px)] leading-tight text-[var(--color-cream)]">
                {branch.name}
              </h1>
              <p className="text-[13px] text-[#b5ada0]">
                {branch.location} · {branch.opensAt}–{branch.closesAt}
              </p>
            </div>
          </div>

          <p className="text-[14px] text-[#b5ada0] mb-6 max-w-[520px] leading-relaxed">
            Two screens, two jobs. You can switch between them at any time from the header.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {MODES.map((m, i) => (
              <motion.button
                key={m.mode}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => {
                  loginStaff(branch.id, m.mode);
                  navigate(`/staff/${branch.id}/${m.mode}`);
                }}
                className="text-left group"
              >
                <Card className="p-6 h-full flex flex-col hover:shadow-lift hover:-translate-y-1 transition-all duration-300">
                  <span className="w-12 h-12 rounded-[13px] bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)] flex items-center justify-center mb-5">
                    <m.icon size={22} />
                  </span>

                  <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-soft)] mb-1.5">
                    {m.who}
                  </div>

                  <h2 className="font-display text-[25px] leading-tight text-[var(--color-charcoal)]">
                    {m.title}
                  </h2>

                  <p className="text-[13.5px] text-[var(--color-ink-muted)] leading-relaxed mt-2.5">
                    {m.body}
                  </p>

                  <JaaliDivider className="my-5" />

                  <ul className="space-y-2 mb-6 flex-1">
                    {m.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2.5 text-[12.5px] text-[var(--color-ink-muted)]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-saffron)] shrink-0 mt-1.5" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--color-terracotta)]">
                    Open {m.title.toLowerCase()}
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
