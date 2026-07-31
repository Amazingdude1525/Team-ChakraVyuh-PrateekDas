import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock3,
  Cpu,
  Database,
  GraduationCap,
  Smartphone,
  Store,
  Ticket,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { Button, Card, Chip, JaaliDivider } from '../../components/ui/primitives';
import { BRANCHES, CAFES } from '../../data/cafes';

const ARCHITECTURE_STEPS = [
  {
    step: '01',
    title: 'Student Order Dispatch',
    icon: Smartphone,
    color: '#D95D39',
    description: 'Student browses live menu, selects items & payment mode (UPI / Counter). System calculates 5-min pickup slot based on queue load.',
    details: ['Item customization & diet filters', 'Group order code generation', 'Unique token minting (e.g. #UB-42)'],
  },
  {
    step: '02',
    title: 'Realtime State & Event Pipeline',
    icon: Database,
    color: '#F3A712',
    description: 'Order state is committed to Zustand reactive state engine with synchronous local persistence, broadcasting updates across active screens.',
    details: ['Zustand reactive store', 'LocalStorage snapshotting', 'Instant cross-tab sync'],
  },
  {
    step: '03',
    title: 'Kitchen Display System (KDS)',
    icon: ChefHat,
    color: '#196B45',
    description: 'Kitchen screen receives order token. Cooks tap to mark individual items through prep stages with urgency color coding.',
    details: ['Item-level prep status tracking', 'Urgency timer (Green/Amber/Red)', 'Auto-ready when all items done'],
  },
  {
    step: '04',
    title: 'Counter Pickup & Notification',
    icon: CheckCircle2,
    color: '#3B82F6',
    description: 'Student receives instant "Order Ready" alert. Presents token at counter during 5-minute window for 0-wait collection.',
    details: ['Live status notification', '5-minute pickup slot guarantee', 'Counter staff token validation'],
  },
];

const PRINCIPLES = [
  {
    icon: Clock3,
    title: 'Say a number, and mean it',
    body: 'A vague "soon" is worse than a longer honest estimate. Every wait we quote comes from the counter\'s real queue depth, and when the kitchen slips the estimate moves rather than quietly going stale.',
  },
  {
    icon: Ticket,
    title: 'One token, one counter',
    body: 'An order is collected from one place, so a cart holds one cafe at a time. It sounds like a limitation; in practice it is the thing that stops a student standing between two counters holding half an order.',
  },
  {
    icon: Store,
    title: 'The counter is a user too',
    body: 'The staff screens are not an afterthought. The counter view is built for someone standing with a queue in front of them, and the kitchen display is built to be read from across a hot kitchen.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-ivory)]">
      <header className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[var(--color-saffron)] flex items-center justify-center shadow-md">
            <UtensilsCrossed size={18} className="text-[var(--color-charcoal)]" />
          </span>
          <span className="font-display text-[22px] leading-none text-[#1E293B]">
            VIT<span className="text-[#D95D39]">eBites</span>
          </span>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" className="rounded-xl">
            <ArrowLeft size={15} />
            Home
          </Button>
        </Link>
      </header>

      <main className="flex-1 max-w-[920px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <Chip tone="saffron" className="mb-4 shadow-sm">
          About the project &amp; System Architecture
        </Chip>

        <h1 className="font-display text-[clamp(32px,5vw,52px)] leading-tight text-[#1E293B]">
          Peak hour is the only hour that matters
        </h1>

        <p className="mt-5 text-[16px] leading-relaxed text-slate-600">
          Between 12:30 and 2:00 every counter on campus has a queue, and every queue has the same
          problem: nobody in it knows how long they will be standing there. VITeBites is a pre-order
          and token system built for exactly that window — order ahead from wherever you are, get a
          five-minute pickup slot, and walk up when your token is called.
        </p>

        <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
          It covers {CAFES.length} brands across {BRANCHES.length} counters at VIT Bhopal, with menus
          transcribed from the physical boards at each one — the same items, the same half and full
          sizes, the same prices.
        </p>

        <JaaliDivider className="my-10" />

        {/* ----------------------------------- SYSTEM ARCHITECTURE SECTION ----------------------------------- */}
        <section className="my-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Cpu size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#D95D39]">
              Data Pipeline &amp; Workflow
            </span>
          </div>

          <h2 className="font-display text-[clamp(26px,4vw,38px)] text-[#1E293B] mb-3">
            System Architecture: How an Order Flows
          </h2>
          <p className="text-[15px] text-slate-600 mb-8 max-w-[680px]">
            From the moment a student taps "Place Order" to the final counter pickup, explore how
            data moves through the reactive state pipeline in real time.
          </p>

          {/* Interactive Flow Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {ARCHITECTURE_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="p-6 h-full relative overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-shadow bg-white rounded-2xl">
                  {/* Step Number Badge */}
                  <span
                    aria-hidden
                    className="absolute -top-3 -right-2 font-display text-[72px] font-black leading-none opacity-10 pointer-events-none select-none text-slate-900"
                  >
                    {s.step}
                  </span>

                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                      style={{ backgroundColor: s.color }}
                    >
                      <s.icon size={20} />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Stage {s.step}
                      </span>
                      <h3 className="text-[16px] font-bold text-[#1E293B]">{s.title}</h3>
                    </div>
                  </div>

                  <p className="text-[13.5px] text-slate-600 leading-relaxed mb-4">
                    {s.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    {s.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                        <Zap size={12} className="text-amber-500 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <JaaliDivider className="my-10" />

        <h2 className="font-display text-[28px] text-[#1E293B] mb-5">
          What it is built around
        </h2>

        <div className="space-y-5">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} className="p-5 flex gap-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <span className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                <p.icon size={20} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#1E293B]">{p.title}</h3>
                <p className="text-[13.5px] text-slate-600 leading-relaxed mt-1.5">
                  {p.body}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <JaaliDivider className="my-10" />

        {/* ----------------------------------------- CREATORS SECTION ----------------------------------------- */}
        <section className="my-8">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={20} className="text-[#D95D39]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Project Creators &amp; Team
            </span>
          </div>

          <h2 className="font-display text-[30px] text-[#1E293B] mb-4">
            Built by Students for Students
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-md flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D95D39] to-[#F3A712] text-white font-display text-xl font-bold flex items-center justify-center shrink-0 shadow-md">
                PD
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#1E293B]">Prateek Das</h3>
                <p className="text-[13px] font-medium text-[#D95D39]">ID: 25BCE10599</p>
                <p className="text-[12px] text-slate-500 mt-1">VIT Bhopal University</p>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-md flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#196B45] to-[#F3A712] text-white font-display text-xl font-bold flex items-center justify-center shrink-0 shadow-md">
                AC
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#1E293B]">Anushka Chatterjee</h3>
                <p className="text-[13px] font-medium text-[#196B45]">ID: 25BCE11276</p>
                <p className="text-[12px] text-slate-500 mt-1">VIT Bhopal University</p>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-[12px] text-slate-500">
        <p>&copy; 2026 VITeBites — Created by Prateek Das &amp; Anushka Chatterjee</p>
      </footer>
    </div>
  );
}
