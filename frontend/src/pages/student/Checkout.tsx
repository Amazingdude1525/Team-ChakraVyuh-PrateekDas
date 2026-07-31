import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Banknote,
  Check,
  Clock3,
  CreditCard,
  Smartphone,
  Store,
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
      openRazorpay();
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

  function openRazorpay() {
    setPlacing(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TJgVCoHO4BjKnJ',
        amount: totals.total * 100, // in paise
        currency: 'INR',
        name: 'VITeBites',
        description: 'Campus Food Order',
        prefill: {
          name: name.trim() || student?.name,
          contact: phone.trim() || student?.phone,
          email: student?.email,
        },
        theme: {
          color: '#0C2340',
        },
        handler: function (response: any) {
          // Success callback
          executeOrderPlacement(`RZP_${response.razorpay_payment_id}`);
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
          },
        },
      };
      
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPlacing(false);
        toast.error(response.error.description || 'Payment failed');
      });
      rzp.open();
    };
    script.onerror = () => {
      setPlacing(false);
      toast.error('Failed to load Razorpay SDK');
    };
    document.body.appendChild(script);
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
    </div>
  );
}
