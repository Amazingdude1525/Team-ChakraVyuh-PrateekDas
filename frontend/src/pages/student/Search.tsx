import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Search as SearchIcon, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import { MenuItemCard } from '../../components/student/MenuItemCard';
import { CafeMark } from '../../components/student/cards';
import {
  Button,
  Card,
  Chip,
  CrowdChip,
  EmptyState,
  JaaliDivider,
  Segmented,
  Stars,
  Switch,
} from '../../components/ui/primitives';
import { Sheet } from '../../components/ui/Overlay';
import { useBranches, useDebounced, useMenuItems } from '../../hooks';
import { crowdLevel, cx, isBranchOpen, waitMinutes } from '../../utils';
import type { DietType } from '../../types';

type SortKey = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'prep';

const TRENDING = [
  'Masala Dosa',
  'Cold Coffee',
  'Paneer Tikka',
  'Momos',
  'Maggi',
  'Filter Coffee',
  'Chicken Biryani',
];

const POPULAR_CATEGORIES = [
  'South Indian',
  'Chinese',
  'Pizza',
  'Sandwich',
  'Shakes',
  'Chaat',
  'Pasta',
  'Coffee',
];

const RECENT_KEY = 'vitebites-recent-searches';

export default function Search() {
  const branches = useBranches();
  const allItems = useMenuItems();

  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');

  // Filters
  const [diets, setDiets] = useState<DietType[]>([]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [openOnly, setOpenOnly] = useState(false);
  const [maxPrep, setMaxPrep] = useState(30);
  const [minRating, setMinRating] = useState(0);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);

  const debounced = useDebounced(query, 220);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      // A corrupt entry just means no history; nothing to recover.
    }
  }, []);

  /** Remembers a term once the student has actually settled on it. */
  function remember(term: string) {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }

  const activeFilterCount =
    diets.length +
    (maxPrice < 500 ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (maxPrep < 30 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    branchFilter.length;

  const eligibleBranches = useMemo(
    () =>
      branches.filter((b) => {
        if (openOnly && !isBranchOpen(b)) return false;
        if (minRating > 0 && b.rating < minRating) return false;
        if (branchFilter.length > 0 && !branchFilter.includes(b.id)) return false;
        return true;
      }),
    [branches, openOnly, minRating, branchFilter],
  );

  const eligibleBranchIds = useMemo(
    () => new Set(eligibleBranches.map((b) => b.id)),
    [eligibleBranches],
  );

  const branchResults = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    return eligibleBranches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q),
    );
  }, [debounced, eligibleBranches]);

  const dishResults = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];

    const matched = allItems.filter((item) => {
      if (!eligibleBranchIds.has(item.branchId)) return false;
      if (diets.length > 0 && !diets.includes(item.diet)) return false;
      if (item.basePrice > maxPrice) return false;
      if (item.prepMinutes > maxPrep) return false;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryId.includes(q.replace(/\s+/g, '-'))
      );
    });

    const sorted = [...matched];
    switch (sort) {
      case 'price-low':
        sorted.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'rating':
        sorted.sort((a, b) => b.likes / (b.likes + b.dislikes || 1) - a.likes / (a.likes + a.dislikes || 1));
        break;
      case 'prep':
        sorted.sort((a, b) => a.prepMinutes - b.prepMinutes);
        break;
      default:
        // Relevance: a name match beats a description match, then popularity.
        sorted.sort((a, b) => {
          const aName = a.name.toLowerCase().startsWith(q) ? 2 : a.name.toLowerCase().includes(q) ? 1 : 0;
          const bName = b.name.toLowerCase().startsWith(q) ? 2 : b.name.toLowerCase().includes(q) ? 1 : 0;
          if (aName !== bName) return bName - aName;
          return b.likes - a.likes;
        });
    }
    return sorted.slice(0, 60);
  }, [debounced, allItems, eligibleBranchIds, diets, maxPrice, maxPrep, sort]);

  const hasQuery = debounced.trim().length > 0;
  const noResults = hasQuery && branchResults.length === 0 && dishResults.length === 0;

  function resetFilters() {
    setDiets([]);
    setMaxPrice(500);
    setOpenOnly(false);
    setMaxPrep(30);
    setMinRating(0);
    setBranchFilter([]);
  }

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-5">
      {/* Search field */}
      <div className="flex gap-2.5 mb-4">
        <div className="relative flex-1">
          <SearchIcon
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] pointer-events-none"
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => remember(query)}
            onKeyDown={(e) => e.key === 'Enter' && remember(query)}
            placeholder="Search dishes, cafes or categories"
            aria-label="Search"
            className="w-full h-12 pl-11 pr-10 rounded-[13px] bg-[var(--color-cream)] border border-[var(--color-beige)] focus:border-[var(--color-saffron)] text-[14px] transition-colors placeholder:text-[var(--color-ink-soft)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-charcoal)]"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className={cx(
            'relative h-12 px-4 rounded-[13px] border flex items-center gap-2 text-[13.5px] transition-colors shrink-0',
            activeFilterCount > 0
              ? 'border-[var(--color-saffron)] bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)] font-medium'
              : 'border-[var(--color-beige)] bg-[var(--color-cream)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
          )}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--color-saffron)] text-[var(--color-charcoal)] text-[11px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Sort — only meaningful once there is something to sort */}
      {hasQuery && dishResults.length > 1 && (
        <div className="mb-4 overflow-x-auto no-scrollbar">
          <Segmented<SortKey>
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'relevance', label: 'Best match' },
              { value: 'price-low', label: 'Price ↑' },
              { value: 'price-high', label: 'Price ↓' },
              { value: 'rating', label: 'Best rated' },
              { value: 'prep', label: 'Quickest' },
            ]}
          />
        </div>
      )}

      {/* ----------------------------------------------------- idle state */}
      {!hasQuery && (
        <div className="space-y-7">
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)]">
                  Recent searches
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setRecent([]);
                    localStorage.removeItem(RECENT_KEY);
                  }}
                  className="text-[12px] text-[var(--color-terracotta)] hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button key={term} type="button" onClick={() => setQuery(term)}>
                    <Chip tone="neutral" className="hover:bg-[var(--color-beige-soft)] cursor-pointer">
                      <Clock3 size={11} />
                      {term}
                    </Chip>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[var(--color-terracotta)]" />
              Trending on campus
            </h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((term) => (
                <button key={term} type="button" onClick={() => setQuery(term)}>
                  <Chip tone="terracotta" className="hover:brightness-97 cursor-pointer">
                    {term}
                  </Chip>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5">
              Popular categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setQuery(cat)}>
                  <Chip tone="saffron" className="hover:brightness-97 cursor-pointer">
                    {cat}
                  </Chip>
                </button>
              ))}
            </div>
          </section>

          <JaaliDivider />

          <section>
            <h2 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-3">
              All counters
            </h2>
            <div className="space-y-2.5">
              {branches.map((b) => (
                <Link key={b.id} to={`/app/cafe/${b.id}`}>
                  <Card className="p-3.5 flex items-center gap-3 hover:shadow-warm-lg transition-shadow">
                    <CafeMark branch={b} size={40} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13.5px] font-medium text-[var(--color-charcoal)] truncate">
                        {b.name}
                      </h3>
                      <p className="text-[11.5px] text-[var(--color-ink-soft)] truncate">
                        {b.location}
                      </p>
                    </div>
                    <Chip tone={isBranchOpen(b) ? 'veg' : 'wine'} className="shrink-0">
                      {isBranchOpen(b) ? 'Open' : 'Closed'}
                    </Chip>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* -------------------------------------------------- no results */}
      {noResults && (
        <Card>
          <EmptyState
            icon={<SearchIcon size={24} />}
            title={`Nothing for "${debounced}"`}
            body={
              activeFilterCount > 0
                ? 'No dish or cafe matches, but you have filters on. Try loosening them.'
                : 'Try a shorter word — "dosa" instead of "masala dosa special", for instance.'
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Start over
                </Button>
              )
            }
          />
        </Card>
      )}

      {/* ----------------------------------------------------- results */}
      {hasQuery && !noResults && (
        <div className="space-y-7">
          {branchResults.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-3">
                Cafes ({branchResults.length})
              </h2>
              <div className="space-y-2.5">
                {branchResults.map((b) => (
                  <Link key={b.id} to={`/app/cafe/${b.id}`}>
                    <Card className="p-4 flex items-center gap-3 hover:shadow-warm-lg transition-shadow">
                      <CafeMark branch={b} size={44} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-semibold text-[var(--color-charcoal)] truncate">
                          {b.name}
                        </h3>
                        <p className="text-[11.5px] text-[var(--color-ink-soft)] truncate">
                          {b.location}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Stars rating={b.rating} />
                          <CrowdChip level={crowdLevel(b.activeOrderCount)} />
                          <Chip tone="brass">~{waitMinutes(b)}m</Chip>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {dishResults.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold text-[var(--color-charcoal)] mb-1">
                Dishes ({dishResults.length})
              </h2>
              <p className="text-[12px] text-[var(--color-ink-muted)] mb-2">
                Across every counter on campus
              </p>

              <Card className="px-4">
                {dishResults.map((item) => {
                  const branch = branches.find((b) => b.id === item.branchId);
                  return (
                    <div key={item.id}>
                      <Link
                        to={`/app/cafe/${item.branchId}`}
                        className="text-[11.5px] text-[var(--color-terracotta)] hover:underline pt-3 inline-block"
                      >
                        {branch?.shortName}
                      </Link>
                      <MenuItemCard item={item} compact />
                    </div>
                  );
                })}
              </Card>
            </section>
          )}
        </div>
      )}

      {/* ------------------------------------------------- filter drawer */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description="Narrow results to what you actually want right now."
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={resetFilters}>
              Reset
            </Button>
            <Button fullWidth onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pb-1">
          {/* Diet */}
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5">
              Dietary
            </h3>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'veg', label: 'Vegetarian' },
                  { value: 'egg', label: 'Contains egg' },
                  { value: 'nonveg', label: 'Non-vegetarian' },
                ] as { value: DietType; label: string }[]
              ).map((d) => (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={diets.includes(d.value)}
                  onClick={() =>
                    setDiets((prev) =>
                      prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value],
                    )
                  }
                  className={cx(
                    'px-3.5 h-9 rounded-full text-[12.5px] border transition-colors',
                    diets.includes(d.value)
                      ? 'border-[var(--color-veg)] bg-[var(--color-veg-tint)] text-[var(--color-veg)] font-medium'
                      : 'border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)]">
                Maximum price
              </h3>
              <span className="text-[13px] text-[var(--color-terracotta)] font-medium tabular-nums">
                ₹{maxPrice}
                {maxPrice >= 500 && '+'}
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={500}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Maximum price"
              className="w-full accent-[var(--color-saffron)]"
            />
          </div>

          {/* Prep time */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)]">
                Ready within
              </h3>
              <span className="text-[13px] text-[var(--color-terracotta)] font-medium tabular-nums">
                {maxPrep} min{maxPrep >= 30 && '+'}
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={maxPrep}
              onChange={(e) => setMaxPrep(Number(e.target.value))}
              aria-label="Maximum preparation time"
              className="w-full accent-[var(--color-saffron)]"
            />
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5">
              Minimum cafe rating
            </h3>
            <div className="flex flex-wrap gap-2">
              {[0, 4, 4.3, 4.5].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={minRating === r}
                  onClick={() => setMinRating(r)}
                  className={cx(
                    'px-3.5 h-9 rounded-full text-[12.5px] border transition-colors',
                    minRating === r
                      ? 'border-[var(--color-saffron)] bg-[var(--color-saffron-tint)] text-[var(--color-saffron-deep)] font-medium'
                      : 'border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                  )}
                >
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Open now */}
          <div className="py-1">
            <Switch
              checked={openOnly}
              onChange={setOpenOnly}
              label="Open right now"
              description="Hide counters that are shut, so you only see what you can actually order."
            />
          </div>

          {/* Cafes */}
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--color-charcoal)] mb-2.5">Cafes</h3>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={branchFilter.includes(b.id)}
                  onClick={() =>
                    setBranchFilter((prev) =>
                      prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id],
                    )
                  }
                  className={cx(
                    'px-3.5 h-9 rounded-full text-[12.5px] border transition-colors',
                    branchFilter.includes(b.id)
                      ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)] font-medium'
                      : 'border-[var(--color-beige)] text-[var(--color-ink-muted)] hover:border-[var(--color-brass)]',
                  )}
                >
                  {b.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
