-- ============================================================
-- VITeBites — Phase 2 Hardened RLS Policies
-- Run AFTER Phase 1 rls-policies.sql + phase2-schema.sql
-- ============================================================

-- ============ TIGHTEN VENDOR MENU MANAGEMENT ============
-- Drop Phase 1's overly-broad vendor menu policy that included kitchen role
drop policy if exists "vendors manage own menu items" on menu_items;

-- Counter staff ONLY can manage (INSERT/UPDATE/DELETE) their vendor's menu items
create policy "counter manages own menu items" on menu_items
  for all using (
    vendor_id = (select vendor_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'vendor_counter'
  );

-- ============ TIGHTEN VENDOR ORDER UPDATES ============
-- Drop Phase 1's broad vendor order update policy
drop policy if exists "vendors update own orders" on orders;

-- Counter staff can update status (full order lifecycle)
create policy "counter updates own vendor orders" on orders
  for update using (
    vendor_id = (select vendor_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'vendor_counter'
  );

-- Kitchen staff can ONLY update orders in their vendor (for status auto-transition via trigger)
-- They don't directly update orders — the trigger does it as security definer
-- But they need SELECT to see orders (already covered by Phase 1 "vendors see own orders")

-- ============ ORDER ITEMS: Kitchen can update prep_status only ============
-- Kitchen staff can update prep_status on their vendor's order items
create policy "kitchen updates prep status" on order_items
  for update using (
    order_id in (
      select id from orders where vendor_id = (
        select vendor_id from profiles where id = auth.uid()
      )
    )
    and (select role from profiles where id = auth.uid()) in ('vendor_kitchen', 'vendor_counter')
  );

-- ============ VENDORS TABLE: only counter staff toggle is_open ============
-- Drop Phase 1's broad vendor update policy
drop policy if exists "vendors update own vendor" on vendors;

create policy "counter updates own vendor record" on vendors
  for update using (
    id = (select vendor_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'vendor_counter'
  );

-- ============ FLASH DISCOUNT: server-side time gate ============
-- This function enforces the 45-minute window before closing time
create or replace function set_flash_discount(
  p_menu_item_id uuid,
  p_discount_percent int
)
returns void as $$
declare
  v_vendor_id uuid;
  v_closing_time time;
  v_caller_vendor_id uuid;
  v_caller_role text;
begin
  -- Get caller's vendor and role
  select vendor_id, role into v_caller_vendor_id, v_caller_role
  from profiles where id = auth.uid();

  -- Only counter staff
  if v_caller_role != 'vendor_counter' then
    raise exception 'Only counter staff can set flash discounts';
  end if;

  -- Get the menu item's vendor and vendor's closing time
  select mi.vendor_id, v.closing_time
  into v_vendor_id, v_closing_time
  from menu_items mi join vendors v on mi.vendor_id = v.id
  where mi.id = p_menu_item_id;

  -- Verify vendor ownership
  if v_vendor_id != v_caller_vendor_id then
    raise exception 'Cannot modify another vendor''s menu items';
  end if;

  -- Enforce time gate: only within 45 minutes of closing
  if v_closing_time is null then
    raise exception 'Vendor has no closing time configured';
  end if;

  if current_time < (v_closing_time - interval '45 minutes') or current_time > v_closing_time then
    raise exception 'Flash discounts can only be set within 45 minutes of closing time';
  end if;

  -- Validate discount range
  if p_discount_percent < 0 or p_discount_percent > 50 then
    raise exception 'Discount must be between 0 and 50 percent';
  end if;

  -- Apply the discount
  update menu_items
  set flash_discount_percent = p_discount_percent
  where id = p_menu_item_id and vendor_id = v_caller_vendor_id;
end;
$$ language plpgsql security definer;
