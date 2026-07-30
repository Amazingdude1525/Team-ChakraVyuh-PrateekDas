-- ============================================================
-- VITeBites — Phase 4 Additions
-- Run AFTER phase2-schema.sql
-- ============================================================

-- Add student_departed for Agent P "Heading Over" trigger
alter table orders add column if not exists student_departed boolean default false;

-- Add early_bird_discount_percent for Agent Q Early Bird discount
alter table vendors add column if not exists early_bird_discount_percent int default 0;
alter table vendors add column if not exists meal_window_start time default '12:30';
