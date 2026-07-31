import type { DietType, MenuCategory, MenuItem, MenuVariant } from '../types';
import raw from './menu-data.json';

/**
 * Adapter over the transcribed menu-board data.
 *
 * `menu-data.json` is a near-verbatim transcription of the five physical menu
 * boards, so it is deliberately terse (`n`, `p`, `sm`, `lg`, `t`, `pc`). This
 * module is the single place that widens it into the typed domain models the
 * rest of the app consumes, so the transcription file stays easy to re-sync
 * against a new photograph of a board.
 */

interface RawItem {
  n: string;
  p?: number;
  sm?: number;
  lg?: number;
  t: string;
  pc?: number;
  verify?: boolean;
}

interface RawCategory {
  name: string;
  items: RawItem[];
}

interface RawVendor {
  id: string;
  name: string;
  categories: RawCategory[];
}

const VENDORS = (raw as { vendors: RawVendor[] }).vendors;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Stable non-crypto hash so "random-looking" seed values never change between reloads. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Menu boards list names and prices only. Rather than ship 480 hand-written
 * blurbs (or lorem ipsum), we derive a short, honest description from the
 * item's own name — the first keyword that matches wins.
 */
const DESCRIPTORS: [RegExp, string][] = [
  [/filter coffee/i, 'Decoction brewed fresh, poured hot between tumbler and davara.'],
  [/cold coffee|iced|frappe/i, 'Chilled, shaken and poured over ice.'],
  [/coffee|espresso|americano|cappucino|latte|mocha|affagato/i, 'Pulled to order from freshly ground beans.'],
  [/chai|tea/i, 'Boiled with ginger and cardamom the way the counter has always made it.'],
  [/lassi/i, 'Thick set curd, blended and chilled.'],
  [/shake|milkshake/i, 'Blended thick with cold milk and ice cream.'],
  [/mojito|mocktail|soda|punch|cooler|lemonade/i, 'Fizzy, citrus-forward and served tall over ice.'],
  [/juice/i, 'Pressed fresh at the counter, nothing from a carton.'],
  [/masala dosa/i, 'Crisp rice crepe folded over spiced potato masala, with sambar and chutney.'],
  [/dosa/i, 'Batter ground in-house, spread thin and griddled crisp.'],
  [/uttapam/i, 'Thick, soft griddle cake with the topping cooked into the batter.'],
  [/idli|idly/i, 'Steamed soft, served with sambar and coconut chutney.'],
  [/vada/i, 'Fried to order, crisp outside and soft through the middle.'],
  [/biryani|pulao|bath|rice/i, 'Rice cooked through with whole spices, served hot.'],
  [/paneer/i, 'Fresh paneer, cooked to order in a rich, well-spiced gravy.'],
  [/chicken/i, 'Marinated overnight and cooked to order.'],
  [/momo/i, 'Hand-pleated and steamed, served with a sharp red chutney.'],
  [/pizza/i, 'Hand-stretched base, baked until the edge blisters.'],
  [/pasta|penne|spaghetti|mac n cheese|alfredo|arabiata/i, 'Tossed to order in sauce made fresh that morning.'],
  [/noodle|fried rice|manchurian|schezwan|hakka/i, 'Wok-tossed hot and fast over a high flame.'],
  [/burger/i, 'Toasted bun, thick patty, served with fries on the side.'],
  [/sandwich|toast/i, 'Pressed on the griddle until the cheese pulls.'],
  [/wrap|roll|frankie|kathi/i, 'Rolled tight in a warm paratha, easy to eat between classes.'],
  [/fries|wedges/i, 'Fried crisp and tossed while still hot.'],
  [/samosa|kachori/i, 'Fried fresh through the day, best straight off the tray.'],
  [/chaat|tikki|papdi|puri/i, 'Assembled to order so nothing goes soggy.'],
  [/naan|roti|paratha|kulcha|bread/i, 'Baked in the tandoor and brushed with butter.'],
  [/tandoori|tikka|kebab|seekh/i, 'Charred in the tandoor, served with onion and lemon.'],
  [/cake|pastry|brownie|muffin|doughnut|cheesecake/i, 'From the day\'s bake, cut fresh to order.'],
  [/ice cream|pudding/i, 'Served cold, straight from the chiller.'],
  [/soya chaap/i, 'Slow-marinated chaap, grilled until the edges catch.'],
  [/egg|omelette|bhurji/i, 'Cooked to order on the flat top.'],
  [/maggi/i, 'Two minutes on paper, a little longer in practice. Worth it.'],
  [/nachos/i, 'Corn chips loaded with cheese sauce and jalapeño.'],
  [/combo|thali|platter/i, 'A full plate — the easiest way to eat between back-to-back classes.'],
  [/gulab jamun|sweet/i, 'Soaked in warm syrup, served two to a bowl.'],
  [/soup/i, 'Simmered through the morning, served steaming.'],
];

function describe(name: string, category: string): string {
  for (const [re, text] of DESCRIPTORS) {
    if (re.test(name)) return text;
  }
  return `From the ${category.toLowerCase()} section, made to order at the counter.`;
}

const dietOf = (t: string): DietType =>
  t === 'nonveg' ? 'nonveg' : t === 'egg' ? 'egg' : 'veg';

function buildVariants(itemId: string, r: RawItem): MenuVariant[] {
  // Small/large boards use sm+lg; single-size items only carry p.
  if (r.sm != null && r.lg != null) {
    const isHalfFull = r.pc != null;
    return [
      {
        id: `${itemId}-sm`,
        label: isHalfFull ? 'Half' : 'Small',
        price: r.sm,
        pieces: r.pc != null ? Math.max(1, Math.round(r.pc / 2)) : undefined,
      },
      { id: `${itemId}-lg`, label: isHalfFull ? 'Full' : 'Large', price: r.lg, pieces: r.pc },
    ];
  }
  return [{ id: `${itemId}-std`, label: 'Regular', price: r.p ?? r.lg ?? r.sm ?? 0, pieces: r.pc }];
}

/** Longer-cooking categories get a realistic prep estimate rather than a flat number. */
function prepMinutesFor(category: string, name: string): number {
  if (/pizza/i.test(category) || /pizza/i.test(name)) return 14;
  if (/pasta|chinese|noodle/i.test(category)) return 11;
  if (/tandoori|gravy|starter|chaap|birthday cake/i.test(category)) return 13;
  if (/dosa|uttapam/i.test(category)) return 9;
  if (/beverage|coffee|tea|shake|mocktail|juice|lassi/i.test(category)) return 4;
  if (/bakery|pastry|dessert|sweet|samosa/i.test(category)) return 3;
  return 7;
}

const categories: MenuCategory[] = [];
const items: MenuItem[] = [];

for (const vendor of VENDORS) {
  vendor.categories.forEach((cat, catIndex) => {
    const categoryId = `${vendor.id}-${slug(cat.name)}`;
    categories.push({
      id: categoryId,
      branchId: vendor.id,
      name: cat.name,
      order: catIndex,
    });

    cat.items.forEach((r, itemIndex) => {
      const itemId = `${categoryId}-${slug(r.n)}-${itemIndex}`;
      const variants = buildVariants(itemId, r);
      const seed = hash(itemId);

      // Deterministic seeded engagement — same values on every reload.
      const likes = 8 + (seed % 240);
      const dislikes = Math.floor(likes * ((seed % 17) / 100));

      items.push({
        id: itemId,
        branchId: vendor.id,
        categoryId,
        name: r.n,
        description: describe(r.n, cat.name),
        diet: dietOf(r.t),
        basePrice: Math.min(...variants.map((v) => v.price)),
        variants,
        // A couple of items per category are marked out of stock so the
        // sold-out state is visible without staff having to toggle anything.
        available: seed % 29 !== 0,
        bestseller: seed % 11 === 0,
        recommended: seed % 7 === 0,
        prepMinutes: prepMinutesFor(cat.name, r.n),
        likes,
        dislikes,
        needsVerification: r.verify,
      });
    });
  });
}

export const SEED_CATEGORIES = categories;
export const SEED_MENU_ITEMS = items;

export const categoriesForBranch = (branchId: string) =>
  SEED_CATEGORIES.filter((c) => c.branchId === branchId).sort((a, b) => a.order - b.order);
