import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, Search, UtensilsCrossed } from 'lucide-react';
import { Button, Card, JaaliDivider } from '../../components/ui/primitives';
import { useBranches } from '../../hooks';
import { isBranchOpen } from '../../utils';

/**
 * 404. Rather than a dead end, it offers the counters that are open right now —
 * which is almost always what the person was looking for.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const branches = useBranches();
  const openBranches = branches.filter((b) => isBranchOpen(b)).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--color-saffron)] flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-[var(--color-charcoal)]" />
          </span>
          <span className="font-display text-[20px] leading-none text-[var(--color-charcoal)]">
            VITe<span className="text-[var(--color-terracotta)]">Bites</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[520px] text-center"
        >
          <div
            aria-hidden
            className="font-display text-[clamp(84px,18vw,150px)] leading-none text-[var(--color-saffron)]/25 select-none"
          >
            404
          </div>

          <h1 className="font-display text-[clamp(24px,4vw,34px)] leading-tight text-[var(--color-charcoal)] -mt-3">
            That counter does not exist
          </h1>

          <p className="mt-3 text-[14px] text-[var(--color-ink-muted)] leading-relaxed max-w-[400px] mx-auto">
            We could not find{' '}
            <code className="px-1.5 py-0.5 rounded-[5px] bg-[var(--color-sand)] text-[12.5px] text-[var(--color-charcoal)] break-all">
              {location.pathname}
            </code>
            . It may have moved, or the link may be mistyped.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Button size="lg" onClick={() => navigate('/app')}>
              <Home size={16} />
              Go to the app
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              Back
            </Button>
          </div>

          {openBranches.length > 0 && (
            <Card className="mt-9 p-5 text-left">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)]">
                  Open right now
                </h2>
                <Link
                  to="/app/search"
                  className="text-[12px] text-[var(--color-terracotta)] hover:underline inline-flex items-center gap-1"
                >
                  <Search size={12} />
                  Search
                </Link>
              </div>
              <JaaliDivider className="mb-3" />
              <ul className="space-y-1">
                {openBranches.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/app/cafe/${b.id}`}
                      className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-[9px] hover:bg-[var(--color-sand)] transition-colors"
                    >
                      <span className="text-[13.5px] text-[var(--color-charcoal)]">{b.name}</span>
                      <span className="text-[11.5px] text-[var(--color-ink-soft)]">{b.location}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
