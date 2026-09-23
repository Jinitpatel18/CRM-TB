import { useState } from 'react';
import { ChevronDown, Shield, UserX, UserCheck, Crown, Eye, Briefcase } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useUsers, useUpdateUserRole, useUpdateUserStatus } from '../hooks/useUsers';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';

// ---- Helpers ----

const getInitials = (email) => {
    if (!email) return '?';
    return email
        .split('@')[0]
        .split(/[._-]/)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const roleConfig = {
    admin: {
        label: 'Admin',
        icon: Crown,
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        avatar: 'bg-purple-500',
        dot: 'bg-purple-500',
    },
    sales: {
        label: 'Sales',
        icon: Briefcase,
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        avatar: 'bg-blue-500',
        dot: 'bg-blue-500',
    },
    viewer: {
        label: 'Viewer',
        icon: Eye,
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        avatar: 'bg-slate-500',
        dot: 'bg-slate-500',
    },
};

// ---- Role Change Modal ----
function RoleModal({ user, open, onClose, onChange, currentUserId }) {
    const [selected, setSelected] = useState(user?.role);

    const options = [
        {
            value: 'admin',
            label: 'Admin',
            desc: 'Full access. Manage team, audit logs, roles.',
            icon: Crown,
        },
        {
            value: 'sales',
            label: 'Sales',
            desc: 'Create companies, contacts, send messages.',
            icon: Briefcase,
        },
        {
            value: 'viewer',
            label: 'Viewer',
            desc: 'Read-only access. Cannot modify anything.',
            icon: Eye,
        },
    ];

    return (
        <Modal open={open} onClose={onClose} title="Change Role">
            {user && (
                <div className="space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${roleConfig[user.role]?.avatar || 'bg-slate-500'
                                }`}
                        >
                            {getInitials(user.email)}
                        </div>
                        <div>
                            <div className="font-medium text-slate-800">{user.email}</div>
                            <div className="text-xs text-slate-500">
                                Currently: {roleConfig[user.role]?.label}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {options.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = selected === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSelected(opt.value)}
                                    disabled={user.id === currentUserId}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition ${isSelected
                                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                                            : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon
                                        size={18}
                                        className={isSelected ? 'text-brand-600 mt-0.5' : 'text-slate-400 mt-0.5'}
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-slate-800">{opt.label}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selected !== user.role) onChange(user, selected);
                                onClose();
                            }}
                            disabled={selected === user.role}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ---- Main Page ----
export default function Team() {
    const { profile: me } = useAuth();
    const { data: users = [], isLoading } = useUsers();
    const updateRole = useUpdateUserRole();
    const updateStatus = useUpdateUserStatus();
    const [roleModal, setRoleModal] = useState(null);

    const handleRole = (user, role) => {
        updateRole.mutate({ id: user.id, role });
    };

    const handleStatus = (user) => {
        const next = user.status === 'active' ? 'inactive' : 'active';
        if (!confirm(`Set ${user.email} to ${next}?`)) return;
        updateStatus.mutate({ id: user.id, status: next });
    };

    const stats = {
        total: users.length,
        admins: users.filter((u) => u.role === 'admin').length,
        sales: users.filter((u) => u.role === 'sales').length,
        viewers: users.filter((u) => u.role === 'viewer').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Team</h1>
                <p className="text-sm text-slate-500">Manage your team members and their access</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Shield size={18} className="text-slate-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold">{stats.total}</div>
                            <div className="text-xs text-slate-500">Total Members</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Crown size={18} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold">{stats.admins}</div>
                            <div className="text-xs text-slate-500">Admins</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Briefcase size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold">{stats.sales}</div>
                            <div className="text-xs text-slate-500">Sales</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Eye size={18} className="text-slate-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-semibold">{stats.viewers}</div>
                            <div className="text-xs text-slate-500">Viewers</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Members list */}
            <Card title="Members">
                {isLoading ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                ) : (
                    <div className="divide-y divide-slate-100 -mx-5 -mb-5">
                        {users.map((u) => {
                            const cfg = roleConfig[u.role] || roleConfig.viewer;
                            const isMe = u.id === me?.id;
                            return (
                                <div
                                    key={u.id}
                                    className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 sm:px-5 py-4 hover:bg-slate-50/60 transition"
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${cfg.avatar}`}
                                    >
                                        {getInitials(u.email)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-[140px]">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-slate-800 truncate">
                                                {u.email}
                                            </span>
                                            {isMe && (
                                                <span className="text-[10px] uppercase tracking-wide font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {u.full_name || 'No name set'}
                                        </div>
                                    </div>

                                    {/* Role Badge (clickable) */}
                                    <div className="shrink-0">
                                        {isMe ? (
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}
                                            >
                                                <cfg.icon size={12} />
                                                {cfg.label}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setRoleModal(u)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition hover:ring-2 hover:ring-offset-1 hover:ring-brand-200 ${cfg.badge}`}
                                            >
                                                <cfg.icon size={12} />
                                                {cfg.label}
                                                <ChevronDown size={12} className="opacity-60" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="shrink-0">
                                        {u.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                Inactive
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 sm:ml-auto text-right">
                                        {!isMe && (
                                            <button
                                                onClick={() => handleStatus(u)}
                                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition ${u.status === 'active'
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                            >
                                                {u.status === 'active' ? (
                                                    <>
                                                        <UserX size={12} /> Deactivate
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck size={12} /> Activate
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Permissions info */}
            <Card title="Role Permissions">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(roleConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const descs = {
                            admin: 'Full access. Manage team, audit logs, roles, and all data.',
                            sales: 'Create companies, contacts, send messages, schedule meetings.',
                            viewer: 'Read-only access. Can view data but cannot modify anything.',
                        };
                        const perms = {
                            admin: ['Team management', 'Audit logs', 'All data access', 'Role changes'],
                            sales: ['Companies & contacts', 'Send messages', 'Schedule meetings'],
                            viewer: ['View all data'],
                        };
                        return (
                            <div key={key} className="p-4 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.badge}`}
                                    >
                                        <Icon size={14} />
                                    </div>
                                    <span className="font-medium text-sm">{cfg.label}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">{descs[key]}</p>
                                <ul className="space-y-1">
                                    {perms[key].map((p) => (
                                        <li key={p} className="text-xs text-slate-600 flex items-center gap-1.5">
                                            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Role Change Modal */}
            <RoleModal
                user={roleModal}
                open={!!roleModal}
                onClose={() => setRoleModal(null)}
                onChange={handleRole}
                currentUserId={me?.id}
            />
        </div>
    );
}