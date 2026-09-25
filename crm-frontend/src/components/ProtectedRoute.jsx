import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { prefetchCorePages } from '../lib/prefetch';

export default function ProtectedRoute({ children }) {
    const { session, loading } = useAuth();
    const location = useLocation();

    // Warm the cache for likely-next pages once the user is authenticated
    useEffect(() => {
        if (session) prefetchCorePages();
    }, [session]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 dark:border-brand-400" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
