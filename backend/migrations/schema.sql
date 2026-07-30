-- ============================================================
-- VITeBites — Phase 1 Schema
-- Run this in Supabase SQL Editor FIRST before any other script
-- ============================================================

-- ============ AUTH / PROFILES ============
create table if not exists profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text,
  role text check (role in ('student','faculty','vendor_counter','vendor_kitchen')) not null,
  registration_number text,
  branch text,
  batch_year text,
  vendor_id uuid,
  created_at timestamptz default now()
);

-- ============ VENDORS ============
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  logo_url text,
  is_open boolean default true,
  closing_time time,
  active_order_count int default 0,
  created_at timestamptz default now()
);

-- Add FK after vendors table exists
alter table profiles add constraint profiles_vendor_id_fkey
  foreign key (vendor_id) references vendors(id);

-- ============ MENU ITEMS ============
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) not null,
  name text not null,
  description text,
  category text,
  veg boolean not null,
  price_full numeric not null,
  price_half numeric,
  pieces_full int,
  pieces_half int,
  serving_note text,
  image_url text,
  available boolean default true,
  flash_discount_percent int default 0,
  created_at timestamptz default now()
);

-- ============ ORDERS ============
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  vendor_id uuid references vendors(id) not null,
  status text check (status in (
    'pending_sync',
    'placed',
    'preparing',
    'ready',
    'completed',
    'cancelled_soldout',
    'cancelled_other'
  )) default 'placed',
  is_group_order boolean default false,
  group_order_id uuid,
  token_number text,
  local_token text,
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  payment_status text check (payment_status in ('authorized','captured','refunded','failed')),
  razorpay_order_id text,
  total_amount numeric not null,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) not null,
  menu_item_id uuid references menu_items(id) not null,
  size text check (size in ('full','half')),
  quantity int not null,
  price_at_order numeric not null
);

-- ============ REVIEWS ============
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) not null,
  menu_item_id uuid references menu_items(id) not null,
  user_id uuid references profiles(id) not null,
  liked boolean not null,
  created_at timestamptz default now(),
  unique(order_id, menu_item_id)
);

-- ============ ENABLE REALTIME ============
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table vendors;
alter publication supabase_realtime add table menu_items;
