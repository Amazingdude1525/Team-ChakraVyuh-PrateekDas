/* ============================================================
 * VITeBites — TypeScript types matching Supabase schema
 * ============================================================ */

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'faculty' | 'vendor_counter' | 'vendor_kitchen';
  registration_number: string | null;
  branch: string | null;
  batch_year: string | null;
  vendor_id: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  location: string;
  logo_url: string | null;
  is_open: boolean;
  closing_time: string | null;
  active_order_count: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string | null;
  veg: boolean;
  price_full: number;
  price_half: number | null;
  pieces_full: number | null;
  pieces_half: number | null;
  serving_note: string | null;
  image_url: string | null;
  available: boolean;
  flash_discount_percent: number;
  created_at: string;
}

export type OrderStatus =
  | 'pending_sync'
  | 'placed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled_soldout'
  | 'cancelled_other';

export type PaymentStatus = 'authorized' | 'captured' | 'refunded' | 'failed';

export type PrepStatus = 'pending' | 'in_prep' | 'done';

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  status: OrderStatus;
  is_group_order: boolean;
  group_order_id: string | null;
  token_number: string | null;
  local_token: string | null;
  pickup_window_start: string | null;
  pickup_window_end: string | null;
  payment_status: PaymentStatus | null;
  razorpay_order_id: string | null;
  customer_note: string | null;
  total_amount: number;
  created_at: string;
  // Joined fields
  vendor?: Vendor;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  size: 'full' | 'half' | null;
  quantity: number;
  price_at_order: number;
  prep_status: PrepStatus;
  // Joined
  menu_item?: MenuItem;
}

export interface Review {
  id: string;
  order_id: string;
  menu_item_id: string;
  user_id: string;
  liked: boolean;
  created_at: string;
}

export interface CartItem {
  menu_item: MenuItem;
  size: 'full' | 'half';
  quantity: number;
  vendor_id: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string; role: Profile['role'] }; Update: Partial<Profile> };
      vendors: { Row: Vendor; Insert: Partial<Vendor> & { name: string; location: string }; Update: Partial<Vendor> };
      menu_items: { Row: MenuItem; Insert: Partial<MenuItem> & { vendor_id: string; name: string; veg: boolean; price_full: number }; Update: Partial<MenuItem> };
      orders: { Row: Order; Insert: Partial<Order> & { user_id: string; vendor_id: string; total_amount: number }; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem> & { order_id: string; menu_item_id: string; quantity: number; price_at_order: number }; Update: Partial<OrderItem> };
      reviews: { Row: Review; Insert: Partial<Review> & { order_id: string; menu_item_id: string; user_id: string; liked: boolean }; Update: Partial<Review> };
    };
  };
}
