import type { MenuItem } from '../../lib/types';
import MenuItemCard from './MenuItemCard';

interface CategorySectionProps {
  category: string;
  items: MenuItem[];
  vendorId: string;
  vendorName: string;
}

export default function CategorySection({ category, items, vendorId, vendorName }: CategorySectionProps) {
  if (items.length === 0) return null;

  const vegCount = items.filter(i => i.veg).length;
  const nonVegCount = items.filter(i => !i.veg).length;

  return (
    <section id={`cat-${category.replace(/\s+/g, '-').toLowerCase()}`} className="mb-6">
      <div className="sticky top-[57px] z-10 bg-background/90 backdrop-blur-sm py-2 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">{category}</h2>
          <span className="text-xs text-text-muted">
            {items.length} item{items.length > 1 ? 's' : ''}
            {nonVegCount > 0 && vegCount > 0 && ` • ${vegCount} veg, ${nonVegCount} non-veg`}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <MenuItemCard
            key={item.id}
            item={item}
            vendorId={vendorId}
            vendorName={vendorName}
          />
        ))}
      </div>
    </section>
  );
}
