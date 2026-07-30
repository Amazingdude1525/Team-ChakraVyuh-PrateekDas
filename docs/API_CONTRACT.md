# API Contract — VITeBites Backend Edge Functions

> Both frontend and backend teams must read this before writing feature code.
> Update this file immediately when any request/response shape changes.

---

## Supabase Tables Both Sides Depend On

Reference: `backend/migrations/schema.sql` — the canonical schema definition.
**Never redefine column names independently.** Always edit `schema.sql` and push first.

---

## Edge Functions

### POST `/functions/v1/validate-and-confirm-order`

Validates stock, captures payment, assigns token.

**Request:**
```json
{
  "order_id": "uuid",
  "razorpay_payment_id": "string",
  "razorpay_order_id": "string",
  "razorpay_signature": "string"
}
```

**Response (success):**
```json
{
  "success": true,
  "token_number": "MAB-001",
  "pickup_window_start": "2026-07-30T14:00:00Z",
  "pickup_window_end": "2026-07-30T14:15:00Z"
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "SOLD_OUT" | "PAYMENT_FAILED",
  "failed_items": ["item-uuid-1", "item-uuid-2"]
}
```

---

### POST `/functions/v1/sync-offline-order`

Syncs an order queued offline via IndexedDB/Background Sync.

**Request:**
```json
{
  "local_order": {
    "vendor_id": "uuid",
    "user_id": "uuid",
    "items": [
      {
        "menu_item_id": "uuid",
        "size": "full" | "half",
        "quantity": 1,
        "price_at_order": 120
      }
    ],
    "total_amount": 240,
    "local_token": "LOCAL-abc123",
    "razorpay_payment_id": "string"
  }
}
```

**Response:** Same shape as `validate-and-confirm-order`.

---

### POST `/functions/v1/ai-proxy`

Proxies requests to OpenRouter. API key stays server-side.

**Request:**
```json
{
  "system_prompt": "string",
  "user_message": "string",
  "context": {
    "vendor_id": "uuid",
    "menu_items": []
  }
}
```

**Response:**
```json
{
  "answer": "string"
}
```

---

### POST `/functions/v1/activate-flash-discount`

Vendor activates a time-limited flash discount on a menu item.

**Request:**
```json
{
  "menu_item_id": "uuid",
  "discount_percent": 15
}
```

**Response:**
```json
{
  "success": true
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "OUTSIDE_TIME_WINDOW"
}
```

---

## Supabase Realtime Channels (Frontend subscribes, Backend writes)

| Channel | Table | Filter | Used By |
|---------|-------|--------|---------|
| `orders:user:{userId}` | `orders` | `user_id=eq.{userId}` | Student order tracking |
| `orders:vendor:{vendorId}` | `orders` | `vendor_id=eq.{vendorId}` | Counter/Kitchen panels |
| `vendors` | `vendors` | none | Crowd density badges |
| `menu_items:vendor:{vendorId}` | `menu_items` | `vendor_id=eq.{vendorId}` | Flash discount banners |

## Auth Flow

1. Frontend calls `supabase.auth.signInWithOtp({ email })` — restricted to `@vitbhopal.ac.in`
2. On verify, frontend upserts into `profiles` table with auto-detected role
3. Vendor accounts are pre-seeded by backend seed script (not self-signup)
4. Vendor auth uses email/password (`supabase.auth.signInWithPassword`)
