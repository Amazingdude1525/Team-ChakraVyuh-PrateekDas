import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ChefHat, Clock3, LogOut } from 'lucide-react';
import { Button, Card, Chip, CrowdChip } from '../../components/ui/primitives';
import { CafeMark } from '../../components/student/cards';
import { useBranches } from '../../hooks';
import { STAFF_ACCOUNTS, useStore } from '../../store/useStore';
import { crowdLevel, isBranchOpen } from '../../utils';

/** Counter picker, for staff who cover more than one counter. */
export default function SelectCafe() {
  const navigate = useNavigate();
  const branches = useBranches();
  const orders = useStore((s) => s.orders);
  const loginStaff = useStore((s) => s.loginStaff);
  const signOut = useStore((s) => s.signOut);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-charcoal)]">
      <header className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--color-saffron)] flex items-center justify-center">
            <ChefHat size={18} className="text-[var(--color-charcoal)]" />
          </span>
          <span className="font-display text-[20px] leading-none text-[var(--color-cream)]">
            VITe<span className="text-[var(--color-saffron)]">Bites</span>
            <span className="text-[13px] text-[#8d857a] ml-2 font-sans">Staff</span>
          </span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="text-[#b5ada0] hover:bg-[#2a2723] hover:text-white"
          onClick={() => {
            signOut();
            navigate('/');
          }}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </header>

      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-[520px] mb-9">
          <h1 className="font-display text-[clamp(28px,4.4vw,42px)] leading-tight text-[var(--color-cream)]">
            Which counter today?
          </h1>
          <p className="mt-3 text-[14px] text-[#b5ada0] leading-relaxed">
            Pick the counter you are working. Each one has its own order queue, menu and kitchen
            display.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch, i) => {
            const open = isBranchOpen(branch);
            const active = orders.filter(
              (o) => o.branchId === branch.id && ['placed', 'preparing', 'ready'].includes(o.status),
            ).length;

            return (
              <motion.button
                key={branch.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                onClick={() => {
                  loginStaff(branch.id, 'counter');
                  navigate(`/staff/select-mode/${branch.id}`);
                }}
                className="text-left"
              >
                <Card className="p-5 h-full hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-start gap-3 mb-3">
                    <CafeMark branch={branch} size={46} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] truncate">
                        {branch.name}
                      </h2>
                      <p className="text-[12px] text-[var(--color-ink-soft)] truncate">
                        {branch.location}
                      </p>
                    </div>
                    <Chip tone={open ? 'veg' : 'wine'}>{open ? 'Open' : 'Closed'}</Chip>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <CrowdChip level={crowdLevel(branch.activeOrderCount)} />
                    <Chip tone="brass">
                      <Clock3 size={11} />
                      {branch.opensAt}–{branch.closesAt}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-beige-soft)]">
                    <span className="text-[12.5px] text-[var(--color-ink-muted)]">
                      <span className="font-semibold text-[var(--color-charcoal)]">{active}</span>{' '}
                      live {active === 1 ? 'order' : 'orders'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-terracotta)]">
                      Open panel
                      <ArrowRight size={15} />
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--color-ink-soft)] mt-3">
                    {STAFF_ACCOUNTS[branch.id]?.name}
                  </p>
                </Card>
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
