import { useEffect, useState } from 'react';
import { Link2, Calendar, Mail, Video, Inbox, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { api } from '../lib/api';

const benefits = [
    { icon: Calendar, text: 'Meetings create real Google Calendar events' },
    { icon: Mail, text: 'Attendees receive email invites automatically' },
    { icon: Video, text: 'Google Meet links are auto-generated' },
    { icon: Inbox, text: 'Customer replies are tracked automatically' },
];

export default function Settings() {
    const [status, setStatus] = useState({ connected: false, email: null });
    const [loading, setLoading] = useState(true);

    const loadStatus = async () => {
        try {
            const data = await api.oauthStatus();
            setStatus(data || { connected: false });
        } catch (err) {
            console.error('OAuth status failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();

        // Handle OAuth callback params (hash-free sync)
        const params = new URLSearchParams(
            window.location.hash.includes('?')
                ? window.location.hash.split('?')[1]
                : window.location.search
        );
        const google = params.get('google');
        const email = params.get('email');
        const reason = params.get('reason');

        if (google === 'connected') {
            toast.success(`Connected as ${email} ✅`);
            loadStatus();
        } else if (google === 'error') {
            toast.error(`Connection failed: ${reason || 'unknown'}`);
        }
    }, []);

    const connect = async () => {
        try {
            const data = await api.oauthUrl();
            if (data?.url) {
                window.location.href = data.url;
            } else {
                toast.error('Failed to get auth URL');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to get auth URL');
        }
    };

    const disconnect = async () => {
        if (!confirm('Disconnect Google account?')) return;
        try {
            await api.oauthDisconnect();
            toast.success('Disconnected');
            loadStatus();
        } catch (err) {
            toast.error(err.message || 'Failed to disconnect');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage integrations and workspace preferences</p>
            </div>

            <Card title="Google Integration" action={<Link2 size={16} className="text-slate-400 dark:text-slate-500" />}>
                {loading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
                ) : status.connected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-soft">
                                <span className="text-lg">✓</span>
                            </div>
                            <div>
                                <Badge tone="Active">Connected</Badge>
                                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{status.email}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Google Calendar and Gmail API are connected to this account. Meetings will create real
                            calendar events and replies will be tracked automatically.
                        </p>
                        <Button variant="secondary" onClick={disconnect}>
                            Disconnect Google Account
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-soft">
                                <LinkIcon size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Connect your Google account to unlock:</p>
                                <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1.5">
                                    {benefits.map(({ icon: Icon, text }) => (
                                        <li key={text} className="flex items-center gap-2">
                                            <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <Button onClick={connect}>🔗 Connect Google Account</Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
