import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LiveActivityFeed from '../components/LiveActivityFeed';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { data: queue } = useQuery({ queryKey: ['queue'], queryFn: api.queueStatus, refetchInterval: 5000 });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card title="Email Queue">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(queue?.emailQueue || {}).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <span className="text-slate-500 capitalize">{k}</span>
                                <span className="font-medium">{v}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="WhatsApp Queue">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(queue?.whatsappQueue || {}).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <span className="text-slate-500 capitalize">{k}</span>
                                <span className="font-medium">{v}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="DB Jobs">
                    <div className="space-y-1 text-sm">
                        {(queue?.databaseJobs || []).map((j) => (
                            <div key={j.status} className="flex justify-between">
                                <Badge>{j.status}</Badge>
                                <span className="font-medium">{j.count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card title="Live Activity Feed">
                <LiveActivityFeed />
            </Card>

            <Card title="Quick actions">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    <Link to="/companies" className="text-brand-600 hover:underline text-sm">+ New Company</Link>
                    <Link to="/send" className="text-brand-600 hover:underline text-sm">+ Send Message</Link>
                    <Link to="/meetings" className="text-brand-600 hover:underline text-sm">+ Schedule Meeting</Link>
                </div>
            </Card>
        </div>
    );
}