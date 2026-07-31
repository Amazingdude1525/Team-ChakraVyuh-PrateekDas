import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, Clock3, LogIn, MapPin, QrCode, ScanLine } from 'lucide-react';
import { Button, Card, Chip, CrowdChip, Stars } from '../../components/ui/primitives';
import { CafeMark } from '../../components/student/cards';
import { useBranches } from '../../hooks';
import { useStore } from '../../store/useStore';
import { crowdLevel, isBranchOpen, waitMinutes } from '../../utils';

/**
 * Counter QR landing.
 *
 * A printed code at each counter encodes `/app/qr-entry?cafe=<branchId>`. This
 * screen shows the scan resolving, then either sends a signed-in student
 * straight to that menu or routes them through sign-in first, preserving where
 * they were headed.
 */
export default function QrEntry() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const branches = useBranches();
  const student = useStore((s) => s.student);

  const requested = params.get('cafe');
  const [phase, setPhase] = useState<'scanning' | 'resolved'>('scanning');
  const [selected, setSelected] = useState<string | null>(requested);

  const branch = branches.find((b) => b.id === selected);

  // The "scan" resolving is theatre for a printed code the camera already read.
  useEffect(() => {
    if (!selected) {
      setPhase('resolved');
      return;
    }
    setPhase('scanning');
    const t = setTimeout(() => setPhase('resolved'), 1100);
    return () => clearTimeout(t);
  }, [selected]);

  function continueToMenu() {
    if (!branch) return;
    if (!student) {
      navigate(`/student-login?next=/app/cafe/${branch.id}`);
      return;
    }
    navigate(`/app/cafe/${branch.id}`);
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-7">
        <Chip tone="saffron" className="mb-3">
          <QrCode size={11} />
          Counter QR
        </Chip>
        <h1 className="font-display text-[clamp(24px,4vw,34px)] leading-tight text-[var(--color-charcoal)]">
          {selected ? 'Code scanned' : 'Scan a counter code'}
        </h1>
        <p className="text-[13.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">
          {selected
            ? 'Each counter has a printed code. Scanning it opens that menu directly.'
            : 'Pick a counter below to simulate scanning the code taped to it.'}
        </p>
      </div>

      {/* Scanner illustration */}
      <div className="relative mx-auto w-[190px] h-[190px] rounded-[22px] bg-[var(--color-charcoal)] flex items-center justify-center overflow-hidden mb-7">
        <span aria-hidden className="absolute inset-0 jaali opacity-25" />

        {/* Corner brackets */}
        {[
          'top-4 left-4 border-t-2 border-l-2 rounded-tl-[8px]',
          'top-4 right-4 border-t-2 border-r-2 rounded-tr-[8px]',
          'bottom-4 left-4 border-b-2 border-l-2 rounded-bl-[8px]',
          'bottom-4 right-4 border-b-2 border-r-2 rounded-br-[8px]',
        ].map((cls) => (
          <span key={cls} className={`absolute w-8 h-8 border-[var(--color-saffron)] ${cls}`} />
        ))}

        {phase === 'scanning' ? (
          <>
            <ScanLine size={44} className="text-[var(--color-saffron)] relative" />
            <motion.span
              aria-hidden
              initial={{ y: -60 }}
              animate={{ y: 60 }}
              transition={{ duration: 1.1, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
              className="absolute inset-x-8 h-[2px] bg-[var(--color-saffron)]"
              style={{ boxShadow: '0 0 12px 2px rgba(243,167,18,0.7)' }}
            />
          </>
        ) : branch ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 18 }}
            className="w-14 h-14 rounded-full bg-[var(--color-veg)] text-white flex items-center justify-center relative"
          >
            <Check size={28} strokeWidth={3} />
          </motion.span>
        ) : (
          <QrCode size={54} className="text-[var(--color-saffron)] relative" />
        )}
      </div>

      {/* Resolved cafe */}
      {branch && phase === 'resolved' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-start gap-3.5">
              <CafeMark branch={branch} size={52} />
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-semibold text-[var(--color-charcoal)] truncate">
                  {branch.name}
                </h2>
                <p className="text-[12px] text-[var(--color-ink-soft)] flex items-center gap-1 truncate">
                  <MapPin size={11} />
                  {branch.location}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <Chip tone={isBranchOpen(branch) ? 'veg' : 'wine'}>
                    {isBranchOpen(branch) ? 'Open' : 'Closed'}
                  </Chip>
                  <Stars rating={branch.rating} count={branch.ratingCount} />
                  <CrowdChip level={crowdLevel(branch.activeOrderCount)} />
                  <Chip tone="brass">
                    <Clock3 size={11} />~{waitMinutes(branch)} min
                  </Chip>
                </div>
              </div>
            </div>

            <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed mt-4">
              {branch.description}
            </p>

            {!student && (
              <div className="flex items-start gap-2.5 mt-4 p-3 rounded-[11px] bg-[var(--color-saffron-tint)]">
                <LogIn size={15} className="text-[var(--color-saffron-deep)] shrink-0 mt-px" />
                <p className="text-[12.5px] text-[var(--color-charcoal)] leading-relaxed">
                  You are not signed in. We will take you through sign-in first and bring you
                  straight back to this menu.
                </p>
              </div>
            )}

            <Button fullWidth size="lg" className="mt-4" onClick={continueToMenu}>
              {student ? 'Continue to menu' : 'Sign in and continue'}
              <ArrowRight size={16} />
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Counter picker */}
      <div className="mt-7">
        <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5">
          {selected ? 'Scan a different counter' : 'Which counter are you standing at?'}
        </h2>
        <div className="space-y-2">
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-[12px] border text-left transition-colors ${
                selected === b.id
                  ? 'border-[var(--color-saffron)] bg-[var(--color-saffron-tint)]'
                  : 'border-[var(--color-beige)] bg-[var(--color-cream)] hover:border-[var(--color-brass)]'
              }`}
            >
              <CafeMark branch={b} size={38} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-[var(--color-charcoal)] truncate">
                  {b.name}
                </span>
                <span className="block text-[11.5px] text-[var(--color-ink-soft)] truncate">
                  {b.pickupPoint}
                </span>
              </span>
              {selected === b.id && (
                <Check size={16} className="text-[var(--color-saffron-deep)] shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--color-ink-soft)] text-center mt-6 leading-relaxed">
        In the real product the phone camera opens this link directly from the printed code — no
        in-app scanner needed.{' '}
        <Link to="/app" className="text-[var(--color-terracotta)] hover:underline">
          Browse all cafes instead
        </Link>
      </p>
    </div>
  );
}
