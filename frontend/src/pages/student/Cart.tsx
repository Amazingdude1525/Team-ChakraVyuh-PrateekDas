import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Clock3, Store, Tag, Trash2, X } from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  DietMark,
  EmptyState,
  Input,
  JaaliDivider,
  QuantityStepper,
  Textarea,
} from '../../components/ui/primitives';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { MenuItemTile } from '../../components/student/MenuItemCard';
import { CafeMark } from '../../components/student/cards';
import { useBranch, useCartTotals, useMenuItems } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, isBranchOpen, rupees, waitMinutes } from '../../utils';

export default function Cart() {
  const navigate = useNavigate();

  const cart = useStore((s) => s.cart);
  const cartNote = useStore((s) => s.cartNote);
  const coupon = useStore((s) => s.coupon);
  const setQuantity = useStore((s) => s.setQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const setCartNote = useStore((s) => s.setCartNote);
  const setLineNote = useStore((s) => s.setLineNote);
  const applyCoupon = useStore((s) => s.applyCoupon);
  const clearCoupon = useStore((s) => s.clearCoupon);

  const totals = useCartTotals();
  const branch = useBranch(totals.branchId ?? undefined);
  const branchItems = useMenuItems(totals.branchId ?? undefined);

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);

  /** Popular items from the same counter that are not already in the cart. */
  const suggestions = useMemo(() => {
    const inCart = new Set(cart.map((l) => l.itemId));
    return branchItems
      .filter((i) => i.available && !inCart.has(i.id) && (i.bestseller || i.recommended))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 8);
  }, [branchItems, cart]);

  function submitCoupon(e: React.FormEvent) {
    e.preventDefault();
    const ok = applyCoupon(couponInput);
    if (ok) {
      setCouponError(null);
      setCouponInput('');
      toast.success('Coupon applied');
    } else {
      setCouponError('That code is not valid. Try VIT10.');
    }
  }

  /* ------------------------------------------------------------ empty state */
  if (cart.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="mb-4">
          <ArrowLeft size={16} />
          Back
        </Button>

        <Card>
          <EmptyState
            icon={<Store size={24} />}
            title="Your cart is empty"
            body="Pick a counter and add something. Your cart holds one cafe at a time, since you collect the order from one place."
            action={
              <Button onClick={() => navigate('/app')}>
                Browse cafes
                <ArrowRight size={15} />
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const branchOpen = branch ? isBranchOpen(branch) : false;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5">
      <div className="flex items-center justify-between gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="text-[12.5px] text-[var(--color-wine)] hover:underline inline-flex items-center gap-1.5"
        >
          <Trash2 size={13} />
          Clear cart
        </button>
      </div>

      <h1 className="font-display text-[clamp(24px,3.4vw,32px)] leading-tight text-[var(--color-charcoal)] mb-5">
        Your order
      </h1>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] items-start">
        {/* ------------------------------------------------------ left column */}
        <div className="space-y-5">
          {/* Counter you are collecting from */}
          {branch && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CafeMark branch={branch} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14.5px] font-semibold text-[var(--color-charcoal)] truncate">
                    {branch.name}
                  </h2>
                  <p className="text-[12px] text-[var(--color-ink-muted)] truncate">
                    Collect from {branch.pickupPoint}
                  </p>
                </div>
                <Chip tone={branchOpen ? 'veg' : 'wine'} className="shrink-0">
                  {branchOpen ? 'Open' : 'Closed'}
                </Chip>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-beige-soft)] text-[12.5px] text-[var(--color-ink-muted)]">
                <Clock3 size={14} className="text-[var(--color-saffron-deep)]" />
                Ready in roughly <strong className="font-semibold text-[var(--color-charcoal)]">
                  {waitMinutes(branch)} minutes
                </strong>{' '}
                — {branch.activeOrderCount} orders ahead of you
              </div>
            </Card>
          )}

          {!branchOpen && branch && (
            <div className="rounded-[12px] bg-[var(--color-wine-tint)] text-[var(--color-wine)] text-[13px] p-4 leading-relaxed">
              {branch.name} is closed right now, so this order cannot be placed until it reopens at{' '}
              {branch.opensAt}.
            </div>
          )}

          {/* Line items */}
          <Card className="px-4">
            {cart.map((line) => (
              <div
                key={line.lineId}
                className="py-4 border-b border-[var(--color-beige-soft)] last:border-0"
              >
                <div className="flex items-start gap-3">
                  <DietMark diet={line.diet} className="mt-1" />

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-medium text-[var(--color-charcoal)] leading-snug">
                      {line.name}
                    </h3>
                    <p className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">
                      {line.variantLabel} · {rupees(line.unitPrice)} each
                    </p>

                    {line.note && (
                      <p className="text-[12px] text-[var(--color-terracotta)] mt-1.5 leading-relaxed">
                        {line.note}
                      </p>
                    )}

                    {editingNoteFor === line.lineId ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          autoFocus
                          defaultValue={line.note ?? ''}
                          placeholder="Note for the kitchen"
                          maxLength={90}
                          className="h-9 text-[13px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setLineNote(line.lineId, (e.target as HTMLInputElement).value);
                              setEditingNoteFor(null);
                            }
                            if (e.key === 'Escape') setEditingNoteFor(null);
                          }}
                          onBlur={(e) => {
                            setLineNote(line.lineId, e.target.value);
                            setEditingNoteFor(null);
                          }}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingNoteFor(line.lineId)}
                        className="text-[11.5px] text-[var(--color-terracotta)] hover:underline mt-1.5"
                      >
                        {line.note ? 'Edit note' : 'Add a note'}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[14px] font-semibold text-[var(--color-charcoal)]">
                      {rupees(line.unitPrice * line.quantity)}
                    </span>
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(q) => setQuantity(line.lineId, q)}
                      min={0}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removeFromCart(line.lineId);
                        toast(`${line.name} removed`);
                      }}
                      aria-label={`Remove ${line.name}`}
                      className="text-[11.5px] text-[var(--color-ink-soft)] hover:text-[var(--color-wine)] inline-flex items-center gap-1 transition-colors"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Order-wide note */}
          <Card className="p-4">
            <label
              htmlFor="order-note"
              className="block text-[13.5px] font-semibold text-[var(--color-charcoal)] mb-1"
            >
              Note for the counter
            </label>
            <p className="text-[12px] text-[var(--color-ink-soft)] mb-2.5">
              Applies to the whole order. Optional.
            </p>
            <Textarea
              id="order-note"
              rows={2}
              maxLength={200}
              value={cartNote}
              onChange={(e) => setCartNote(e.target.value)}
              placeholder="e.g. I will collect around 1:15, please pack separately"
            />
          </Card>

          {/* Suggested add-ons */}
          {suggestions.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-1">
                Add something else?
              </h2>
              <p className="text-[12.5px] text-[var(--color-ink-muted)] mb-3">
                Popular at {branch?.shortName}
              </p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                {suggestions.map((item) => (
                  <MenuItemTile key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ----------------------------------------------------- right column */}
        <div className="lg:sticky lg:top-20 space-y-4">
          {/* Coupon */}
          <Card className="p-4">
            <h2 className="text-[13.5px] font-semibold text-[var(--color-charcoal)] mb-2.5">
              Have a coupon?
            </h2>

            {coupon ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-[11px] bg-[var(--color-veg-tint)]">
                <span className="flex items-center gap-2 text-[13px] text-[var(--color-veg)] font-medium min-w-0">
                  <Tag size={14} className="shrink-0" />
                  <span className="truncate">{coupon} applied</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearCoupon();
                    toast('Coupon removed');
                  }}
                  className="text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-wine)] shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={submitCoupon} className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  placeholder="VIT10"
                  aria-label="Coupon code"
                  error={couponError ?? undefined}
                  className="h-10 text-[13px]"
                />
                <Button type="submit" variant="secondary" className="h-10 shrink-0">
                  Apply
                </Button>
              </form>
            )}

            {couponError && (
              <p className="text-[12px] text-[var(--color-wine)] mt-2">{couponError}</p>
            )}
          </Card>

          {/* Bill */}
          <Card className="p-4">
            <h2 className="text-[13.5px] font-semibold text-[var(--color-charcoal)] mb-3">
              Bill details
            </h2>

            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-ink-muted)]">
                  Item total ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})
                </dt>
                <dd className="text-[var(--color-charcoal)] tabular-nums">
                  {rupees(totals.subtotal)}
                </dd>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-veg)]">{totals.discountLabel}</dt>
                  <dd className="text-[var(--color-veg)] tabular-nums">
                    −{rupees(totals.discount)}
                  </dd>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-ink-muted)]">Taxes and charges</dt>
                <dd className="text-[var(--color-charcoal)] tabular-nums">{rupees(totals.taxes)}</dd>
              </div>
            </dl>

            <JaaliDivider className="my-3" />

            <div className="flex justify-between items-baseline gap-3">
              <span className="text-[14px] font-semibold text-[var(--color-charcoal)]">To pay</span>
              <span className="font-display text-[24px] text-[var(--color-charcoal)] tabular-nums">
                {rupees(totals.total)}
              </span>
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-4"
              disabled={!branchOpen}
              onClick={() => navigate('/app/checkout')}
            >
              {branchOpen ? 'Continue to checkout' : 'Counter is closed'}
              {branchOpen && <ArrowRight size={16} />}
            </Button>

            <p className="text-[11.5px] text-[var(--color-ink-soft)] text-center mt-3 leading-relaxed">
              Campus pickup only. You will get a token and a five-minute pickup window.
            </p>
          </Card>

          <Link
            to="/app"
            className={cx(
              'block text-center text-[12.5px] text-[var(--color-terracotta)] hover:underline',
            )}
          >
            Add items from another cafe
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearCart();
          toast('Cart cleared');
        }}
        title="Clear your cart?"
        body="This removes everything, including your notes and any coupon you have applied."
        confirmLabel="Clear it"
        destructive
      />
    </div>
  );
}
