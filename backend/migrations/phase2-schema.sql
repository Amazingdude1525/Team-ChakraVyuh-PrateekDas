-- ============================================================
-- VITeBites — Phase 2 Schema Additions
-- Run AFTER Phase 1 schema.sql
-- ============================================================

-- ============ ORDER ITEMS: per-item prep state for KDS ============
-- Kitchen staff marks individual items as pending/in_prep/done
alter table order_items add column if not exists prep_status text
  check (prep_status in ('pending', 'in_prep', 'done'))
  default 'pending';

-- Add realtime for order_items so KDS gets live updates
alter publication supabase_realtime add table order_items;

-- ============ ORDERS: customer_note field ============
alter table orders add column if not exists customer_note text;

-- ============ RPC: increment/decrement active order count atomically ============
create or replace function increment_active_orders(vid uuid)
returns void as $$
begin
  update vendors set active_order_count = active_order_count + 1 where id = vid;
end;
$$ language plpgsql security definer;

create or replace function decrement_active_orders(vid uuid)
returns void as $$
begin
  update vendors set active_order_count = greatest(active_order_count - 1, 0) where id = vid;
end;
$$ language plpgsql security definer;

-- ============ RPC: auto-transition order to 'ready' when all items are done ============
create or replace function check_order_items_done()
returns trigger as $$
declare
  all_done boolean;
  current_status text;
begin
  -- Check if all items in this order are 'done'
  select not exists(
    select 1 from order_items
    where order_id = NEW.order_id and prep_status != 'done'
  ) into all_done;

  -- Only auto-transition if all items done and order is still in 'preparing'
  if all_done then
    select status into current_status from orders where id = NEW.order_id;
    if current_status = 'preparing' then
      update orders set status = 'ready' where id = NEW.order_id;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger: fire after each order_item prep_status update
drop trigger if exists trg_check_all_items_done on order_items;
create trigger trg_check_all_items_done
  after update of prep_status on order_items
  for each row
  when (NEW.prep_status = 'done')
  execute function check_order_items_done();

-- ============ VIEW: daily item sales for vendor insights ============
create or replace view daily_item_sales as
select
  oi.menu_item_id,
  mi.name as item_name,
  mi.vendor_id,
  mi.category,
  sum(oi.quantity) as total_sold,
  count(distinct oi.order_id) as order_count,
  sum(oi.price_at_order * oi.quantity) as total_revenue
from order_items oi
join menu_items mi on oi.menu_item_id = mi.id
join orders o on oi.order_id = o.id
where o.created_at::date = current_date
  and o.status not in ('cancelled_soldout', 'cancelled_other', 'pending_sync')
group by oi.menu_item_id, mi.name, mi.vendor_id, mi.category
order by total_sold desc;

-- ============ STORAGE BUCKET for menu images ============
-- Note: Run this in Supabase Dashboard > Storage > New Bucket
-- or via API. Name: menu-images, public: true
-- Storage RLS policy (applied in Supabase Dashboard):
-- INSERT: (bucket_id = 'menu-images') AND (storage.foldername(name))[1] = (select vendor_id::text from profiles where id = auth.uid())
-- SELECT: true (public read)
