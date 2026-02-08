import { createBrowserClient } from '@supabase/ssr';

// Create a singleton browser client
// This should only be called on the client side
export function getSupabaseBrowserClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
