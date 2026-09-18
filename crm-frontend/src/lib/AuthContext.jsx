import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);   // user_profiles row
    const [loading, setLoading] = useState(true);

    const loadProfile = async (userId) => {
        if (!userId) return setProfile(null);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, role, status')
            .eq('id', userId)
            .single();
        if (error) {
            console.warn('[auth] profile load failed:', error.message);
            return setProfile(null);
        }
        setProfile(data);
    };

    useEffect(() => {
        let mounted = true;

        // Initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            setSession(session);
            if (session?.user) {
                loadProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;
                setSession(session);
                if (session?.user) {
                    await loadProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    const value = {
        session,
        user: session?.user || null,
        profile,                    // { id, email, full_name, role, status }
        role: profile?.role || null,
        loading,
        isAdmin: profile?.role === 'admin',
        isSales: profile?.role === 'sales',
        isViewer: profile?.role === 'viewer',
        signIn: (email, password) =>
            supabase.auth.signInWithPassword({ email, password }),
        signUp: (email, password) =>
            supabase.auth.signUp({ email, password }),
        signOut: () => supabase.auth.signOut(),
        refreshProfile: () => session?.user && loadProfile(session.user.id),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};