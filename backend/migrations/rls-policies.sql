-- ============================================================
-- VITeBites — Row Level Security Policies
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============ PROFILES ============
alter table profiles enable row level security;

-- Users can read their own profile
create policy "users read own profile" on profiles
  for select using (auth.uid() = id);

-- Users can update their own profile
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

-- Allow insert on signup (auth trigger or client-side upsert)
create policy "users insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- ============ VENDORS ============
alter table vendors enable row level security;

-- Everyone can read vendors (public info)
create policy "public read vendors" on vendors
  for select using (true);

-- Only vendor accounts can update their own vendor
create policy "vendors update own vendor" on vendors
  for update using (
    id in (
      select vendor_id from profiles where id = auth.uid() and role in ('vendor_counter', 'vendor_kitchen')
    )
  );

-- ============ MENU ITEMS ============
alter table menu_items enable row level security;

-- Everyone can read menu items (public browsing)
create policy "public read menu items" on menu_items
  for select using (true);

-- Vendors can insert/update/delete their own menu items only
create policy "vendors manage own menu items" on menu_items
  for all using (
    vendor_id in (
      select vendor_id from profiles where id = auth.uid() and role in ('vendor_counter', 'vendor_kitchen')
    )
  );

-- ============ ORDERS ============
alter table orders enable row level security;

-- Students see only their own orders
create policy "students see own orders" on orders
  for select using (auth.uid() = user_id);

-- Students can insert their own orders
create policy "students insert own orders" on orders
  for insert with check (auth.uid() = user_id);

-- Vendors see only their own vendor's orders
create policy "vendors see own orders" on orders
  for select using (
    vendor_id in (
      select vendor_id from profiles where id = auth.uid() and role in ('vendor_counter', 'vendor_kitchen')
    )
  );

-- Vendors can update their own vendor's orders (status changes)
create policy "vendors update own orders" on orders
  for update using (
    vendor_id in (
      select vendor_id from profiles where id = auth.uid() and role in ('vendor_counter', 'vendor_kitchen')
    )
  );

-- ============ ORDER ITEMS ============
alter table order_items enable row level security;

-- Students see their own order items (via order join)
create policy "students see own order items" on order_items
  for select using (
    order_id in (
      select id from orders where user_id = auth.uid()
    )
  );

-- Students can insert order items for their own orders
create policy "students insert own order items" on order_items
  for insert with check (
    order_id in (
      select id from orders where user_id = auth.uid()
    )
  );

-- Vendors see their vendor's order items
create policy "vendors see own order items" on order_items
  for select using (
    order_id in (
      select id from orders where vendor_id in (
        select vendor_id from profiles where id = auth.uid() and role in ('vendor_counter', 'vendor_kitchen')
      )
    )
  );

-- ============ REVIEWS ============
alter table reviews enable row level security;

-- Everyone can read reviews
create policy "public read reviews" on reviews
  for select using (true);

-- Users can insert reviews for their own completed orders only
create policy "users insert own reviews" on reviews
  for insert with check (
    auth.uid() = user_id
    and order_id in (
      select id from orders where user_id = auth.uid() and status = 'completed'
    )
  );
