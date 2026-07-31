import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Mail, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { Button, Card, Chip, Field, Input } from '../../components/ui/primitives';
import { useStore } from '../../store/useStore';
import { cx } from '../../utils';

/**
 * Simulated VIT sign-in.
 *
 * Three steps — email, one-time code, confirmation. No network calls: the
 * domain rule and the code check both run locally, which is enough to show the
 * flow a real Supabase/OTP integration would slot into.
 */

const VIT_DOMAIN = '@vitbhopal.ac.in';
const MOCK_OTP = '123456';
const RESEND_SECONDS = 30;

/** Derives a display name from a VIT address like prateek.24bce10599@… */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const first = local.split('.')[0] ?? 'Student';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function registrationFromEmail(email: string): string {
  const match = email.match(/(\d{2}[a-z]{3}\d{5})/i);
  return match ? match[1].toUpperCase() : '24BCE10000';
}

export default function StudentLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const loginStudent = useStore((s) => s.loginStudent);

  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  /** A QR scan can carry the cafe the student was standing at. */
  const nextPath = params.get('next') ?? '/app';

  // Resend countdown, restarted each time we enter the code step.
  useEffect(() => {
    if (step !== 'otp') return;
    setSecondsLeft(RESEND_SECONDS);
    const t = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? (clearInterval(t), 0) : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (step === 'otp') inputsRef.current[0]?.focus();
  }, [step]);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();

    if (!value) {
      setEmailError('Enter your VIT email address.');
      return;
    }
    if (!value.endsWith(VIT_DOMAIN)) {
      setEmailError(`VITeBites is open to ${VIT_DOMAIN} addresses only.`);
      return;
    }
    if (value.length <= VIT_DOMAIN.length) {
      setEmailError('That address is missing a username.');
      return;
    }

    setEmailError(null);
    setEmail(value);
    setStep('otp');
  }

  function finish(profileEmail: string) {
    loginStudent({
      email: profileEmail,
      name: nameFromEmail(profileEmail),
      registrationNumber: registrationFromEmail(profileEmail),
    });
    setStep('done');
    setTimeout(() => navigate(nextPath, { replace: true }), 1150);
  }

  function verify(code: string) {
    setVerifying(true);
    setOtpError(null);
    // A short delay so the verifying state is visible, as it would be for real.
    setTimeout(() => {
      if (code === MOCK_OTP) {
        finish(email);
      } else {
        setVerifying(false);
        setOtpError('That code is not right. For this prototype, use 123456.');
        setDigits(Array(6).fill(''));
        inputsRef.current[0]?.focus();
      }
    }, 550);
  }

  function setDigit(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setOtpError(null);

    if (char && index < 5) inputsRef.current[index + 1]?.focus();
    if (next.every((d) => d !== '')) verify(next.join(''));
  }

  function onOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus();
  }

  /** Pasting the whole code into any box fills every box. */
  function onOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6)
      .fill('')
      .map((_, i) => pasted[i] ?? '');
    setDigits(next);
    if (pasted.length === 6) verify(pasted);
    else inputsRef.current[pasted.length]?.focus();
  }

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
        <Link to="/choose-role">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={15} />
            Back
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {/* ------------------------------------------------ step: email */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <Card className="p-6 sm:p-7">
                  <span className="w-11 h-11 rounded-[12px] bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)] flex items-center justify-center mb-5">
                    <Mail size={20} />
                  </span>

                  <h1 className="font-display text-[28px] leading-tight text-[var(--color-charcoal)]">
                    Sign in to order
                  </h1>
                  <p className="text-[13.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                    Use your VIT Bhopal address. We will send a six-digit code to confirm it is you.
                  </p>

                  <form onSubmit={submitEmail} className="mt-6 space-y-4" noValidate>
                    <Field
                      label="VIT email address"
                      htmlFor="email"
                      error={emailError ?? undefined}
                      hint={`Must end in ${VIT_DOMAIN}`}
                    >
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder={`yourname.24bce10599${VIT_DOMAIN}`}
                        value={email}
                        error={emailError ?? undefined}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError(null);
                        }}
                      />
                    </Field>

                    <Button type="submit" fullWidth size="lg">
                      Send code
                    </Button>
                  </form>

                  <div className="flex items-center gap-3 my-5">
                    <span className="flex-1 brass-rule" />
                    <span className="text-[11px] text-[var(--color-ink-soft)]">or</span>
                    <span className="flex-1 brass-rule" />
                  </div>

                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => finish('prateek.24bce10599@vitbhopal.ac.in')}
                  >
                    Continue with demo student
                  </Button>

                  <p className="text-[11.5px] text-[var(--color-ink-soft)] mt-4 flex items-start gap-2 leading-relaxed">
                    <ShieldCheck size={14} className="text-[var(--color-veg)] shrink-0 mt-px" />
                    Prototype sign-in. Nothing is sent anywhere and no account is created.
                  </p>
                </Card>
              </motion.div>
            )}

            {/* -------------------------------------------------- step: otp */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <Card className="p-6 sm:p-7">
                  <h1 className="font-display text-[27px] leading-tight text-[var(--color-charcoal)]">
                    Enter your code
                  </h1>
                  <p className="text-[13.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                    We sent a six-digit code to{' '}
                    <span className="text-[var(--color-charcoal)] font-medium break-all">{email}</span>.
                  </p>

                  <Chip tone="saffron" className="mt-3">
                    Prototype code: {MOCK_OTP}
                  </Chip>

                  <div className="mt-6">
                    <label className="block text-[13px] font-medium text-[var(--color-charcoal)] mb-2.5">
                      Six-digit code
                    </label>
                    <div className="flex gap-2 justify-between" onPaste={onOtpPaste}>
                      {digits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            inputsRef.current[i] = el;
                          }}
                          value={digit}
                          onChange={(e) => setDigit(i, e.target.value)}
                          onKeyDown={(e) => onOtpKeyDown(i, e)}
                          inputMode="numeric"
                          autoComplete={i === 0 ? 'one-time-code' : 'off'}
                          maxLength={1}
                          disabled={verifying}
                          aria-label={`Digit ${i + 1} of 6`}
                          className={cx(
                            'w-full aspect-square max-w-[54px] rounded-[11px] border text-center text-[20px] font-semibold',
                            'bg-[var(--color-cream)] text-[var(--color-charcoal)] transition-colors disabled:opacity-60',
                            otpError
                              ? 'border-[var(--color-wine)]'
                              : digit
                                ? 'border-[var(--color-saffron)]'
                                : 'border-[var(--color-beige)] focus:border-[var(--color-saffron)]',
                          )}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p role="alert" className="text-[12px] text-[var(--color-wine)] mt-2.5">
                        {otpError}
                      </p>
                    )}
                    {verifying && (
                      <p className="text-[12px] text-[var(--color-ink-muted)] mt-2.5">
                        Checking your code…
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-6 text-[12.5px]">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setDigits(Array(6).fill(''));
                        setOtpError(null);
                      }}
                      className="text-[var(--color-terracotta)] hover:underline"
                    >
                      Change email
                    </button>

                    {secondsLeft > 0 ? (
                      <span className="text-[var(--color-ink-soft)] tabular-nums">
                        Resend in {secondsLeft}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSecondsLeft(RESEND_SECONDS)}
                        className="text-[var(--color-terracotta)] hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ------------------------------------------------- step: done */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              >
                <Card className="p-8 text-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-[var(--color-veg-tint)] text-[var(--color-veg)] flex items-center justify-center mx-auto mb-5"
                  >
                    <Check size={30} strokeWidth={3} />
                  </motion.span>

                  <h1 className="font-display text-[26px] text-[var(--color-charcoal)]">
                    You are signed in
                  </h1>
                  <p className="text-[13.5px] text-[var(--color-ink-muted)] mt-2">
                    Taking you to the campus counters…
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
