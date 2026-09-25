import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function AdminRoute({ children }) {
    const { isAdmin, loading, profile } = useAuth();

    if (loading) {
        return <div className="p-6 text-slate-500 dark:text-slate-400">Loading…</div>;
    }

    if (!profile) return <Navigate to="/login" replace />;

    if (!isAdmin) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
                    🔒 Access denied — Admin access required.
                </div>
            </div>
        );
    }

    return children;
}
