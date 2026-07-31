import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Grid3X3,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button, Card, Chip, EmptyState, Switch } from '../../components/ui/primitives';
import { useBranch, useCategories, useMenuItems } from '../../hooks';
import { useStore } from '../../store/useStore';
import { cx, rupees, uid } from '../../utils';
import type { DietType, MenuItem, MenuVariant } from '../../types';

export default function StaffMenuManagement() {
  const { cafeId } = useParams<{ cafeId: string }>();
  const branch = useBranch(cafeId);
  const items = useMenuItems(cafeId);
  const categories = useCategories(cafeId);

  const setItemAvailability = useStore((s) => s.setItemAvailability);
  const bulkSetAvailability = useStore((s) => s.bulkSetAvailability);
  const updateMenuItem = useStore((s) => s.updateMenuItem);
  const addMenuItem = useStore((s) => s.addMenuItem);
  const deleteMenuItem = useStore((s) => s.deleteMenuItem);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dietFilter, setDietFilter] = useState<DietType | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<MenuItem | 'new' | null>(null);

  const filtered = useMemo(() => {
    let result = items;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (categoryFilter) result = result.filter((i) => i.categoryId === categoryFilter);
    if (dietFilter) result = result.filter((i) => i.diet === dietFilter);
    return result;
  }, [items, query, categoryFilter, dietFilter]);

  function handleBulkSoldOut() {
    const ids = Array.from(bulkSelected);
    bulkSetAvailability(ids, false);
    setBulkSelected(new Set());
    setBulkMode(false);
  }

  function toggleBulkItem(id: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (!branch) return null;

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items…"
            className="w-full h-10 pl-9 pr-4 rounded-[10px] bg-[var(--color-cream)] border border-[var(--color-beige)] text-[13px] text-[var(--color-charcoal)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:border-[var(--color-brass)]"
          />
        </div>

        {/* Diet filter */}
        {(['veg', 'egg', 'nonveg'] as DietType[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDietFilter(dietFilter === d ? null : d)}
            className={cx(
              'h-9 px-3 rounded-[10px] text-[12px] font-medium border transition-colors',
              dietFilter === d
                ? d === 'veg' ? 'bg-[var(--color-veg-tint)] border-[var(--color-veg)] text-[var(--color-veg)]' :
                  d === 'egg' ? 'bg-amber-50 border-[var(--color-egg)] text-[var(--color-egg)]' :
                  'bg-[var(--color-wine-tint)] border-[var(--color-wine)] text-[var(--color-wine)]'
                : 'bg-[var(--color-cream)] border-[var(--color-beige)] text-[var(--color-ink-muted)]',
            )}
          >
            {d === 'veg' ? 'Veg' : d === 'egg' ? 'Egg' : 'Non-veg'}
          </button>
        ))}

        {/* View toggle */}
        <div className="flex gap-1 bg-[var(--color-cream)] border border-[var(--color-beige)] rounded-[10px] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cx('p-2 rounded-[8px] transition-colors', viewMode === 'grid' ? 'bg-[var(--color-charcoal)] text-white' : 'text-[var(--color-ink-muted)]')}
          >
            <Grid3X3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cx('p-2 rounded-[8px] transition-colors', viewMode === 'table' ? 'bg-[var(--color-charcoal)] text-white' : 'text-[var(--color-ink-muted)]')}
          >
            <List size={15} />
          </button>
        </div>

        <Button variant="secondary" size="sm" onClick={() => setBulkMode(!bulkMode)}>
          {bulkMode ? 'Cancel bulk' : 'Bulk sold-out'}
        </Button>

        <Button size="sm" onClick={() => setEditItem('new')}>
          <Plus size={14} /> Add item
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter(null)}
          className={cx(
            'px-3 h-8 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors shrink-0',
            !categoryFilter ? 'bg-[var(--color-charcoal)] text-white' : 'bg-[var(--color-cream)] text-[var(--color-ink-muted)] border border-[var(--color-beige)]',
          )}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
              className={cx(
                'px-3 h-8 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors shrink-0',
                categoryFilter === cat.id ? 'bg-[var(--color-charcoal)] text-white' : 'bg-[var(--color-cream)] text-[var(--color-ink-muted)] border border-[var(--color-beige)]',
              )}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {bulkMode && bulkSelected.size > 0 && (
        <Card className="p-3 flex items-center gap-3 bg-[var(--color-wine-tint)] border-[var(--color-wine)]/40">
          <span className="text-[13px] font-medium text-[var(--color-wine)]">
            {bulkSelected.size} items selected
          </span>
          <Button size="sm" onClick={handleBulkSoldOut}>
            Mark all sold out
          </Button>
        </Card>
      )}

      {/* Items */}
      {filtered.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            icon={<Search size={28} />}
            title="No items match"
            body="Try a different search or filter."
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={cx('p-4 transition-all', !item.available && 'opacity-60 border-[var(--color-wine)]/30')}
            >
              <div className="flex items-start gap-3">
                {/* Bulk checkbox */}
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={bulkSelected.has(item.id)}
                    onChange={() => toggleBulkItem(item.id)}
                    className="mt-1 w-4 h-4 accent-[var(--color-terracotta)]"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={cx(
                        'diet-mark',
                        item.diet === 'nonveg' ? 'diet-mark-nonveg border-[var(--color-nonveg)] text-[var(--color-nonveg)]' :
                        item.diet === 'egg' ? 'border-[var(--color-egg)] text-[var(--color-egg)]' :
                        'border-[var(--color-veg)] text-[var(--color-veg)]',
                      )}
                    />
                    <span className="text-[14px] font-semibold text-[var(--color-charcoal)] truncate">{item.name}</span>
                    {item.bestseller && <Chip tone="saffron">★</Chip>}
                  </div>
                  <p className="text-[12px] text-[var(--color-ink-muted)] mb-2 line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-2 text-[13px]">
                    {item.variants.map((v) => (
                      <span key={v.id} className="text-[var(--color-charcoal)] font-medium">
                        {v.label}: {rupees(v.price)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Switch
                    checked={item.available}
                    onChange={(v) => setItemAvailability(item.id, v)}
                    label=""
                  />
                  <span className="text-[10px] text-[var(--color-ink-soft)]">
                    {item.available ? 'Available' : 'Sold out'}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditItem(item)} className="p-1.5 rounded-lg hover:bg-[var(--color-sand)] text-[var(--color-ink-muted)]">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => deleteMenuItem(item.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-wine-tint)] text-[var(--color-wine)]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table view */
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-beige)]">
                <th className="p-3 font-semibold text-[var(--color-ink-muted)]">Item</th>
                <th className="p-3 font-semibold text-[var(--color-ink-muted)]">Category</th>
                <th className="p-3 font-semibold text-[var(--color-ink-muted)]">Diet</th>
                <th className="p-3 font-semibold text-[var(--color-ink-muted)]">Price</th>
                <th className="p-3 font-semibold text-[var(--color-ink-muted)]">Status</th>
                <th className="p-3 font-semibold text-[var(--color-ink-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <tr key={item.id} className="border-b border-[var(--color-beige-soft)] hover:bg-[var(--color-cream)] transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cx(
                            'diet-mark',
                            item.diet === 'nonveg' ? 'diet-mark-nonveg border-[var(--color-nonveg)] text-[var(--color-nonveg)]' :
                            item.diet === 'egg' ? 'border-[var(--color-egg)] text-[var(--color-egg)]' :
                            'border-[var(--color-veg)] text-[var(--color-veg)]',
                          )}
                        />
                        <span className="font-medium text-[var(--color-charcoal)]">{item.name}</span>
                        {item.bestseller && <Chip tone="saffron">★</Chip>}
                      </div>
                    </td>
                    <td className="p-3 text-[var(--color-ink-muted)]">{cat?.name ?? '—'}</td>
                    <td className="p-3 capitalize text-[var(--color-ink-muted)]">{item.diet}</td>
                    <td className="p-3 font-medium text-[var(--color-charcoal)]">{rupees(item.basePrice)}</td>
                    <td className="p-3">
                      <Switch checked={item.available} onChange={(v) => setItemAvailability(item.id, v)} label="" />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setEditItem(item)} className="p-1.5 rounded-lg hover:bg-[var(--color-sand)]">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => deleteMenuItem(item.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-wine-tint)] text-[var(--color-wine)]">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Edit/Add modal */}
      {editItem && (
        <EditItemModal
          item={editItem === 'new' ? null : editItem}
          branchId={cafeId!}
          categories={categories}
          onSave={(item) => {
            if (editItem === 'new') {
              addMenuItem(item);
            } else {
              updateMenuItem(item.id, item);
            }
            setEditItem(null);
          }}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

/* ---------- Edit/Add item modal ---------- */

function EditItemModal({
  item,
  branchId,
  categories,
  onSave,
  onClose,
}: {
  item: MenuItem | null;
  branchId: string;
  categories: { id: string; name: string }[];
  onSave: (item: MenuItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [diet, setDiet] = useState<DietType>(item?.diet ?? 'veg');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? '');
  const [bestseller, setBestseller] = useState(item?.bestseller ?? false);
  const [price1, setPrice1] = useState(String(item?.variants[0]?.price ?? ''));
  const [label1] = useState(item?.variants[0]?.label ?? 'Regular');
  const [price2, setPrice2] = useState(item?.variants[1]?.price ? String(item.variants[1].price) : '');
  const [label2] = useState(item?.variants[1]?.label ?? 'Half');

  function handleSave() {
    const variants: MenuVariant[] = [
      { id: item?.variants[0]?.id ?? uid('v'), label: label1, price: Number(price1) || 0 },
    ];
    if (price2) {
      variants.push({ id: item?.variants[1]?.id ?? uid('v'), label: label2, price: Number(price2) || 0 });
    }

    const result: MenuItem = {
      id: item?.id ?? uid('item'),
      branchId,
      categoryId,
      name: name || 'New item',
      description: description || '',
      diet,
      basePrice: Math.min(...variants.map((v) => v.price)),
      variants,
      available: item?.available ?? true,
      bestseller,
      recommended: item?.recommended ?? false,
      prepMinutes: item?.prepMinutes ?? 8,
      likes: item?.likes ?? 0,
      dislikes: item?.dislikes ?? 0,
    };

    onSave(result);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[var(--color-ivory)] rounded-[18px] shadow-warm-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[var(--color-ivory)] border-b border-[var(--color-beige)] p-4 flex items-center justify-between rounded-t-[18px]">
          <h2 className="text-[16px] font-semibold text-[var(--color-charcoal)]">
            {item ? 'Edit item' : 'Add new item'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-sand)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px]" placeholder="Item name" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1 block">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px]" placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1 block">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px]">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1 block">Dietary type</label>
              <div className="flex gap-1.5 mt-1">
                {(['veg', 'egg', 'nonveg'] as DietType[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiet(d)}
                    className={cx(
                      'flex-1 py-2 rounded-[8px] text-[12px] font-semibold transition-colors',
                      diet === d
                        ? d === 'veg' ? 'bg-[var(--color-veg)] text-white' : d === 'egg' ? 'bg-[var(--color-egg)] text-white' : 'bg-[var(--color-wine)] text-white'
                        : 'bg-[var(--color-sand)] text-[var(--color-ink-muted)]',
                    )}
                  >
                    {d === 'veg' ? 'Veg' : d === 'egg' ? 'Egg' : 'NV'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1 block">{label1} price (₹)</label>
              <input type="number" value={price1} onChange={(e) => setPrice1(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--color-ink-muted)] mb-1 block">{label2} price (₹, optional)</label>
              <input type="number" value={price2} onChange={(e) => setPrice2(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-beige)] bg-[var(--color-cream)] text-[13px]" placeholder="Leave empty if N/A" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={bestseller} onChange={setBestseller} label="Bestseller" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSave}>{item ? 'Save changes' : 'Add item'}</Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
