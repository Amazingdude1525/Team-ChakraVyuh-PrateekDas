// VITeBites — Vendor Account Bootstrap Edge Function
// Deploy to Supabase Edge Functions and invoke ONCE to create all 10 vendor staff accounts.
// After successful execution, DELETE this function — it should never be publicly accessible.
//
// Usage: curl -X POST https://<project>.supabase.co/functions/v1/bootstrap-vendors \
//   -H "Authorization: Bearer <service_role_key>"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VENDOR_ACCOUNTS = [
  // Mayuri (AB)
  { email: 'mayuriab.counter@vitebites.internal', password: 'VITeBites@MAB2025', role: 'vendor_counter', vendor_id: '11111111-1111-1111-1111-111111111101', full_name: 'Mayuri AB Counter' },
  { email: 'mayuriab.kitchen@vitebites.internal', password: 'VITeBites@MAB2025K', role: 'vendor_kitchen', vendor_id: '11111111-1111-1111-1111-111111111101', full_name: 'Mayuri AB Kitchen' },
  // Mayuri (Special Block)
  { email: 'mayurisb.counter@vitebites.internal', password: 'VITeBites@MSB2025', role: 'vendor_counter', vendor_id: '11111111-1111-1111-1111-111111111102', full_name: 'Mayuri SB Counter' },
  { email: 'mayurisb.kitchen@vitebites.internal', password: 'VITeBites@MSB2025K', role: 'vendor_kitchen', vendor_id: '11111111-1111-1111-1111-111111111102', full_name: 'Mayuri SB Kitchen' },
  // UnderBelly (UB)
  { email: 'underbelly.counter@vitebites.internal', password: 'VITeBites@UB2025', role: 'vendor_counter', vendor_id: '11111111-1111-1111-1111-111111111103', full_name: 'UnderBelly Counter' },
  { email: 'underbelly.kitchen@vitebites.internal', password: 'VITeBites@UB2025K', role: 'vendor_kitchen', vendor_id: '11111111-1111-1111-1111-111111111103', full_name: 'UnderBelly Kitchen' },
  // Dakshin
  { email: 'dakshin.counter@vitebites.internal', password: 'VITeBites@DK2025', role: 'vendor_counter', vendor_id: '11111111-1111-1111-1111-111111111104', full_name: 'Dakshin Counter' },
  { email: 'dakshin.kitchen@vitebites.internal', password: 'VITeBites@DK2025K', role: 'vendor_kitchen', vendor_id: '11111111-1111-1111-1111-111111111104', full_name: 'Dakshin Kitchen' },
  // Bistro Cafe by Safal
  { email: 'bistro.counter@vitebites.internal', password: 'VITeBites@BSF2025', role: 'vendor_counter', vendor_id: '11111111-1111-1111-1111-111111111105', full_name: 'Bistro Counter' },
  { email: 'bistro.kitchen@vitebites.internal', password: 'VITeBites@BSF2025K', role: 'vendor_kitchen', vendor_id: '11111111-1111-1111-1111-111111111105', full_name: 'Bistro Kitchen' },
];

Deno.serve(async (req) => {
  // Only allow POST with service_role key
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = [];

  for (const account of VENDOR_ACCOUNTS) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm since these are internal accounts
      });

      if (authError) {
        results.push({ email: account.email, status: 'auth_error', error: authError.message });
        continue;
      }

      // Create profile linked to auth user
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: account.email,
        role: account.role,
        vendor_id: account.vendor_id,
        full_name: account.full_name,
      });

      if (profileError) {
        results.push({ email: account.email, status: 'profile_error', error: profileError.message });
        continue;
      }

      results.push({ email: account.email, status: 'created', userId: authData.user.id });
    } catch (err) {
      results.push({ email: account.email, status: 'exception', error: String(err) });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
