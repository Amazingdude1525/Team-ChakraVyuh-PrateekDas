import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, Clock3, Percent, Tag, Trash2 } from 'lucide-react';
import { Button, Card, Chip, EmptyState, JaaliDivider } from '../../components/ui/primitives';
import { useActiveDiscounts, useBranch, useMenuItems, useTick } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, minutesUntilClose, rupees } from '../../utils';

export default function StaffDiscounts() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const branch = useBranch(cafeId);
  const items = useMenuItems(cafeId);
  const discounts = useActiveDiscounts();
  const allDiscounts = useStore((s) => s.discounts);
  const startDiscount = useStore((s) => s.startDiscount);
  const endDiscount = useStore((s) => s.endDiscount);

  useTick(15000);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [percent, setPercent] = useState(20);
  const [durationMin, setDurationMin] = useState(30);


  const branchDiscounts = useMemo(
    () => allDiscounts.filter((d) => d.branchId === cafeId),
    [allDiscounts, cafeId],
  );

  const activeForBranch = useMemo(
    () => discounts.filter((d) => d.branchId === cafeId),
    [discounts, cafeId],
  );

  const closingIn = branch ? minutesUntilClose(branch) : null;
  const eligible = closingIn != null && closingIn <= 90;

  const availableItems = useMemo(
    () => items.filter((i) => i.available && !activeForBranch.some((d) => d.itemId === i.id)),
    [items, activeForBranch],
  );

  const selectedItem = availableItems.find((i) => i.id === selectedItemId);

  function handleCreate() {
    if (!selectedItem || !cafeId) return;
    startDiscount({
      branchId: cafeId,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      percent,
      startedAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + durationMin * 60000).toISOString(),
    });
    setSelectedItemId(null);
  }

  if (!branch) return null;

  return (
    <div className="p-3 sm:p-5 max-w-[1000px] mx-auto space-y-5">
      {/* Disclaimer */}
      <Card className="p-4 bg-[var(--color-saffron-tint)] border-[var(--color-saffron)]/40">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-[var(--color-saffron-deep)] shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-[var(--color-charcoal)] leading-relaxed">
            <strong>Surplus discounts</strong> are manually activated by cafe staff near closing time.
            They apply to standing stock only and are not related to cancellations or refunds.
          </div>
        </div>
      </Card>

      {/* Eligibility & countdown */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)]">Closing-time deals</h2>
          <Chip tone={eligible ? 'veg' : 'brass'}>
            <Clock3 size={11} />
            {closingIn != null ? `Closes in ${closingIn} min` : 'Check branch hours'}
          </Chip>
        </div>

        {!eligible && (
          <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed">
            Surplus discounts are available within 90 minutes of closing. {branch.shortName} closes at{' '}
            <strong>{branch.closesAt}</strong>.
          </p>
        )}

        {eligible && (
          <div className="space-y-4 mt-4">
            {/* Item selector */}
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1.5 block">
                Select an item to discount
              </label>
              <select
                value={selectedItemId ?? ''}
                onChange={(e) => setSelectedItemId(e.target.value || null)}
                className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px]"
              >
                <option value="">Choose an item…</option>
                {availableItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {rupees(i.basePrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* Percentage presets */}
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1.5 block">
                Discount percentage
              </label>
              <div className="flex gap-2">
                {[10, 20, 30].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercent(p)}
                    className={cx(
                      'flex-1 h-10 rounded-[10px] text-[14px] font-semibold transition-colors',
                      percent === p
                        ? 'bg-[var(--color-terracotta)] text-white'
                        : 'bg-[var(--color-cream)] text-[var(--color-ink-muted)] border border-[var(--color-beige)]',
                    )}
                  >
                    {p}%
                  </button>
                ))}
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="w-20 h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px] text-center"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1.5 block">
                Duration (minutes)
              </label>
              <div className="flex gap-2">
                {[15, 30, 45].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationMin(d)}
                    className={cx(
                      'flex-1 h-10 rounded-[10px] text-[13px] font-medium transition-colors',
                      durationMin === d
                        ? 'bg-[var(--color-charcoal)] text-white'
                        : 'bg-[var(--color-cream)] text-[var(--color-ink-muted)] border border-[var(--color-beige)]',
                    )}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {selectedItem && (
              <Card className="p-4 bg-[var(--color-wine-tint)] border-[var(--color-wine)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-[var(--color-wine)]" />
                  <span className="text-[13px] font-semibold text-[var(--color-wine)]">
                    Student-facing preview
                  </span>
                </div>
                <p className="text-[14px] font-medium text-[var(--color-charcoal)]">
                  🔥 {percent}% off {selectedItem.name} at {branch.shortName}
                </p>
                <p className="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  {rupees(selectedItem.basePrice)} → {rupees(Math.round(selectedItem.basePrice * (1 - percent / 100)))}
                  {' · '}{durationMin} minutes · surplus stock near closing
                </p>
              </Card>
            )}

            <Button
              onClick={handleCreate}
              disabled={!selectedItem}
              className="w-full"
              size="lg"
            >
              <Percent size={16} />
              Activate {percent}% off{selectedItem ? ` on ${selectedItem.name}` : ''}
            </Button>
          </div>
        )}
      </Card>

      <JaaliDivider />

      {/* Active deals */}
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-3">Active deals</h2>
        {activeForBranch.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<Tag size={26} />}
              title="No active deals"
              body="Create a surplus discount above to broadcast to students."
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeForBranch.map((d) => {
              const remaining = Math.max(0, Math.round((new Date(d.endsAt).getTime() - Date.now()) / 60000));
              return (
                <motion.div key={d.id} layout>
                  <Card className="p-4 border-[var(--color-terracotta)]/40">
                    <div className="flex items-center justify-between mb-2">
                      <Chip tone="wine">
                        <Percent size={10} /> {d.percent}% off
                      </Chip>
                      <Chip tone="brass">
                        <Clock3 size={10} /> {remaining} min left
                      </Chip>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)]">{d.itemName}</h3>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => endDiscount(d.id)}
                      >
                        <Trash2 size={13} /> End deal
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past deals */}
      {branchDiscounts.filter((d) => !d.active).length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-charcoal)] mb-3 mt-6">Past deals</h2>
          <div className="space-y-2">
            {branchDiscounts
              .filter((d) => !d.active)
              .slice(0, 10)
              .map((d) => (
                <Card key={d.id} className="p-3 flex items-center gap-3 opacity-60">
                  <Chip tone="brass">{d.percent}%</Chip>
                  <span className="flex-1 text-[13px] text-[var(--color-charcoal)] truncate">{d.itemName}</span>
                  <span className="text-[11px] text-[var(--color-ink-soft)]">Ended</span>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
