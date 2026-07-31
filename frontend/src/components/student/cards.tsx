import { Link } from 'react-router-dom';
import { ChevronRight, Clock3, Heart, MapPin } from 'lucide-react';
import { Card, Chip, CrowdChip, StatusPill, Stars } from '../ui/primitives';
import { useStore } from '../../store/useStore';
import { getCafe } from '../../data/cafes';
import {
  crowdLevel,
  cx,
  formatDate,
  formatWindow,
  isBranchOpen,
  minutesUntilClose,
  rupees,
  waitMinutes,
} from '../../utils';
import type { CafeBranch, Order } from '../../types';

/** Brand monogram — a tinted mark rather than a stock photograph. */
export function CafeMark({
  branch,
  size = 44,
  className,
}: {
  branch: CafeBranch;
  size?: number;
  className?: string;
}) {
  const cafe = getCafe(branch.cafeId);
  return (
    <span
      aria-hidden
      className={cx(
        'rounded-[12px] flex items-center justify-center shrink-0 font-display text-white relative overflow-hidden',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(140deg, ${cafe?.brandColor ?? '#F3A712'} 0%, #4a3a24 165%)`,
      }}
    >
      <span className="absolute inset-0 jaali opacity-25" />
      <span className="relative">{branch.shortName.slice(0, 1)}</span>
    </span>
  );
}

export function BranchCard({ branch }: { branch: CafeBranch }) {
  const favorites = useStore((s) => s.favorites.branches);
  const toggleFavorite = useStore((s) => s.toggleFavoriteBranch);
  const open = isBranchOpen(branch);
  const closing = minutesUntilClose(branch);
  const isFavorite = favorites.includes(branch.id);

  return (
    <Card className="overflow-hidden hover:shadow-warm-lg transition-shadow">
      <Link to={`/app/cafe/${branch.id}`} className="block p-4">
        <div className="flex items-start gap-3">
          <CafeMark branch={branch} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-[var(--color-charcoal)] truncate">
                {branch.name}
              </h3>
              <Chip tone={open ? 'veg' : 'wine'}>{open ? 'Open' : 'Closed'}</Chip>
            </div>

            <p className="text-[12px] text-[var(--color-ink-soft)] flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={11} className="shrink-0" />
              {branch.location}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <Stars rating={branch.rating} count={branch.ratingCount} />
              <CrowdChip level={crowdLevel(branch.activeOrderCount)} />
              <Chip tone="brass">
                <Clock3 size={10} />~{waitMinutes(branch)} min
              </Chip>
            </div>

            {open && closing != null && closing <= 60 && (
              <p className="text-[11px] text-[var(--color-terracotta)] mt-2">
                Counter shuts in {closing} min
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-3 -mt-1 flex justify-end">
        <button
          type="button"
          onClick={() => toggleFavorite(branch.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Unsave ${branch.name}` : `Save ${branch.name}`}
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-terracotta)] transition-colors py-1"
        >
          <Heart
            size={13}
            className={cx(isFavorite && 'fill-[var(--color-terracotta)] text-[var(--color-terracotta)]')}
          />
          {isFavorite ? 'Saved' : 'Save'}
        </button>
      </div>
    </Card>
  );
}

/** Narrow tile used in the "Open now" horizontal rail. */
export function BranchTile({ branch }: { branch: CafeBranch }) {
  const open = isBranchOpen(branch);
  return (
    <Link
      to={`/app/cafe/${branch.id}`}
      className="w-[188px] shrink-0 rounded-[14px] border border-[var(--color-beige)] bg-[var(--color-cream)] p-3.5 hover:shadow-warm transition-shadow"
    >
      <CafeMark branch={branch} size={38} />
      <h3 className="text-[13.5px] font-semibold text-[var(--color-charcoal)] mt-2.5 truncate">
        {branch.shortName}
      </h3>
      <p className="text-[11px] text-[var(--color-ink-soft)] truncate">{branch.location}</p>
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <Chip tone={open ? 'veg' : 'wine'}>{open ? 'Open' : 'Closed'}</Chip>
        <Chip tone="brass">~{waitMinutes(branch)}m</Chip>
      </div>
    </Link>
  );
}

export function OrderCard({ order, branch }: { order: Order; branch: CafeBranch | undefined }) {
  const itemSummary = order.items
    .map((i) => `${i.quantity}× ${i.name}`)
    .join(', ');

  const live = order.status === 'placed' || order.status === 'preparing' || order.status === 'ready';

  return (
    <Link to={`/app/orders/${order.id}`} className="block">
      <Card
        className={cx(
          'p-4 hover:shadow-warm-lg transition-shadow',
          live && 'border-[var(--color-saffron)]/50',
        )}
      >
        <div className="flex items-start gap-3">
          {branch && <CafeMark branch={branch} size={40} />}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] truncate">
                  {branch?.name ?? 'Cafe'}
                </h3>
                <p className="text-[11.5px] text-[var(--color-ink-soft)]">
                  {formatDate(order.placedAt)}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>

            <p className="text-[12.5px] text-[var(--color-ink-muted)] mt-2 line-clamp-2 leading-relaxed">
              {itemSummary}
            </p>

            <div className="flex items-center justify-between gap-3 mt-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-1 rounded-[7px] bg-[var(--color-charcoal)] text-[var(--color-saffron)] text-[12px] font-bold tabular-nums">
                  {order.token}
                </span>
                {live && (
                  <span className="text-[11px] text-[var(--color-ink-muted)] truncate">
                    {formatWindow(order.pickupWindowStart, order.pickupWindowEnd)}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-[13px] font-semibold text-[var(--color-charcoal)] shrink-0">
                {rupees(order.total)}
                <ChevronRight size={15} className="text-[var(--color-ink-soft)]" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
