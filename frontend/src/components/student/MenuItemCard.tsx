import { useMemo, useState } from 'react';
import { Clock3, Flame, Heart, Minus, Plus, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button, Chip, DietMark, QuantityStepper } from '../ui/primitives';
import { Sheet } from '../ui/Overlay';
import { useCartGuard } from './CartGuard';
import { useStore } from '../../store/useStore';
import { useOriginalPrice } from '../../hooks';
import { cx, rupees } from '../../utils';
import type { MenuItem, MenuVariant } from '../../types';

/**
 * A single dish on a menu.
 *
 * Items with one size add straight to the cart. Items with Half/Full or
 * Small/Large open the detail sheet first, because picking a size is a real
 * decision and guessing on the student's behalf gets the order wrong.
 */

function LikeRatio({ likes, dislikes }: { likes: number; dislikes: number }) {
  const total = likes + dislikes;
  if (total < 8) return null;
  const pct = Math.round((likes / total) * 100);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-muted)]">
      <ThumbsUp size={11} className="text-[var(--color-veg)]" />
      <span className="font-medium text-[var(--color-charcoal)]">{pct}%</span>
      <span>({total})</span>
    </span>
  );
}

export function MenuItemCard({ item, compact }: { item: MenuItem; compact?: boolean }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { requestAdd } = useCartGuard();
  const cart = useStore((s) => s.cart);
  const setQuantity = useStore((s) => s.setQuantity);
  const favorites = useStore((s) => s.favorites?.items ?? []);
  const toggleFavorite = useStore((s) => s.toggleFavoriteItem);
  const originalPrice = useOriginalPrice(item.id);

  const isFavorite = favorites.includes(item.id);
  const hasChoices = item.variants.length > 1;

  // Lines for this item already in the cart, so the card can show a stepper.
  const lines = useMemo(() => cart.filter((l) => l.itemId === item.id), [cart, item.id]);
  const inCartQty = lines.reduce((sum, l) => sum + l.quantity, 0);

  function addDefault() {
    const variant = item.variants[0];
    requestAdd({
      itemId: item.id,
      branchId: item.branchId,
      name: item.name,
      variantId: variant.id,
      variantLabel: variant.label,
      unitPrice: variant.price,
      quantity: 1,
      diet: item.diet,
    });
  }

  function handleAddClick() {
    if (hasChoices) setSheetOpen(true);
    else addDefault();
  }

  /** Stepping down a multi-variant item only makes sense on a single line. */
  function stepExisting(next: number) {
    if (lines.length === 1) setQuantity(lines[0].lineId, next);
    else setSheetOpen(true);
  }

  return (
    <>
      <div
        className={cx(
          'flex gap-4 py-4 border-b border-[var(--color-beige-soft)] last:border-0',
          !item.available && 'opacity-55',
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <DietMark diet={item.diet} />
            {item.bestseller && (
              <Chip tone="terracotta">
                <Flame size={10} />
                Bestseller
              </Chip>
            )}
            {originalPrice != null && <Chip tone="wine">Surplus deal</Chip>}
          </div>

          <h3 className="text-[15px] font-medium text-[var(--color-charcoal)] leading-snug">
            {item.name}
          </h3>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[14px] font-semibold text-[var(--color-charcoal)]">
              {rupees(item.basePrice)}
            </span>
            {originalPrice != null && originalPrice > item.basePrice && (
              <span className="text-[12px] text-[var(--color-ink-soft)] line-through">
                {rupees(originalPrice)}
              </span>
            )}
            {hasChoices && (
              <span className="text-[11px] text-[var(--color-ink-soft)]">
                · {item.variants.map((v) => v.label).join(' / ')}
              </span>
            )}
          </div>

          {!compact && (
            <p className="text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed mt-1.5 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <LikeRatio likes={item.likes} dislikes={item.dislikes} />
            {item.prepMinutes >= 10 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-muted)]">
                <Clock3 size={11} />~{item.prepMinutes} min
              </span>
            )}
            {item.needsVerification && (
              <span className="text-[11px] text-[var(--color-ink-soft)]">
                Price to be confirmed at the counter
              </span>
            )}
          </div>
        </div>

        {/* Action column */}
        <div className="w-[104px] shrink-0 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => item.available && setSheetOpen(true)}
            disabled={!item.available}
            aria-label={`${item.name} details`}
            className="w-full h-[76px] rounded-[12px] border border-[var(--color-beige)] overflow-hidden relative disabled:cursor-not-allowed"
            style={{
              // A warm tinted plate rather than a stock photo of the wrong dish.
              background:
                item.diet === 'veg'
                  ? 'linear-gradient(140deg, #EFF5EC 0%, #DCE9DA 100%)'
                  : item.diet === 'egg'
                    ? 'linear-gradient(140deg, #FDF3DF 0%, #F5E3BE 100%)'
                    : 'linear-gradient(140deg, #FBEBE7 0%, #F2D8D2 100%)',
            }}
          >
            <span
              aria-hidden
              className="absolute inset-0 jaali opacity-35"
              style={{ maskImage: 'radial-gradient(circle at 50% 50%, #000 30%, transparent 72%)' }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-display text-[26px] text-[var(--color-brass)]/55">
              {item.name.slice(0, 1)}
            </span>

            {!item.available && (
              <span className="absolute inset-0 bg-[var(--color-cream)]/78 flex items-center justify-center text-[11px] font-semibold text-[var(--color-wine)]">
                Sold out
              </span>
            )}
          </button>

          {item.available ? (
            inCartQty > 0 ? (
              <QuantityStepper value={inCartQty} onChange={stepExisting} size="sm" />
            ) : (
              <Button size="sm" onClick={handleAddClick} className="w-full">
                <Plus size={14} strokeWidth={2.6} />
                Add
              </Button>
            )
          ) : (
            <span className="text-[11px] text-[var(--color-ink-soft)]">Unavailable</span>
          )}

          <button
            type="button"
            onClick={() => toggleFavorite(item.id)}
            aria-label={isFavorite ? `Remove ${item.name} from saved` : `Save ${item.name}`}
            aria-pressed={isFavorite}
            className="text-[var(--color-ink-soft)] hover:text-[var(--color-terracotta)] transition-colors p-1"
          >
            <Heart
              size={15}
              className={cx(isFavorite && 'fill-[var(--color-terracotta)] text-[var(--color-terracotta)]')}
            />
          </button>
        </div>
      </div>

      <ItemSheet item={item} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

/* ------------------------------------------------------------- item sheet */

function ItemSheet({
  item,
  open,
  onClose,
}: {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
}) {
  const { requestAdd } = useCartGuard();
  const [variant, setVariant] = useState<MenuVariant>(item.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [spice, setSpice] = useState<string | null>(null);

  const total = variant.price * quantity;

  function handleAdd() {
    // Customisation choices ride along as a note the counter can read.
    const parts = [spice, note.trim()].filter(Boolean);
    requestAdd({
      itemId: item.id,
      branchId: item.branchId,
      name: item.name,
      variantId: variant.id,
      variantLabel: variant.label,
      unitPrice: variant.price,
      quantity,
      diet: item.diet,
      note: parts.length ? parts.join(' · ') : undefined,
    });
    onClose();
    // Reset so re-opening the sheet starts clean.
    setQuantity(1);
    setNote('');
    setSpice(null);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item.name}
      footer={
        <div className="flex items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} min={1} />
          <Button fullWidth onClick={handleAdd} disabled={!item.available}>
            Add · {rupees(total)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <DietMark diet={item.diet} />
          <span className="text-[12px] text-[var(--color-ink-muted)]">
            {item.diet === 'veg'
              ? 'Vegetarian'
              : item.diet === 'egg'
                ? 'Contains egg'
                : 'Non-vegetarian'}
          </span>
          {item.bestseller && (
            <Chip tone="terracotta">
              <Flame size={10} />
              Bestseller
            </Chip>
          )}
          <Chip tone="brass">
            <Clock3 size={10} />~{item.prepMinutes} min
          </Chip>
        </div>

        <p className="text-[13.5px] text-[var(--color-ink-muted)] leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center gap-4 text-[12px] text-[var(--color-ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp size={13} className="text-[var(--color-veg)]" />
            {item.likes} liked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ThumbsDown size={13} className="text-[var(--color-ink-soft)]" />
            {item.dislikes}
          </span>
        </div>

        {/* Size */}
        {item.variants.length > 1 && (
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2">
              Choose a size
            </h3>
            <div className="space-y-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={variant.id === v.id}
                  className={cx(
                    'w-full flex items-center justify-between gap-3 px-3.5 h-12 rounded-[11px] border transition-colors text-left',
                    variant.id === v.id
                      ? 'border-[var(--color-saffron)] bg-[var(--color-saffron-tint)]'
                      : 'border-[var(--color-beige)] bg-[var(--color-cream)] hover:border-[var(--color-brass)]',
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden
                      className={cx(
                        'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                        variant.id === v.id
                          ? 'border-[var(--color-saffron-deep)]'
                          : 'border-[var(--color-beige)]',
                      )}
                    >
                      {variant.id === v.id && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-saffron-deep)]" />
                      )}
                    </span>
                    <span className="text-[14px] text-[var(--color-charcoal)]">
                      {v.label}
                      {v.pieces != null && (
                        <span className="text-[12px] text-[var(--color-ink-soft)]"> · {v.pieces} pcs</span>
                      )}
                    </span>
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--color-charcoal)]">
                    {rupees(v.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Customisation */}
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-1">
            How should the kitchen make it?
          </h3>
          <p className="text-[12px] text-[var(--color-ink-soft)] mb-2.5">
            Optional. Passed to the counter with your order.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Less spicy', 'Extra spicy', 'No onion', 'Extra cheese', 'Pack to carry'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSpice(spice === c ? null : c)}
                aria-pressed={spice === c}
                className={cx(
                  'px-3 h-8 rounded-full text-[12px] border transition-colors',
                  spice === c
                    ? 'border-[var(--color-saffron)] bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)] font-medium'
                    : 'border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Free-text note */}
        <div>
          <label
            htmlFor={`note-${item.id}`}
            className="block text-[13px] font-semibold text-[var(--color-charcoal)] mb-2"
          >
            Anything else?
          </label>
          <input
            id={`note-${item.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={90}
            placeholder="e.g. cut into two, extra chutney on the side"
            className="w-full h-11 px-3.5 rounded-[10px] bg-[var(--color-cream)] border border-[var(--color-beige)] focus:border-[var(--color-saffron)] text-sm transition-colors placeholder:text-[var(--color-ink-soft)]"
          />
        </div>

        {!item.available && (
          <div className="rounded-[11px] bg-[var(--color-wine-tint)] text-[var(--color-wine)] text-[12.5px] p-3 leading-relaxed">
            The counter has marked this sold out for today. It will come back when they restock.
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Compact horizontal card used in rails (recommended, under ₹100, reorder). */
export function MenuItemTile({ item }: { item: MenuItem }) {
  const { requestAdd } = useCartGuard();
  const originalPrice = useOriginalPrice(item.id);

  return (
    <div className="w-[172px] shrink-0 rounded-[14px] border border-[var(--color-beige)] bg-[var(--color-cream)] p-3 flex flex-col">
      <div className="flex items-center gap-1.5 mb-1.5">
        <DietMark diet={item.diet} />
        {item.bestseller && <Chip tone="terracotta">Top</Chip>}
      </div>

      <h3 className="text-[13px] font-medium text-[var(--color-charcoal)] leading-snug line-clamp-2 min-h-[34px]">
        {item.name}
      </h3>

      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className="text-[13px] font-semibold text-[var(--color-charcoal)]">
          {rupees(item.basePrice)}
        </span>
        {originalPrice != null && originalPrice > item.basePrice && (
          <span className="text-[11px] text-[var(--color-ink-soft)] line-through">
            {rupees(originalPrice)}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={!item.available}
        onClick={() => {
          const v = item.variants[0];
          requestAdd({
            itemId: item.id,
            branchId: item.branchId,
            name: item.name,
            variantId: v.id,
            variantLabel: v.label,
            unitPrice: v.price,
            quantity: 1,
            diet: item.diet,
          });
        }}
        className="mt-3 h-8 rounded-[9px] bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)] text-[12px] font-semibold flex items-center justify-center gap-1 hover:bg-[var(--color-saffron)]/30 disabled:opacity-50 transition-colors"
      >
        {item.available ? (
          <>
            <Plus size={13} strokeWidth={2.6} />
            Add
          </>
        ) : (
          'Sold out'
        )}
      </button>
    </div>
  );
}

export { Minus };
