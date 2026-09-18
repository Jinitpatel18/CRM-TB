import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    console.warn('[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anonKey, {
    auth: {
        persistSession: true,        // Session localStorage me save
        autoRefreshToken: true,      // JWT auto-refresh
        detectSessionInUrl: true,    // OAuth redirect handle
        storageKey: 'crm-auth-token',
    },
    realtime: { params: { eventsPerSecond: 5 } },
});