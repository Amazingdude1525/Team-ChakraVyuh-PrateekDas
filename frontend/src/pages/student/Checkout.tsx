import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Store,
  X,
} from 'lucide-react';
import {
  Button,
  Card,
  Field,
  Input,
  JaaliDivider,
  Select,
  Switch,
  Textarea,
} from '../../components/ui/primitives';
import { CafeMark } from '../../components/student/cards';
import { useBranch, useCartTotals } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, formatWindow, pickupWindow, rupees, waitMinutes } from '../../utils';
import type { PaymentMethod } from '../../types';

const PICKUP_LOCATIONS = [
  'AB-1, Ground Floor',
  'AB-1, Second Floor',
  'AB-2, Ground Floor',
  'Special Block, Foyer',
  'Library entrance',
  'Hostel Block A',
  'Hostel Block C',
  'Sports Complex',
];

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof Smartphone;
}[] = [
  { value: 'upi', label: 'Razorpay UPI', hint: 'GPay, PhonePe, Paytm, BHIM', icon: Smartphone },
  { value: 'card', label: 'Razorpay Card', hint: 'Debit or Credit Card', icon: CreditCard },
  { value: 'counter', label: 'Pay at the counter', hint: 'Settle when you collect', icon: Banknote },
];

export default function Checkout() {
  const navigate = useNavigate();

  const cart = useStore((s) => s.cart);
  const cartNote = useStore((s) => s.cartNote);
  const student = useStore((s) => s.student);
  const placeOrder = useStore((s) => s.placeOrder);

  const totals = useCartTotals();
  const branch = useBranch(totals.branchId ?? undefined);

  const [name, setName] = useState(student?.name ?? '');
  const [phone, setPhone] = useState(student?.phone ?? '');
  const [location, setLocation] = useState(student?.defaultPickupLocation ?? PICKUP_LOCATIONS[0]);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [cutlery, setCutlery] = useState(true);
  const [note, setNote] = useState(cartNote);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  // Razorpay Gateway Simulation State
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [rzpPaying, setRzpPaying] = useState(false);
  const [rzpSuccess, setRzpSuccess] = useState(false);
  const [upiVpa, setUpiVpa] = useState('student@okaxis');

  if (cart.length === 0) return <Navigate to="/app/cart" replace />;

  const wait = branch ? waitMinutes(branch) : 10;
  const preview = pickupWindow(wait);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = 'We need a name to call out at the counter.';
    const digits = phone.replace(/\D/g, '');
    if (!digits) next.phone = 'Enter a phone number.';
    else if (digits.length < 10) next.phone = 'That number looks too short.';
    if (!accepted) next.accepted = 'Please confirm before placing the order.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (method === 'upi' || method === 'card') {
      // Open Razorpay SDK Simulation Modal
      setShowRazorpay(true);
    } else {
      // Direct Counter Payment
      executeOrderPlacement('Counter Payment');
    }
  }

  function executeOrderPlacement(paymentRef: string) {
    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder({
        branchId: totals.branchId!,
        studentName: name.trim(),
        phone: phone.trim(),
        pickupLocation: location,
        paymentMethod: method,
        cutlery,
        note: note.trim() || undefined,
      });
      toast.success(`Order placed — token ${order.token} (${paymentRef})`);
      navigate(`/app/order-confirmed/${order.id}`, { replace: true });
    }, 600);
  }

  function handleRazorpaySuccess() {
    setRzpPaying(true);
    setTimeout(() => {
      setRzpPaying(false);
      setRzpSuccess(true);
      setTimeout(() => {
        setShowRazorpay(false);
        setRzpSuccess(false);
        executeOrderPlacement('Razorpay Paid');
      }, 1000);
    }, 1200);
  }

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/cart')} className="mb-4">
        <ArrowLeft size={16} />
        Back to cart
      </Button>

      <h1 className="font-display text-[clamp(24px,3.4vw,32px)] leading-tight text-[var(--color-charcoal)] mb-5">
        Checkout
      </h1>

      <form onSubmit={handleFormSubmit} noValidate className="grid gap-5 lg:grid-cols-[1fr_360px] items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Who is collecting */}
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-1">
              Who is collecting?
            </h2>
            <p className="text-[12.5px] text-[var(--color-ink-muted)] mb-4">
              The counter calls this name with your token.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name" error={errors.name}>
                <Input
                  id="name"
                  value={name}
                  error={errors.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </Field>

              <Field label="Phone number" htmlFor="phone" error={errors.phone}>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  error={errors.phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field
                label="Where are you coming from?"
                htmlFor="location"
                hint="Helps the counter judge how long you will take to walk over."
              >
                <Select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {PICKUP_LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          {/* Pickup window */}
          {branch && (
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-3">
                Your pickup window
              </h2>

              <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[var(--color-saffron-tint)]">
                <Clock3 size={20} className="text-[var(--color-saffron-deep)] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--color-charcoal)] tabular-nums">
                    {formatWindow(preview.start.toISOString(), preview.end.toISOString())}
                  </div>
                  <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">
                    About {wait} minutes from now · {branch.activeOrderCount} orders ahead
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 mt-3 text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed">
                <Store size={15} className="text-[var(--color-brass)] shrink-0 mt-px" />
                <span>
                  Collect from{' '}
                  <strong className="font-medium text-[var(--color-charcoal)]">
                    {branch.pickupPoint}
                  </strong>
                  . If the kitchen runs behind, this window moves and we will tell you.
                </span>
              </div>
            </Card>
          )}

          {/* Payment method selector */}
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-1">
              How would you like to pay?
            </h2>
            <p className="text-[12.5px] text-[var(--color-ink-muted)] mb-4">
              Integrated with Razorpay Payment Gateway (Instant UPI, GPay, Cards).
            </p>

            <div className="space-y-2.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  aria-pressed={method === m.value}
                  className={cx(
                    'w-full flex items-center gap-3.5 p-3.5 rounded-[12px] border text-left transition-colors',
                    method === m.value
                      ? 'border-[#0C2340] bg-blue-50/60 ring-1 ring-[#0C2340]'
                      : 'border-[var(--color-beige)] bg-[var(--color-cream)] hover:border-[var(--color-brass)]',
                  )}
                >
                  <span
                    className={cx(
                      'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 font-bold',
                      method === m.value
                        ? 'bg-[#0C2340] text-white'
                        : 'bg-[var(--color-sand)] text-[var(--color-ink-muted)]',
                    )}
                  >
                    <m.icon size={18} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-[var(--color-charcoal)]">
                      {m.label}
                    </span>
                    <span className="block text-[12px] text-[var(--color-ink-soft)]">{m.hint}</span>
                  </span>

                  <span
                    aria-hidden
                    className={cx(
                      'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                      method === m.value
                        ? 'border-[#0C2340] bg-[#0C2340]'
                        : 'border-[var(--color-beige)]',
                    )}
                  >
                    {method === m.value && <Check size={12} className="text-white" strokeWidth={3.5} />}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Cutlery and Notes */}
          <Card className="p-5 space-y-4">
            <Switch
              checked={cutlery}
              onChange={setCutlery}
              label="Send cutlery and napkins"
              description="Skip it if you are eating at the counter — it saves plastic."
            />

            <JaaliDivider />

            <div>
              <label
                htmlFor="checkout-note"
                className="block text-[13.5px] font-medium text-[var(--color-charcoal)] mb-2"
              >
                Anything the counter should know?
              </label>
              <Textarea
                id="checkout-note"
                rows={2}
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. running late, will collect closer to 1:30"
              />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <Card className="p-5">
            {branch && (
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--color-beige-soft)]">
                <CafeMark branch={branch} size={40} />
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-[var(--color-charcoal)] truncate">
                    {branch.name}
                  </h2>
                  <p className="text-[12px] text-[var(--color-ink-soft)] truncate">
                    {branch.location}
                  </p>
                </div>
              </div>
            )}

            <h3 className="text-[13.5px] font-semibold text-[var(--color-charcoal)] mb-2.5">
              Order summary
            </h3>

            <ul className="space-y-2 max-h-[220px] overflow-y-auto thin-scrollbar pr-1">
              {cart.map((line) => (
                <li key={line.lineId} className="flex justify-between gap-3 text-[13px]">
                  <span className="text-[var(--color-ink-muted)] min-w-0">
                    <span className="text-[var(--color-charcoal)]">{line.quantity}×</span>{' '}
                    {line.name}
                    <span className="text-[11.5px] text-[var(--color-ink-soft)]">
                      {' '}
                      ({line.variantLabel})
                    </span>
                  </span>
                  <span className="text-[var(--color-charcoal)] tabular-nums shrink-0">
                    {rupees(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <JaaliDivider className="my-3.5" />

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-ink-muted)]">Item total</dt>
                <dd className="tabular-nums">{rupees(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between gap-3 text-[var(--color-veg)]">
                  <dt>{totals.discountLabel}</dt>
                  <dd className="tabular-nums">−{rupees(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-ink-muted)]">Taxes and charges</dt>
                <dd className="tabular-nums">{rupees(totals.taxes)}</dd>
              </div>
            </dl>

            <JaaliDivider className="my-3.5" />

            <div className="flex justify-between items-baseline gap-3">
              <span className="text-[14px] font-semibold text-[var(--color-charcoal)]">
                {method === 'counter' ? 'Pay at counter' : 'To pay now'}
              </span>
              <span className="font-display text-[24px] text-[var(--color-charcoal)] tabular-nums">
                {rupees(totals.total)}
              </span>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (e.target.checked) setErrors((x) => ({ ...x, accepted: '' }));
                }}
                className="mt-0.5 w-4 h-4 accent-[#0C2340] shrink-0"
              />
              <span className="text-[12px] text-[var(--color-ink-muted)] leading-relaxed">
                I will collect this order myself from the counter within my pickup window.
              </span>
            </label>
            {errors.accepted && (
              <p className="text-[12px] text-[var(--color-wine)] mt-1.5">{errors.accepted}</p>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              className="mt-4 bg-[#0C2340] hover:bg-[#07162b] text-white"
              loading={placing}
            >
              {placing ? 'Placing your order…' : method === 'counter' ? `Place order · ${rupees(totals.total)}` : `Pay with Razorpay · ${rupees(totals.total)}`}
            </Button>
          </Card>
        </div>
      </form>

      {/* ---------------------------------- RAZORPAY PAYMENT GATEWAY MODAL SIMULATION ---------------------------------- */}
      <AnimatePresence>
        {showRazorpay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-[420px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200"
            >
              {/* Razorpay Brand Header */}
              <div className="bg-[#0C2340] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    RZP
                  </div>
                  <div>
                    <span className="text-xs text-blue-200 uppercase font-bold tracking-wider block">
                      Razorpay Checkout
                    </span>
                    <span className="text-sm font-bold block text-white">
                      VITeBites Campus Food
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRazorpay(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Amount & Merchant Info */}
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Amount to Pay</span>
                  <span className="text-2xl font-black text-slate-900">{rupees(totals.total)}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <ShieldCheck size={13} /> 256-Bit SSL Encrypted
                </span>
              </div>

              {/* Payment Processing or Success Screen */}
              <div className="p-6">
                {rzpSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6 space-y-3"
                  >
                    <CheckCircle2 size={56} className="text-emerald-500 mx-auto animate-bounce" />
                    <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
                    <p className="text-xs text-slate-500">Transaction ID: RZP_PAY_{Math.floor(100000 + Math.random() * 900000)}</p>
                  </motion.div>
                ) : rzpPaying ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-slate-800">Processing payment with bank...</p>
                    <p className="text-xs text-slate-400">Do not refresh or close this window.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {method === 'upi' ? (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select UPI App / Virtual Payment Address
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                          {['GPay', 'PhonePe', 'Paytm'].map((app) => (
                            <button
                              key={app}
                              type="button"
                              onClick={() => setUpiVpa(`student@${app.toLowerCase()}`)}
                              className="p-2.5 rounded-xl border border-slate-200 text-center font-bold text-xs hover:border-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              {app}
                            </button>
                          ))}
                        </div>

                        <div>
                          <input
                            value={upiVpa}
                            onChange={(e) => setUpiVpa(e.target.value)}
                            placeholder="Enter UPI ID (e.g. name@upi)"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Card Details Simulation
                        </label>
                        <input
                          defaultValue="4532 •••• •••• 8892"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input defaultValue="12 / 28" className="h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono" />
                          <input defaultValue="892" type="password" className="h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono" />
                        </div>
                      </div>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      onClick={handleRazorpaySuccess}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl mt-4"
                    >
                      <Lock size={16} className="mr-1" />
                      Pay {rupees(totals.total)} Now
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
