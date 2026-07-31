import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, Plus, Store, X } from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  DietMark,
  EmptyState,
  Segmented,
  SectionHeading,
} from '../../components/ui/primitives';
import { BranchCard } from '../../components/student/cards';
import { useCartGuard } from '../../components/student/CartGuard';
import { useBranches, useMenuItems } from '../../hooks';
import { useStore } from '../../store/useStore';
import { rupees } from '../../utils';

type Tab = 'dishes' | 'cafes';

export default function Favorites() {
  const navigate = useNavigate();
  const branches = useBranches();
  const allItems = useMenuItems();
  const { requestAdd } = useCartGuard();

  const favorites = useStore((s) => s.favorites);
  const toggleItem = useStore((s) => s.toggleFavoriteItem);

  const [tab, setTab] = useState<Tab>('dishes');

  const savedItems = useMemo(
    () => (favorites?.items ?? []).map((id) => allItems.find((i) => i.id === id)).filter(Boolean),
    [favorites?.items, allItems],
  );

  const savedBranches = useMemo(
    () => branches.filter((b) => (favorites?.branches ?? []).includes(b.id)),
    [branches, favorites?.branches],
  );

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-5">
      <SectionHeading title="Saved" subtitle="Dishes and counters you keep coming back to" serif />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        className="mb-5"
        options={[
          { value: 'dishes', label: 'Dishes', count: savedItems.length },
          { value: 'cafes', label: 'Cafes', count: savedBranches.length },
        ]}
      />

      {tab === 'dishes' ? (
        savedItems.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Heart size={24} />}
              title="No saved dishes yet"
              body="Tap the heart on any dish and it will wait here for you — handy for the things you order every week."
              action={<Button onClick={() => navigate('/app')}>Browse cafes</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {savedItems.map((item) => {
              if (!item) return null;
              const branch = branches.find((b) => b.id === item.branchId);
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-2 mb-1.5">
                    <DietMark diet={item.diet} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14.5px] font-medium text-[var(--color-charcoal)] leading-snug">
                        {item.name}
                      </h3>
                      <Link
                        to={`/app/cafe/${item.branchId}`}
                        className="text-[12px] text-[var(--color-ink-soft)] hover:text-[var(--color-terracotta)] transition-colors"
                      >
                        {branch?.shortName}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleItem(item.id);
                        toast(`${item.name} removed from saved`);
                      }}
                      aria-label={`Remove ${item.name} from saved`}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-wine)] transition-colors shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <p className="text-[12.5px] text-[var(--color-ink-muted)] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-semibold text-[var(--color-charcoal)]">
                        {rupees(item.basePrice)}
                      </span>
                      {!item.available && <Chip tone="wine">Sold out</Chip>}
                    </div>

                    <Button
                      size="sm"
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
                    >
                      <Plus size={14} strokeWidth={2.6} />
                      Add
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : savedBranches.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Store size={24} />}
            title="No saved cafes yet"
            body="Save the counters you use most and they will be one tap away from here."
            action={<Button onClick={() => navigate('/app')}>Browse cafes</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {savedBranches.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      )}
    </div>
  );
}
