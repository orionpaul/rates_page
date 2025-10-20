import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using Firebase Auth, not Supabase Auth
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit to prevent overwhelming the client
    },
  },
  global: {
    headers: {
      'x-application-name': 'rates-app', // Useful for debugging
    },
  },
});
