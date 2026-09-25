import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, MailPlus, Calendar, Mail, MessageSquare, Database } from 'lucide-react';
import { api } from '../lib/api';
import { useOrg } from '../lib/OrgContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LiveActivityFeed from '../components/LiveActivityFeed';

const quickActions = [
    { to: '/companies', icon: Building2, label: 'New Company', hint: 'Add a company', tone: 'bg-brand-50 text-brand-600' },
    { to: '/send', icon: MailPlus, label: 'Send Message', hint: 'Reach a contact', tone: 'bg-blue-50 text-blue-600' },
    { to: '/meetings', icon: Calendar, label: 'Schedule Meeting', hint: 'Book a call', tone: 'bg-purple-50 text-purple-600' },
];

const queueSections = [
    { key: 'emailQueue', label: 'Email Queue', icon: Mail, accent: 'text-blue-600' },
    { key: 'whatsappQueue', label: 'WhatsApp Queue', icon: MessageSquare, accent: 'text-emerald-600' },
];

export default function Dashboard() {
    const { activeOrgId, activeOrg } = useOrg();

    const { data: queue } = useQuery({
        queryKey: ['queue', activeOrgId],
        queryFn: api.queueStatus,
        refetchInterval: 5000,
        enabled: !!activeOrgId,
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    {activeOrg ? `Overview of ${activeOrg.name}` : 'Welcome to your workspace'}
                </p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickActions.map(({ to, icon: Icon, label, hint, tone }) => (
                    <Link
                        key={to}
                        to={to}
                        className="group flex items-center gap-3.5 bg-white rounded-xl border border-slate-200/80 shadow-soft p-4 transition-all duration-200 hover:shadow-lift hover:border-brand-200 hover:-translate-y-0.5"
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${tone}`}>
                            <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800">{label}</div>
                            <div className="text-xs text-slate-400">{hint}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Queue stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {queueSections.map(({ key, label, icon: Icon, accent }) => (
                    <Card key={key} title={label} action={<Icon size={16} className={accent} />}>
                        {Object.keys(queue?.[key] || {}).length === 0 ? (
                            <p className="text-sm text-slate-400 py-1">No jobs in queue.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(queue?.[key] || {}).map(([k, v]) => (
                                    <div key={k} className="flex justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                                        <span className="text-slate-500 capitalize">{k}</span>
                                        <span className="font-semibold text-slate-800">{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}

                <Card title="DB Jobs" action={<Database size={16} className="text-slate-400" />}>
                    <div className="space-y-1.5 text-sm">
                        {(queue?.databaseJobs || []).length === 0 && (
                            <p className="text-slate-400 py-1">No jobs yet.</p>
                        )}
                        {(queue?.databaseJobs || []).map((j) => (
                            <div key={j.status} className="flex justify-between items-center bg-slate-50 rounded-lg px-2.5 py-1.5">
                                <Badge>{j.status}</Badge>
                                <span className="font-semibold text-slate-800">{j.count}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">Auto-refreshes every 5s</p>
                </Card>
            </div>

            {/* ⬇️ Pass activeOrgId so feed refetches on switch */}
            <Card title="Live Activity Feed">
                <LiveActivityFeed orgId={activeOrgId} />
            </Card>
        </div>
    );
}
