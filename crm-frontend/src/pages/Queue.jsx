import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Mail, MessageSquare, Database } from 'lucide-react';
import { api } from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function Queue() {
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['queue'],
        queryFn: api.queueStatus,
        refetchInterval: 4000,
    });

    const sections = [
        { title: 'Email Queue', obj: data?.emailQueue, icon: Mail, accent: 'text-blue-600 dark:text-blue-400' },
        { title: 'WhatsApp Queue', obj: data?.whatsappQueue, icon: MessageSquare, accent: 'text-emerald-600 dark:text-emerald-400' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Queue Status</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Live view of outgoing messages & jobs · auto-refreshes every 4s</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/15 dark:hover:bg-brand-500/25 px-3 py-1.5 rounded-lg transition shrink-0"
                >
                    <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                    {isFetching ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {isLoading ? (
                <Card><p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sections.map(({ title, obj, icon: Icon, accent }) => (
                        <Card key={title} title={title} action={<Icon size={16} className={accent} />}>
                            {Object.keys(obj || {}).length === 0 ? (
                                <p className="text-sm text-slate-400 dark:text-slate-500 py-1">No jobs in queue.</p>
                            ) : (
                                <div className="space-y-1.5 text-sm">
                                    {Object.entries(obj || {}).map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 rounded-lg px-2.5 py-1.5">
                                            <span className="text-slate-500 dark:text-slate-400 capitalize">{k}</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                    <Card title="Database Jobs" action={<Database size={16} className="text-slate-400 dark:text-slate-500" />}>
                        <div className="space-y-1.5 text-sm">
                            {(data?.databaseJobs || []).length === 0 && (
                                <p className="text-slate-400 dark:text-slate-500 py-1">No jobs yet.</p>
                            )}
                            {(data?.databaseJobs || []).map((j) => (
                                <div key={j.status} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 rounded-lg px-2.5 py-1.5">
                                    <Badge>{j.status}</Badge>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{j.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
