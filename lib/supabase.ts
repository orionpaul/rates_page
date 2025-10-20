import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Warn if missing (but don't throw during build)
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('⚠️ Missing Supabase environment variables. Database features will not work.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
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
  }
);
