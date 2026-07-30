import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { VIT_EMAIL_DOMAIN } from '../lib/constants';
import Button from '../components/ui/Button';

type AuthStep = 'email' | 'otp' | 'vendor-login';

export default function Auth() {
  const navigate = useNavigate();
  const { signInWithOtp, verifyOtp, signInWithPassword, profile } = useAuth();
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (profile) {
    if (profile.role === 'vendor_counter' || profile.role === 'vendor_kitchen') {
      navigate('/select-role', { replace: true });
    } else {
      const redirectVendor = sessionStorage.getItem('redirect_vendor_id');
      if (redirectVendor) {
        sessionStorage.removeItem('redirect_vendor_id');
        navigate(`/app/vendor/${redirectVendor}`, { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.endsWith(VIT_EMAIL_DOMAIN)) {
      setError(`Only ${VIT_EMAIL_DOMAIN} emails are allowed`);
      setIsLoading(false);
      return;
    }

    const { error: err } = await signInWithOtp(email);
    setIsLoading(false);

    if (err) {
      setError(err);
    } else {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: err } = await verifyOtp(email, otp);
    setIsLoading(false);

    if (err) {
      setError(err);
    }
    // Auth state change listener in context will handle redirect
  };

  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: err } = await signInWithPassword(vendorEmail, vendorPassword);
    setIsLoading(false);

    if (err) {
      setError(err);
    }
    // Auth state change listener will handle redirect
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Back to landing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 py-4"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </motion.div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mx-auto flex items-center justify-center text-3xl shadow-lg mb-3">
              🍔
            </div>
            <h1 className="text-3xl font-black font-display text-text-primary tracking-tight">
              VITe<span className="text-primary">Bites</span>
            </h1>
            <p className="text-sm font-medium text-text-secondary mt-1">
              {step === 'vendor-login' ? 'Cafe Vendor Portal' : 'Enter your VIT email to proceed'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div className="glass rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                      VIT Email
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value.toLowerCase())}
                        placeholder={`yourname${VIT_EMAIL_DOMAIN}`}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-nonveg text-sm bg-red-50 px-3 py-2 rounded-lg"
                    >
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Send OTP <ArrowRight size={18} />
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep('vendor-login'); setError(null); }}
                    className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    Cafe vendor? Sign in here →
                  </button>
                </div>
              </motion.form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="glass rounded-2xl p-6 space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <KeyRound size={24} className="text-primary" />
                    </div>
                    <p className="text-sm text-text-secondary">
                      Enter the code sent to
                    </p>
                    <p className="text-sm font-semibold text-text-primary">{email}</p>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-nonveg text-sm bg-red-50 px-3 py-2 rounded-lg"
                    >
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Verify & Continue
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(null); setOtp(''); }}
                    className="w-full text-center text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    ← Change email
                  </button>
                </div>
              </motion.form>
            )}

            {/* Vendor Login */}
            {step === 'vendor-login' && (
              <motion.form
                key="vendor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVendorLogin}
                className="space-y-4"
              >
                <div className="glass rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                      Vendor Email
                    </label>
                    <input
                      type="email"
                      value={vendorEmail}
                      onChange={e => setVendorEmail(e.target.value)}
                      placeholder="vendor@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                      Password
                    </label>
                    <input
                      type="password"
                      value={vendorPassword}
                      onChange={e => setVendorPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 text-nonveg text-sm bg-red-50 px-3 py-2 rounded-lg"
                    >
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Sign In
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(null); }}
                    className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    ← Student/Faculty? Sign in here
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
