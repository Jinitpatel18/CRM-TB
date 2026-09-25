import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { supabase } from './supabase';

const OrgContext = createContext(null);

const STORAGE_KEY = 'crm_active_org_id';

export function OrgProvider({ children }) {
    const [organizations, setOrganizations] = useState([]);
    const [activeOrg, setActiveOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadOrgs = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setOrganizations([]);
                setActiveOrg(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const orgs = await api.listMyOrganizations();
            setOrganizations(orgs || []);

            // Pick active org
            const storedId = localStorage.getItem(STORAGE_KEY);
            let selected = null;

            if (storedId) {
                selected = orgs.find((o) => String(o.id) === String(storedId));
            }
            if (!selected && orgs.length > 0) {
                selected = orgs[0];
            }

            if (selected) {
                localStorage.setItem(STORAGE_KEY, String(selected.id));
                setActiveOrg(selected);
            } else {
                localStorage.removeItem(STORAGE_KEY);
                setActiveOrg(null);
            }
        } catch (err) {
            console.error('[org] load failed:', err);
            setError(err.message);
            setOrganizations([]);
            setActiveOrg(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrgs();

        // Reload orgs on auth change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                loadOrgs();
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    const switchOrg = (orgId) => {
        const org = organizations.find((o) => String(o.id) === String(orgId));
        if (!org) return;
        localStorage.setItem(STORAGE_KEY, String(org.id));
        setActiveOrg(org);
        // Force refresh all queries
        window.location.reload();
    };

    const value = {
        organizations,
        activeOrg,
        activeOrgId: activeOrg?.id || null,
        loading,
        error,
        reload: loadOrgs,
        switchOrg,
        hasOrg: !!activeOrg,
    };

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export const useOrg = () => {
    const ctx = useContext(OrgContext);
    if (!ctx) throw new Error('useOrg must be used within OrgProvider');
    return ctx;
};