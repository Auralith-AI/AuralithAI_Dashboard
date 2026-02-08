'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);

                // Fetch profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setProfile(profileData);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setProfile(data);
            } else {
                setUser(null);
                setProfile(null);
                // router.push('/login'); // Optional strict redirect
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
