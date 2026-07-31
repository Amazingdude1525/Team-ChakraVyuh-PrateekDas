import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock3,
  Flame,
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import { MenuItemCard } from '../../components/student/MenuItemCard';
import { CafeMark } from '../../components/student/cards';
import {
  Button,
  Card,
  Chip,
  CrowdChip,
  EmptyState,
  JaaliDivider,
  Stars,
} from '../../components/ui/primitives';
import { useBranch, useCartTotals, useCategories, useDebounced, useMenuItems } from '../../hooks';
import { useStore } from '../../store/useStore';
import { getCafe } from '../../data/cafes';
import {
  crowdLevel,
  cx,
  isBranchOpen,
  minutesUntilClose,
  rupees,
  waitMinutes,
} from '../../utils';
import type { DietType } from '../../types';
import NotFound from '../public/NotFound';

const DIET_FILTERS: { value: DietType; label: string }[] = [
  { value: 'veg', label: 'Veg' },
  { value: 'egg', label: 'Egg' },
  { value: 'nonveg', label: 'Non-veg' },
];

export default function CafeMenu() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();

  const branch = useBranch(cafeId);
  const categories = useCategories(cafeId);
  const items = useMenuItems(cafeId);

  const student = useStore((s) => s.student);
  const favorites = useStore((s) => s.favorites.branches);
  const toggleFavoriteBranch = useStore((s) => s.toggleFavoriteBranch);
  const createGroupOrder = useStore((s) => s.createGroupOrder);
  const { itemCount, total, branchId: cartBranchId } = useCartTotals();

  const [query, setQuery] = useState('');
  const [diets, setDiets] = useState<DietType[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const debouncedQuery = useDebounced(query, 200);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /** Applies the search box and the veg/egg/non-veg chips together. */
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items.filter((i) => {
      if (diets.length > 0 && !diets.includes(i.diet)) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    });
  }, [items, debouncedQuery, diets]);

  const bestsellers = useMemo(
    () => filtered.filter((i) => i.bestseller && i.available).slice(0, 6),
    [filtered],
  );

  const recommended = useMemo(
    () => filtered.filter((i) => i.recommended && i.available && !i.bestseller).slice(0, 6),
    [filtered],
  );

  const sections = useMemo(
    () =>
      categories
        .map((cat) => ({ category: cat, items: filtered.filter((i) => i.categoryId === cat.id) }))
        .filter((s) => s.items.length > 0),
    [categories, filtered],
  );

  // Highlight the category currently under the sticky header.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveCategory(visible.target.id);
      },
      { rootMargin: '-180px 0px -65% 0px', threshold: 0 },
    );

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections.length]);

  if (!branch) return <NotFound />;

  const cafe = getCafe(branch.cafeId);
  const open = isBranchOpen(branch);
  const closing = minutesUntilClose(branch);
  const isFavorite = favorites.includes(branch.id);
  const cartIsThisCafe = cartBranchId === branch.id;

  function scrollToCategory(categoryId: string) {
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startGroupOrder() {
    const group = createGroupOrder(branch!.id, student?.name ?? 'You');
    toast.success('Group order started — share the code');
    navigate(`/app/group-order/${group.id}`);
  }

  return (
    <div className="pb-8">
      {/* -------------------------------------------------------- cafe head */}
      <header
        className="relative pt-4 pb-5 px-4 sm:px-6"
        style={{
          background: `linear-gradient(165deg, ${cafe?.brandColor ?? '#F3A712'}1f 0%, transparent 78%)`,
        }}
      >
        <div className="max-w-[1180px] mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft size={16} />
              All cafes
            </Button>
            <button
              type="button"
              onClick={() => toggleFavoriteBranch(branch.id)}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remove from saved' : 'Save this cafe'}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)] transition-colors"
            >
              <Heart
                size={17}
                className={cx(
                  isFavorite && 'fill-[var(--color-terracotta)] text-[var(--color-terracotta)]',
                )}
              />
            </button>
          </div>

          <div className="flex items-start gap-4">
            <CafeMark branch={branch} size={62} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[clamp(22px,3.4vw,30px)] leading-tight text-[var(--color-charcoal)]">
                {branch.name}
              </h1>
              <p className="text-[12.5px] text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-1">
                <MapPin size={12} />
                {branch.location}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Chip tone={open ? 'veg' : 'wine'}>
                  {open ? `Open · ${branch.opensAt}–${branch.closesAt}` : 'Closed right now'}
                </Chip>
                <Stars rating={branch.rating} count={branch.ratingCount} />
                <CrowdChip level={crowdLevel(branch.activeOrderCount)} />
                <Chip tone="brass">
                  <Clock3 size={11} />~{waitMinutes(branch)} min
                </Chip>
              </div>

              {open && closing != null && closing <= 60 && (
                <p className="text-[12px] text-[var(--color-terracotta)] mt-2">
                  This counter shuts in {closing} minutes.
                </p>
              )}
            </div>
          </div>

          <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed mt-4 max-w-[640px]">
            {branch.description}
          </p>

          {/* Pickup-only notice — no delivery anywhere on campus */}
          <div className="flex items-start gap-2.5 mt-4 p-3 rounded-[12px] bg-[var(--color-saffron-tint)] max-w-[640px]">
            <Store size={15} className="text-[var(--color-saffron-deep)] shrink-0 mt-px" />
            <p className="text-[12.5px] text-[var(--color-charcoal)] leading-relaxed">
              <span className="font-medium">Campus pickup only.</span> Collect from{' '}
              {branch.pickupPoint} and show your token at the counter.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-4">
            <Button variant="secondary" size="sm" onClick={startGroupOrder}>
              <Users size={15} />
              Start a group order
            </Button>
            <Link to="/app/assistant">
              <Button variant="ghost" size="sm">
                <Sparkles size={15} />
                Ask about this menu
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {!open && (
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="rounded-[12px] bg-[var(--color-wine-tint)] text-[var(--color-wine)] text-[13px] p-4 leading-relaxed">
            This counter is closed. You can still browse the menu — ordering opens again at{' '}
            {branch.opensAt}.
          </div>
        </div>
      )}

      {/* ------------------------------------------------- sticky filter bar */}
      <div className="sticky top-15 z-20 glass-solid border-y border-[var(--color-beige)] mt-5">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3 space-y-2.5">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] pointer-events-none"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${branch.shortName}'s menu`}
                aria-label="Search this menu"
                className="w-full h-10 pl-10 pr-9 rounded-[11px] bg-[var(--color-cream)] border border-[var(--color-beige)] focus:border-[var(--color-saffron)] text-[13.5px] transition-colors placeholder:text-[var(--color-ink-soft)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-charcoal)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 shrink-0">
              {DIET_FILTERS.map((d) => {
                const active = diets.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setDiets((prev) =>
                        prev.includes(d.value)
                          ? prev.filter((x) => x !== d.value)
                          : [...prev, d.value],
                      )
                    }
                    className={cx(
                      'px-3 h-10 rounded-[11px] text-[12.5px] border transition-colors whitespace-nowrap',
                      active
                        ? 'border-[var(--color-veg)] bg-[var(--color-veg-tint)] text-[var(--color-veg)] font-medium'
                        : 'border-[var(--color-beige)] bg-[var(--color-cream)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category jump nav */}
          {sections.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {sections.map(({ category, items: catItems }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => scrollToCategory(category.id)}
                  className={cx(
                    'px-3 h-8 rounded-full text-[12px] whitespace-nowrap border transition-colors shrink-0',
                    activeCategory === category.id
                      ? 'bg-[var(--color-charcoal)] text-[var(--color-cream)] border-[var(--color-charcoal)]'
                      : 'bg-[var(--color-cream)] border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                  )}
                >
                  {category.name}
                  <span className="ml-1.5 opacity-60">{catItems.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ menu */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        {filtered.length === 0 ? (
          <Card className="mt-6">
            <EmptyState
              icon={<Search size={22} />}
              title="Nothing matches that"
              body={
                query
                  ? `No dish at ${branch.shortName} matches "${query}". Try a shorter word, or clear the dietary filters.`
                  : 'No dishes match the filters you have set.'
              }
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setDiets([]);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* Bestsellers */}
            {bestsellers.length > 0 && !query && (
              <section className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={16} className="text-[var(--color-terracotta)]" />
                  <h2 className="text-[17px] font-semibold text-[var(--color-charcoal)]">
                    Bestsellers
                  </h2>
                </div>
                <p className="text-[12.5px] text-[var(--color-ink-muted)] mb-1">
                  What most people order here
                </p>
                <div>
                  {bestsellers.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
                <JaaliDivider className="my-2" />
              </section>
            )}

            {/* Recommended */}
            {recommended.length > 0 && !query && (
              <section className="pt-6">
                <h2 className="text-[17px] font-semibold text-[var(--color-charcoal)]">
                  Recommended
                </h2>
                <p className="text-[12.5px] text-[var(--color-ink-muted)] mb-1">
                  Worth a try if you have not had them
                </p>
                <div>
                  {recommended.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
                <JaaliDivider className="my-2" />
              </section>
            )}

            {/* Full menu, by category */}
            {sections.map(({ category, items: catItems }) => (
              <section
                key={category.id}
                id={category.id}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="pt-7 scroll-mt-[190px]"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <h2 className="font-display text-[22px] text-[var(--color-charcoal)]">
                    {category.name}
                  </h2>
                  <span className="text-[12px] text-[var(--color-ink-soft)] shrink-0">
                    {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div>
                  {catItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* -------------------------------------------- sticky cart summary */}
      {itemCount > 0 && cartIsThisCafe && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[76px] md:bottom-6 z-30 w-[calc(100%-2rem)] max-w-md">
          <Link to="/app/cart">
            <div className="h-13 px-4 rounded-[14px] bg-[var(--color-charcoal)] text-[var(--color-cream)] shadow-warm-lg flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 min-w-0">
                <ShoppingBag size={17} className="text-[var(--color-saffron)] shrink-0" />
                <span className="text-[13px] truncate">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} · {rupees(total)}
                </span>
              </span>
              <span className="text-[14px] font-semibold text-[var(--color-saffron)] shrink-0">
                View cart
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
