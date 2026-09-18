import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function Queue() {
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['queue'],
        queryFn: api.queueStatus,
        refetchInterval: 4000,
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Queue Status</h1>
                <button onClick={() => refetch()}
                    className="text-sm text-brand-600 hover:underline">
                    {isFetching ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {isLoading ? <p>Loading…</p> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        ['Email Queue', data?.emailQueue],
                        ['WhatsApp Queue', data?.whatsappQueue],
                    ].map(([title, obj]) => (
                        <Card key={title} title={title}>
                            <div className="space-y-2 text-sm">
                                {Object.entries(obj || {}).map(([k, v]) => (
                                    <div key={k} className="flex justify-between">
                                        <span className="text-slate-500 capitalize">{k}</span>
                                        <span className="font-medium">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                    <Card title="Database Jobs">
                        <div className="space-y-2 text-sm">
                            {(data?.databaseJobs || []).map((j) => (
                                <div key={j.status} className="flex justify-between">
                                    <Badge>{j.status}</Badge>
                                    <span className="font-medium">{j.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}