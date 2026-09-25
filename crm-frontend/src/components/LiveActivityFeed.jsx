import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import Badge from './Badge';

export default function LiveActivityFeed({ orgId, limit = 10 }) {
    const [liveEvents, setLiveEvents] = useState([]);

    // Initial load — now org-aware
    const { data: initial = [], isLoading } = useQuery({
        queryKey: ['recent-activities', orgId, limit],   // ← orgId in key
        queryFn: () => api.recentActivities(limit),
        enabled: !!orgId,
        refetchInterval: 30000,
    });

    // Realtime — subscribe to activities (all, but filtered client-side by org)
    useEffect(() => {
        if (!orgId) return;

        const channel = supabase
            .channel(`activities-live-${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'activities',
                    filter: `organization_id=eq.${orgId}`,     // ← Realtime filter by org
                },
                (payload) => {
                    setLiveEvents((prev) =>
                        [{ ...payload, _id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, limit)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId, limit]);

    // Reset live events when org switch
    useEffect(() => {
        setLiveEvents([]);
    }, [orgId]);

    // Combine live + initial, dedupe by id
    const combined = [
        ...liveEvents.map((e) => ({ ...(e.new || {}), _live: true, _event: e.eventType })),
        ...initial.filter((i) => !liveEvents.some((e) => (e.new || e.old)?.id === i.id)),
    ].slice(0, limit);

    if (isLoading) {
        return <p className="text-sm text-slate-400 dark:text-slate-500">Loading activities…</p>;
    }

    if (combined.length === 0) {
        return (
            <p className="text-sm text-slate-400 dark:text-slate-500">
                No activities yet. Send an email to see it here.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {combined.map((row, idx) => {
                const isNew = row._event === 'INSERT' || row._live;
                const isUpdate = row._event === 'UPDATE';
                return (
                    <div
                        key={row._id || row.id || idx}
                        className={`flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-2 ${isNew ? 'bg-green-50/40 dark:bg-green-500/10 -mx-2 px-2 rounded' : ''
                            }`}
                    >
                        <div className="truncate flex-1">
                            <span
                                className={`font-medium mr-2 ${isNew ? 'text-green-700 dark:text-green-400' : isUpdate ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {isNew ? '●' : isUpdate ? '↻' : '◦'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                                {row.activity_type} #{row.id}
                                {row.subject ? ` — ${row.subject}` : ''}
                            </span>
                            {row.response_received && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-xs font-medium">
                                    💬 Reply
                                </span>
                            )}
                            {row.sent_by_email && (
                                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                                    by {row.sent_by_name || row.sent_by_email}
                                </span>
                            )}
                        </div>
                        {row.status && <Badge>{row.status}</Badge>}
                    </div>
                );
            })}
        </div>
    );
}
