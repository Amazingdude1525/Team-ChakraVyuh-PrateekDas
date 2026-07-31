-- ============================================================================
-- VITeBites Supabase Database Schema
-- Run this script directly in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Cafes Table
CREATE TABLE IF NOT EXISTS public.cafes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  brand_color TEXT NOT NULL DEFAULT '#D95D39',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  cafe_id TEXT NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  location TEXT NOT NULL,
  pickup_point TEXT NOT NULL,
  description TEXT,
  open_time TEXT NOT NULL DEFAULT '08:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  active_order_count INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 4.8,
  rating_count INT DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  diet TEXT NOT NULL CHECK (diet IN ('veg', 'egg', 'nonveg')),
  base_price INT NOT NULL,
  bestseller BOOLEAN DEFAULT FALSE,
  recommended BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  prep_minutes INT DEFAULT 10,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Menu Variants Table
CREATE TABLE IF NOT EXISTS public.menu_variants (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price INT NOT NULL
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  phone TEXT,
  diet_preference TEXT DEFAULT 'any',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  branch_id TEXT NOT NULL REFERENCES public.branches(id),
  student_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('placed', 'preparing', 'ready', 'collected', 'cancelled')),
  cancel_reason TEXT,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  subtotal INT NOT NULL,
  discount INT DEFAULT 0,
  discount_label TEXT,
  taxes INT NOT NULL,
  total INT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_state TEXT NOT NULL CHECK (payment_state IN ('pay_at_counter', 'paid', 'refunded')),
  note TEXT,
  cutlery BOOLEAN DEFAULT FALSE,
  is_group_order BOOLEAN DEFAULT FALSE,
  group_id TEXT,
  heading_over BOOLEAN DEFAULT FALSE,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  unit_price INT NOT NULL,
  quantity INT NOT NULL,
  diet TEXT NOT NULL,
  note TEXT,
  prep_state TEXT NOT NULL DEFAULT 'pending' CHECK (prep_state IN ('pending', 'in_prep', 'done')),
  participant_name TEXT
);

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id),
  student_name TEXT NOT NULL,
  thumb TEXT NOT NULL CHECK (thumb IN ('up', 'down')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable Supabase Realtime for Instant Order Board Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- 11. Row Level Security Policies (Permissive Public Access for Prototype)
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for cafes" ON public.cafes FOR SELECT USING (true);
CREATE POLICY "Allow public read for branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow public read for menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert and select for orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow public insert and select for order_items" ON public.order_items FOR ALL USING (true);

-- ============================================================================
-- Seed Sample Data
-- ============================================================================

INSERT INTO public.cafes (id, name, tagline, description, brand_color) VALUES
('underbelly', 'UnderBelly', 'Late night comfort food', 'Fast-casual dining with burgers, wraps, and momos.', '#E65100'),
('mayuri', 'Mayuri', 'Authentic South Indian & Thalis', 'Fresh dosas, idlis, thalis, and filter coffee.', '#F57C00'),
('dakshin', 'Dakshin', 'South Indian Flavors', 'Traditional South Indian delicacies.', '#D84315'),
('bistro', 'Bistro', 'Specialty Safal Bakery & Pizzas', 'Woodfire pizzas, rolls, and cold brews.', '#8D6E63')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, cafe_id, name, short_name, location, pickup_point, description, open_time, close_time) VALUES
('underbelly', 'underbelly', 'UnderBelly — Central Block', 'UnderBelly', 'UnderBelly Food Court', 'Counter 1 (Pickup Window)', 'Fast food counter operating late nights.', '09:00', '23:30'),
('mayuri-ab', 'mayuri', 'Mayuri — AB-1', 'Mayuri AB-1', 'AB-1 Ground Floor', 'Counter 2 (Main Hall)', 'South Indian breakfasts and meal thalis.', '08:00', '21:00'),
('mayuri-special', 'mayuri', 'Mayuri — Special Block', 'Mayuri Special', 'Special Block Foyer', 'Counter 3', 'Quick thalis, fried rice, and beverages.', '08:30', '21:30'),
('dakshin', 'dakshin', 'Dakshin — AB-1', 'Dakshin', 'AB-1 First Floor', 'Counter 4', 'Crispy dosas, vada, and authentic sambar.', '08:00', '20:30'),
('bistro-safal', 'bistro', 'Bistro Safal — AB-2', 'Bistro Safal', 'AB-2 Ground Floor', 'Counter 5', 'Pizzas, garlic bread, milkshakes, and pastries.', '10:00', '22:00')
ON CONFLICT (id) DO NOTHING;
