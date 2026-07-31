import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ChefHat, GraduationCap, UtensilsCrossed } from 'lucide-react';
import { Button, Chip, JaaliDivider } from '../../components/ui/primitives';

/**
 * The fork in the road. Two cards, deliberately different in weight — the
 * student path is the common one and reads warm and inviting; the staff path
 * reads like equipment, because that is what it is.
 */

const ROLES = [
  {
    to: '/student-login',
    icon: GraduationCap,
    eyebrow: 'For students and faculty',
    title: 'I am ordering food',
    body: 'Browse all five campus counters, order ahead between lectures and collect with a token.',
    points: ['Live wait estimates', 'Order ahead and skip the queue', 'Group orders with friends'],
    cta: 'Continue with VIT email',
    tone: 'student' as const,
  },
  {
    to: '/vendor-login',
    icon: ChefHat,
    eyebrow: 'For cafe staff',
    title: 'I run a counter',
    body: 'Manage the incoming queue, run the kitchen display and keep the menu current.',
    points: ['Counter order queue', 'Kitchen display system', 'Menu and surplus deals'],
    cta: 'Staff sign in',
    tone: 'staff' as const,
  },
];

export default function ChooseRole() {
  const navigate = useNavigate();

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
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={15} />
          Back
        </Button>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="text-center max-w-[520px] mx-auto mb-10">
            <Chip tone="saffron" className="mb-3">
              VIT Bhopal campus
            </Chip>
            <h1 className="font-display text-[clamp(28px,4.4vw,44px)] leading-tight text-[var(--color-charcoal)]">
              How will you be using VITeBites?
            </h1>
            <p className="mt-3 text-[14px] text-[var(--color-ink-muted)] leading-relaxed">
              Pick the side you are on. You can sign out and switch at any time.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 max-w-[860px] mx-auto">
            {ROLES.map((role, i) => {
              const isStudent = role.tone === 'student';
              return (
                <motion.button
                  key={role.to}
                  type="button"
                  onClick={() => navigate(role.to)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className={`group text-left rounded-[18px] p-6 sm:p-7 border transition-all duration-300 hover:-translate-y-1 ${
                    isStudent
                      ? 'bg-[var(--color-cream)] border-[var(--color-beige)] hover:border-[var(--color-saffron)] shadow-warm hover:shadow-lift'
                      : 'bg-[var(--color-charcoal)] border-[#33302b] hover:border-[var(--color-brass)] shadow-warm hover:shadow-warm-lg'
                  }`}
                >
                  <span
                    className={`w-12 h-12 rounded-[13px] flex items-center justify-center mb-5 ${
                      isStudent
                        ? 'bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)]'
                        : 'bg-[#2a2723] text-[var(--color-saffron)]'
                    }`}
                  >
                    <role.icon size={22} />
                  </span>

                  <div
                    className={`text-[11px] font-medium tracking-wide uppercase mb-1.5 ${
                      isStudent ? 'text-[var(--color-ink-soft)]' : 'text-[var(--color-brass)]'
                    }`}
                  >
                    {role.eyebrow}
                  </div>

                  <h2
                    className={`font-display text-[26px] leading-tight ${
                      isStudent ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-cream)]'
                    }`}
                  >
                    {role.title}
                  </h2>

                  <p
                    className={`text-[13.5px] leading-relaxed mt-2.5 ${
                      isStudent ? 'text-[var(--color-ink-muted)]' : 'text-[#b5ada0]'
                    }`}
                  >
                    {role.body}
                  </p>

                  <JaaliDivider className="my-5" />

                  <ul className="space-y-2 mb-6">
                    {role.points.map((p) => (
                      <li
                        key={p}
                        className={`flex items-center gap-2.5 text-[12.5px] ${
                          isStudent ? 'text-[var(--color-ink-muted)]' : 'text-[#c4bcae]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isStudent ? 'bg-[var(--color-saffron)]' : 'bg-[var(--color-brass)]'
                          }`}
                        />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <span
                    className={`inline-flex items-center gap-2 text-[14px] font-medium ${
                      isStudent ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-saffron)]'
                    }`}
                  >
                    {role.cta}
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-center text-[12px] text-[var(--color-ink-soft)] mt-8">
            This is a prototype — sign-in is simulated and no data leaves your browser.
          </p>
        </div>
      </main>
    </div>
  );
}
