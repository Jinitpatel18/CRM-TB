import { useState } from 'react';
import { useAuditLogs, useAuditStats } from '../hooks/useAuditLog';
import { useUsers } from '../hooks/useUsers';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Table from '../components/Table';
import Input, { Select } from '../components/Input';

const actionTone = {
    create: 'Active',
    update: 'Prospect',
    send: 'Sent',
    bulk_send: 'Sent',
    schedule: 'Prospect',
};

export default function AuditLog() {
    const [filters, setFilters] = useState({
        user_id: '',
        action: '',
        entity_type: '',
        from: '',
        to: '',
    });

    const { data: logs = [], isLoading } = useAuditLogs(filters);
    const { data: stats } = useAuditStats();
    const { data: users = [] } = useUsers();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Log</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Every action across the CRM, who did it, and when
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Actions</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{stats?.total ?? '—'}</div>
                </Card>
                <Card>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Active Users</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{stats?.active_users ?? '—'}</div>
                </Card>
                <Card>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Last 24h</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{stats?.last_24h ?? '—'}</div>
                </Card>
                <Card>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{stats?.last_7d ?? '—'}</div>
                </Card>
            </div>

            {/* Filters */}
            <Card title="Filters">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Select
                        label="User"
                        value={filters.user_id}
                        onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                    >
                        <option value="">All users</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.email}
                            </option>
                        ))}
                    </Select>

                    <Select
                        label="Action"
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    >
                        <option value="">All actions</option>
                        <option value="create">create</option>
                        <option value="update">update</option>
                        <option value="delete">delete</option>
                        <option value="send">send</option>
                        <option value="bulk_send">bulk_send</option>
                        <option value="schedule">schedule</option>
                    </Select>

                    <Select
                        label="Entity"
                        value={filters.entity_type}
                        onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                    >
                        <option value="">All entities</option>
                        <option value="company">company</option>
                        <option value="contact">contact</option>
                        <option value="template">template</option>
                        <option value="activity">activity</option>
                        <option value="meeting">meeting</option>
                        <option value="user_role">user_role</option>
                        <option value="user_status">user_status</option>
                    </Select>

                    <Input
                        label="From"
                        type="datetime-local"
                        value={filters.from}
                        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    />

                    <Input
                        label="To"
                        type="datetime-local"
                        value={filters.to}
                        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    />
                </div>

                <button
                    onClick={() => setFilters({ user_id: '', action: '', entity_type: '', from: '', to: '' })}
                    className="mt-3 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                    Clear filters
                </button>
            </Card>

            {/* Logs */}
            <Card>
                {isLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
                ) : (
                    <Table
                        data={logs}
                        empty="No activity found"
                        rowKey="id"
                        columns={[
                            {
                                key: 'created_at',
                                label: 'Time',
                                render: (r) => (
                                    <div className="text-xs">
                                        <div className="text-slate-700 dark:text-slate-200">{new Date(r.created_at).toLocaleDateString()}</div>
                                        <div className="text-slate-400 dark:text-slate-500">
                                            {new Date(r.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'user_email',
                                label: 'User',
                                render: (r) => (
                                    <div>
                                        <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{r.user_email || 'System'}</div>
                                        {r.user_role && (
                                            <div className="text-xs text-slate-400 dark:text-slate-500">{r.user_role}</div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'action',
                                label: 'Action',
                                render: (r) => <Badge tone={actionTone[r.action]}>{r.action}</Badge>,
                            },
                            {
                                key: 'entity_type',
                                label: 'Entity',
                                render: (r) => (
                                    <span className="text-sm text-slate-700 dark:text-slate-200">
                                        {r.entity_type}
                                        {r.entity_id ? <span className="text-slate-400 dark:text-slate-500"> #{r.entity_id}</span> : ''}
                                    </span>
                                ),
                            },
                            {
                                key: 'ip_address',
                                label: 'IP',
                                render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{r.ip_address || '—'}</span>,
                            },
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
