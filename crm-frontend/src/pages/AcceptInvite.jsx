import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, Check, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useOrg } from '../lib/OrgContext';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

export default function AcceptInvite() {
    const { token } = useParams();
    const nav = useNavigate();
    const { session, loading: authLoading } = useAuth();
    const { reload: reloadOrgs } = useOrg();

    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState(null);

    // Verify invite on mount
    useEffect(() => {
        (async () => {
            try {
                const data = await api.verifyInvitation(token);
                setInvite(data);
            } catch (err) {
                setError(err.message || 'Invalid invitation');
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    // If user is not logged in, redirect to login with return URL
    useEffect(() => {
        if (!authLoading && !session && !loading) {
            nav(`/login?return=/invite/${token}`, { replace: true });
        }
    }, [authLoading, session, loading, token, nav]);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            await api.acceptInvitation(token);
            toast.success(`Joined ${invite.organization_name}!`);
            await reloadOrgs();
            // Wait a bit for localStorage to update
            setTimeout(() => {
                nav('/', { replace: true });
            }, 800);
        } catch (err) {
            toast.error(err.message || 'Failed to accept invitation');
            setAccepting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen auth-bg flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-600 dark:text-brand-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen auth-bg flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-pop dark:shadow-pop-dark p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={28} className="text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                        Invalid Invitation
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                    <Link to="/">
                        <Button variant="secondary">Go to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen auth-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-pop dark:shadow-pop-dark p-8 relative">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>

                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
                        <Building2 size={28} className="text-brand-600 dark:text-brand-400" />
                    </div>
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
                        You've been invited!
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Join <strong>{invite.organization_name}</strong>
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Invited email</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{invite.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Your role</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100 capitalize">
                            {invite.role}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Organization</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                            {invite.organization_name}
                        </span>
                    </div>
                </div>

                <Button onClick={handleAccept} disabled={accepting} className="w-full">
                    {accepting ? (
                        <>
                            <Loader2 size={14} className="animate-spin mr-2" />
                            Accepting…
                        </>
                    ) : (
                        <>
                            <Check size={14} className="mr-2" />
                            Accept Invitation
                        </>
                    )}
                </Button>

                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
                    By accepting, you'll join this organization as a {invite.role}.
                </p>
            </div>
        </div>
    );
}
