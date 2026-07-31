import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ChefHat, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button, Card, Field, Input, Select } from '../../components/ui/primitives';
import { BRANCHES } from '../../data/cafes';
import { STAFF_ACCOUNTS, STAFF_PASSWORD, useStore } from '../../store/useStore';

/**
 * Staff sign-in. Separate route and separate visual weight from the student
 * flow — dark, utilitarian, no VIT domain rule, because counter staff do not
 * have campus addresses.
 */

export default function VendorLogin() {
  const navigate = useNavigate();
  const loginStaff = useStore((s) => s.loginStaff);

  const [branchId, setBranchId] = useState(BRANCHES[0].id);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const expectedEmail = STAFF_ACCOUNTS[branchId]?.email ?? '';

  function fillDemo() {
    setEmail(expectedEmail);
    setPassword(STAFF_PASSWORD);
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};

    if (!email.trim()) next.email = 'Enter your staff email.';
    else if (email.trim().toLowerCase() !== expectedEmail)
      next.email = `That address is not registered to ${BRANCHES.find((b) => b.id === branchId)?.name}.`;

    if (!password) next.password = 'Enter your password.';
    else if (password !== STAFF_PASSWORD) next.password = 'Incorrect password for this counter.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      // Mode is chosen on the next screen; counter is the sensible default.
      loginStaff(branchId, 'counter');
      setSuccess(true);
      setTimeout(() => navigate(`/staff/select-mode/${branchId}`, { replace: true }), 900);
    }, 500);
  }

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
        <Link to="/choose-role">
          <Button variant="ghost" size="sm" className="text-[#b5ada0] hover:bg-[#2a2723] hover:text-white">
            <ArrowLeft size={15} />
            Back
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[420px]"
        >
          {success ? (
            <Card className="p-8 text-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className="w-16 h-16 rounded-full bg-[var(--color-veg-tint)] text-[var(--color-veg)] flex items-center justify-center mx-auto mb-5"
              >
                <Check size={30} strokeWidth={3} />
              </motion.span>
              <h1 className="font-display text-[26px] text-[var(--color-charcoal)]">Signed in</h1>
              <p className="text-[13.5px] text-[var(--color-ink-muted)] mt-2">
                Opening {BRANCHES.find((b) => b.id === branchId)?.name}…
              </p>
            </Card>
          ) : (
            <Card className="p-6 sm:p-7">
              <span className="w-11 h-11 rounded-[12px] bg-[var(--color-charcoal)] text-[var(--color-saffron)] flex items-center justify-center mb-5">
                <KeyRound size={20} />
              </span>

              <h1 className="font-display text-[28px] leading-tight text-[var(--color-charcoal)]">
                Cafe staff sign in
              </h1>
              <p className="text-[13.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                Sign in to the counter you are working today. Each account sees only its own orders
                and menu.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <Field label="Which counter?" htmlFor="branch">
                  <Select
                    id="branch"
                    value={branchId}
                    onChange={(e) => {
                      setBranchId(e.target.value);
                      setErrors({});
                    }}
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.location}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Staff email" htmlFor="staff-email" error={errors.email}>
                  <Input
                    id="staff-email"
                    type="email"
                    autoComplete="username"
                    placeholder={expectedEmail}
                    value={email}
                    error={errors.email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field label="Password" htmlFor="staff-password" error={errors.password}>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={password}
                      error={errors.password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-charcoal)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                <Button type="submit" fullWidth size="lg" loading={submitting}>
                  Sign in
                </Button>
              </form>

              {/* Demo credentials, since there is no account to recover */}
              <div className="mt-5 rounded-[12px] bg-[var(--color-paper)] border border-[var(--color-beige)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[12.5px] font-semibold text-[var(--color-charcoal)]">
                      Prototype credentials
                    </h2>
                    <p className="text-[11.5px] text-[var(--color-ink-muted)] mt-1 break-all">
                      {expectedEmail}
                      <br />
                      Password: <span className="font-medium">{STAFF_PASSWORD}</span>
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={fillDemo} className="shrink-0">
                    Fill
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
