import { createBrowserClient } from '@supabase/ssr';

// Create a singleton browser client
// This should only be called on the client side
export function getSupabaseBrowserClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        console.error('Missing Supabase environment variables:', {
            url: url ? 'set' : 'MISSING',
            anonKey: anonKey ? 'set' : 'MISSING'
        });
        throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    return createBrowserClient(url, anonKey);
}
