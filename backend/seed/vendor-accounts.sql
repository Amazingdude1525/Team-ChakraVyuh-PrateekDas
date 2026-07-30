-- ============================================================
-- VITeBites — Vendor Staff Account Seed
-- Creates 10 vendor accounts (5 counter + 5 kitchen)
--
-- IMPORTANT: Run these in order:
-- 1. First use Supabase Dashboard > Authentication > Users to create
--    auth.users entries for each email/password below
-- 2. Then run this SQL to create the profiles linked to those auth users
--
-- Alternative: Use supabase.auth.admin.createUser() in an Edge Function
-- ============================================================

-- ============ VENDOR ACCOUNT CREDENTIALS ============
-- Store these securely; these are the login credentials for cafe staff

-- Mayuri (AB) — vendor UUID: 11111111-1111-1111-1111-111111111101
-- Counter: mayuriab.counter@vitebites.internal / VITeBites@MAB2025
-- Kitchen: mayuriab.kitchen@vitebites.internal / VITeBites@MAB2025K

-- Mayuri (Special Block) — vendor UUID: 11111111-1111-1111-1111-111111111102
-- Counter: mayurisb.counter@vitebites.internal / VITeBites@MSB2025
-- Kitchen: mayurisb.kitchen@vitebites.internal / VITeBites@MSB2025K

-- UnderBelly (UB) — vendor UUID: 11111111-1111-1111-1111-111111111103
-- Counter: underbelly.counter@vitebites.internal / VITeBites@UB2025
-- Kitchen: underbelly.kitchen@vitebites.internal / VITeBites@UB2025K

-- Dakshin — vendor UUID: 11111111-1111-1111-1111-111111111104
-- Counter: dakshin.counter@vitebites.internal / VITeBites@DK2025
-- Kitchen: dakshin.kitchen@vitebites.internal / VITeBites@DK2025K

-- Bistro Cafe by Safal — vendor UUID: 11111111-1111-1111-1111-111111111105
-- Counter: bistro.counter@vitebites.internal / VITeBites@BSF2025
-- Kitchen: bistro.kitchen@vitebites.internal / VITeBites@BSF2025K

-- ============ EDGE FUNCTION TO CREATE ACCOUNTS ============
-- Deploy this as a Supabase Edge Function and call it ONCE to bootstrap accounts.
-- After that, delete or disable the function.

-- Below is the SQL version assuming you've already created auth users
-- via Dashboard and noted down their UUIDs.
-- Replace the placeholder UUIDs with real auth.users.id values.

-- TEMPLATE (replace UUIDs after creating auth users):
/*
INSERT INTO profiles (id, email, role, vendor_id, full_name) VALUES
-- Mayuri AB
('REPLACE-WITH-AUTH-USER-UUID-01', 'mayuriab.counter@vitebites.internal', 'vendor_counter', '11111111-1111-1111-1111-111111111101', 'Mayuri AB Counter'),
('REPLACE-WITH-AUTH-USER-UUID-02', 'mayuriab.kitchen@vitebites.internal', 'vendor_kitchen', '11111111-1111-1111-1111-111111111101', 'Mayuri AB Kitchen'),
-- Mayuri SB
('REPLACE-WITH-AUTH-USER-UUID-03', 'mayurisb.counter@vitebites.internal', 'vendor_counter', '11111111-1111-1111-1111-111111111102', 'Mayuri SB Counter'),
('REPLACE-WITH-AUTH-USER-UUID-04', 'mayurisb.kitchen@vitebites.internal', 'vendor_kitchen', '11111111-1111-1111-1111-111111111102', 'Mayuri SB Kitchen'),
-- UnderBelly
('REPLACE-WITH-AUTH-USER-UUID-05', 'underbelly.counter@vitebites.internal', 'vendor_counter', '11111111-1111-1111-1111-111111111103', 'UnderBelly Counter'),
('REPLACE-WITH-AUTH-USER-UUID-06', 'underbelly.kitchen@vitebites.internal', 'vendor_kitchen', '11111111-1111-1111-1111-111111111103', 'UnderBelly Kitchen'),
-- Dakshin
('REPLACE-WITH-AUTH-USER-UUID-07', 'dakshin.counter@vitebites.internal', 'vendor_counter', '11111111-1111-1111-1111-111111111104', 'Dakshin Counter'),
('REPLACE-WITH-AUTH-USER-UUID-08', 'dakshin.kitchen@vitebites.internal', 'vendor_kitchen', '11111111-1111-1111-1111-111111111104', 'Dakshin Kitchen'),
-- Bistro
('REPLACE-WITH-AUTH-USER-UUID-09', 'bistro.counter@vitebites.internal', 'vendor_counter', '11111111-1111-1111-1111-111111111105', 'Bistro Counter'),
('REPLACE-WITH-AUTH-USER-UUID-10', 'bistro.kitchen@vitebites.internal', 'vendor_kitchen', '11111111-1111-1111-1111-111111111105', 'Bistro Kitchen');
*/
