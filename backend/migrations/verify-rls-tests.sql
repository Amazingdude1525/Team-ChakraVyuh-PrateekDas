-- ============================================================
-- VITeBites — RLS & Auth Verification Tests
-- Run these AFTER all migrations and vendor account seeding
--
-- Execute as each vendor's session (using supabase.auth.signInWithPassword
-- in a test script or via Dashboard's API Explorer with the vendor's JWT)
-- ============================================================

-- ============ TEST 1: Cross-vendor order isolation ============
-- Login as: mayuriab.counter@vitebites.internal
-- Expected: ONLY orders with vendor_id = '11111111-1111-1111-1111-111111111101'
-- Should return 0 rows from Dakshin:

SELECT count(*) as dakshin_orders_visible
FROM orders
WHERE vendor_id = '11111111-1111-1111-1111-111111111104';
-- EXPECTED: 0 (even if Dakshin has orders, Mayuri AB counter can't see them)


-- ============ TEST 2: Kitchen cannot modify menu_items ============
-- Login as: mayuriab.kitchen@vitebites.internal
-- Expected: ERROR / 0 rows affected

UPDATE menu_items
SET price_full = 999
WHERE vendor_id = '11111111-1111-1111-1111-111111111101'
LIMIT 1;
-- EXPECTED: RLS policy violation or 0 rows updated


-- ============ TEST 3: Kitchen CAN update order_items prep_status ============
-- Login as: mayuriab.kitchen@vitebites.internal
-- Expected: SUCCESS for own vendor's order items

-- First, get an order item ID:
-- SELECT oi.id FROM order_items oi
-- JOIN orders o ON oi.order_id = o.id
-- WHERE o.vendor_id = '11111111-1111-1111-1111-111111111101'
-- LIMIT 1;

-- Then:
-- UPDATE order_items SET prep_status = 'in_prep' WHERE id = '<item_id>';
-- EXPECTED: 1 row updated


-- ============ TEST 4: Student cannot read vendor-scoped data ============
-- Login as: any student account (e.g. student@vitbhopal.ac.in)
-- Students can read menu_items (public) and their own orders
-- but should NOT see other students' orders

SELECT count(*) as other_student_orders
FROM orders
WHERE user_id != auth.uid();
-- EXPECTED: 0 (RLS filters to only own orders)


-- ============ TEST 5: Counter CAN toggle vendor is_open ============
-- Login as: mayuriab.counter@vitebites.internal

UPDATE vendors SET is_open = false WHERE id = '11111111-1111-1111-1111-111111111101';
-- EXPECTED: 1 row updated

UPDATE vendors SET is_open = true WHERE id = '11111111-1111-1111-1111-111111111101';
-- EXPECTED: 1 row updated


-- ============ TEST 6: Counter CANNOT toggle another vendor's is_open ============
-- Login as: mayuriab.counter@vitebites.internal

UPDATE vendors SET is_open = false WHERE id = '11111111-1111-1111-1111-111111111104';
-- EXPECTED: 0 rows updated (can't touch Dakshin)


-- ============ TEST 7: Flash discount time gate ============
-- Login as: mayuriab.counter@vitebites.internal
-- If current_time is NOT within 45 min of Mayuri AB's closing_time:

SELECT set_flash_discount(
  (SELECT id FROM menu_items WHERE vendor_id = '11111111-1111-1111-1111-111111111101' LIMIT 1),
  20
);
-- EXPECTED: ERROR 'Flash discounts can only be set within 45 minutes of closing time'


-- ============ TEST 8: Counter cannot set flash discount on another vendor's item ============
-- Login as: mayuriab.counter@vitebites.internal

SELECT set_flash_discount(
  (SELECT id FROM menu_items WHERE vendor_id = '11111111-1111-1111-1111-111111111104' LIMIT 1),
  20
);
-- EXPECTED: ERROR 'Cannot modify another vendor''s menu items'


-- ============ VERIFICATION CHECKLIST ============
-- [ ] Test 1: Cross-vendor order isolation — PASS
-- [ ] Test 2: Kitchen cannot modify menu prices — PASS
-- [ ] Test 3: Kitchen can update prep_status — PASS
-- [ ] Test 4: Student sees only own orders — PASS
-- [ ] Test 5: Counter can toggle own vendor open/close — PASS
-- [ ] Test 6: Counter cannot toggle other vendor — PASS
-- [ ] Test 7: Flash discount time gate enforced — PASS
-- [ ] Test 8: Cross-vendor flash discount blocked — PASS
