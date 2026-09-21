import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { api } from '../lib/api';

export default function Settings() {
    const [searchParams, setSearchParams] = useSearchParams();
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

        // Handle OAuth callback params
        const google = searchParams.get('google');
        const email = searchParams.get('email');
        const reason = searchParams.get('reason');

        if (google === 'connected') {
            toast.success(`Connected as ${email} ✅`);
            searchParams.delete('google');
            searchParams.delete('email');
            setSearchParams(searchParams, { replace: true });
            loadStatus();
        } else if (google === 'error') {
            toast.error(`Connection failed: ${reason || 'unknown'}`);
            searchParams.delete('google');
            searchParams.delete('reason');
            setSearchParams(searchParams, { replace: true });
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
            <h1 className="text-2xl font-semibold">Settings</h1>

            <Card title="Google Integration">
                {loading ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                ) : status.connected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge tone="Active">Connected</Badge>
                            <span className="text-sm text-slate-700">{status.email}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Google Calendar aur Gmail API is account se connected hai. Meetings real
                            calendar events banayengi aur replies automatically track honge.
                        </p>
                        <Button variant="secondary" onClick={disconnect}>
                            Disconnect Google Account
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Google account connect karo taaki:</p>
                        <ul className="text-sm text-slate-600 list-disc ml-5 space-y-1">
                            <li>Meetings Google Calendar me events banayen</li>
                            <li>Attendees ko email invites jayein</li>
                            <li>Google Meet links auto-generate hon</li>
                            <li>Customer replies automatically track hon</li>
                        </ul>
                        <Button onClick={connect}>🔗 Connect Google Account</Button>
                    </div>
                )}
            </Card>
        </div>
    );
}