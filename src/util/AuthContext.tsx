'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';

type UserProfile = {
    id: string;
    full_name: string | null;
    role: string;
    client_id: string;
    agent_name: string | null;
};

type AuthContextType = {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    supabase: SupabaseClient | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const initAuth = async () => {
            const { getSupabaseBrowserClient } = await import('@/util/supabase');
            const client = getSupabaseBrowserClient();
            setSupabase(client);

            const { data: { session } } = await client.auth.getSession();
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchProfile(client, session.user.id);
            }
            setLoading(false);

            const { data: { subscription } } = client.auth.onAuthStateChange(
                async (_event, session) => {
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(client, session.user.id);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }
            );

            return () => {
                subscription.unsubscribe();
            };
        };

        initAuth();
    }, []);

    async function fetchProfile(client: SupabaseClient, userId: string) {
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data && !error) {
            setProfile(data as UserProfile);
        }
    }

    async function signOut() {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setProfile(null);
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, supabase }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
