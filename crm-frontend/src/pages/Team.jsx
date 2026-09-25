import { useState } from 'react';
import { Crown, Briefcase, Eye, UserX, UserPlus, Trash2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input, { Select } from '../components/Input';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useOrg } from '../lib/OrgContext';

const roleConfig = {
    admin: { label: 'Admin', icon: Crown, badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300', avatar: 'bg-purple-500' },
    sales: { label: 'Sales', icon: Briefcase, badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', avatar: 'bg-blue-500' },
    viewer: { label: 'Viewer', icon: Eye, badge: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300', avatar: 'bg-slate-500' },
};

const getInitials = (email) => {
    if (!email) return '?';
    return email.split('@')[0].split(/[._-]/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
};

// ============ Members Hooks ============
const useMembers = () =>
    useQuery({ queryKey: ['org-members'], queryFn: api.listOrgMembers });

const useUpdateMemberRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }) => api.updateOrgMemberRole(id, role),
        onSuccess: () => {
            toast.success('Role updated');
            qc.invalidateQueries({ queryKey: ['org-members'] });
        },
        onError: (err) => toast.error(err.message),
    });
};

const useRemoveMember = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.removeOrgMember(id),
        onSuccess: () => {
            toast.success('Member removed');
            qc.invalidateQueries({ queryKey: ['org-members'] });
        },
        onError: (err) => toast.error(err.message),
    });
};

// ============ Invitations Hooks ============
const useInvitations = () =>
    useQuery({ queryKey: ['invitations'], queryFn: api.listInvitations });

const useCreateInvitation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body) => api.createInvitation(body),
        onSuccess: () => {
            toast.success('Invitation created!');
            qc.invalidateQueries({ queryKey: ['invitations'] });
        },
        onError: (err) => toast.error(err.message),
    });
};

const useRevokeInvitation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.revokeInvitation(id),
        onSuccess: () => {
            toast.success('Invitation revoked');
            qc.invalidateQueries({ queryKey: ['invitations'] });
        },
        onError: (err) => toast.error(err.message),
    });
};

// ============ Role Change Modal ============
function RoleModal({ user, open, onClose, onChange, currentUserId }) {
    const [selected, setSelected] = useState(user?.role);

    const options = [
        { value: 'admin', label: 'Admin', desc: 'Full access. Manage team, audit logs, roles.', icon: Crown },
        { value: 'sales', label: 'Sales', desc: 'Create companies, contacts, send messages.', icon: Briefcase },
        { value: 'viewer', label: 'Viewer', desc: 'Read-only access. Cannot modify anything.', icon: Eye },
    ];

    return (
        <Modal open={open} onClose={onClose} title="Change Role">
            {user && (
                <div className="space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${roleConfig[user.role]?.avatar || 'bg-slate-500'}`}>
                            {getInitials(user.email)}
                        </div>
                        <div>
                            <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{user.email}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Currently: {roleConfig[user.role]?.label}</div>
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
                                    disabled={user.user_id === currentUserId}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition ${isSelected
                                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:border-brand-400 dark:bg-brand-500/10 dark:ring-brand-400'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }`}
                                >
                                    <Icon size={18} className={isSelected ? 'text-brand-600 dark:text-brand-400 mt-0.5' : 'text-slate-400 mt-0.5'} />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{opt.label}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
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

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
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

// ============ Main Page ============
export default function Team() {
    const { user } = useAuth();
    const { activeOrg } = useOrg();
    const { data: members = [], isLoading: membersLoading } = useMembers();
    const { data: invitations = [], isLoading: invitesLoading } = useInvitations();
    const updateRole = useUpdateMemberRole();
    const removeMember = useRemoveMember();
    const createInvite = useCreateInvitation();
    const revokeInvite = useRevokeInvitation();

    const [roleModal, setRoleModal] = useState(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'sales' });

    const handleRoleChange = (member, role) => {
        updateRole.mutate({ id: member.member_id, role });
    };

    const handleRemove = (member) => {
        if (!confirm(`Remove ${member.email} from this organization?`)) return;
        removeMember.mutate(member.member_id);
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        try {
            await createInvite.mutateAsync(inviteForm);
            setInviteOpen(false);
            setInviteForm({ email: '', role: 'sales' });
        } catch (err) { /* handled in hook */ }
    };

    const copyInviteLink = (token) => {
        const link = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(link);
        toast.success('Invite link copied!');
    };

    const stats = {
        total: members.length,
        admins: members.filter((m) => m.role === 'admin').length,
        sales: members.filter((m) => m.role === 'sales').length,
        viewers: members.filter((m) => m.role === 'viewer').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activeOrg?.name} · {stats.total} members
                    </p>
                </div>
                <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus size={14} className="mr-1.5" /> Invite Member
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Members</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{stats.total}</div>
                </Card>
                <Card>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Admins</div>
                    <div className="text-2xl font-semibold mt-1 text-purple-700 dark:text-purple-300">{stats.admins}</div>
                </Card>
                <Card>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Sales</div>
                    <div className="text-2xl font-semibold mt-1 text-blue-700 dark:text-blue-300">{stats.sales}</div>
                </Card>
                <Card>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Viewers</div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">{stats.viewers}</div>
                </Card>
            </div>

            {/* Members */}
            <Card title="Members">
                {membersLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-5 -mb-5">
                        {members.map((m) => {
                            const cfg = roleConfig[m.role] || roleConfig.viewer;
                            const isMe = m.user_id === user?.id;
                            return (
                                <div key={m.member_id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${cfg.avatar}`}>
                                        {getInitials(m.email)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{m.email}</span>
                                            {isMe && <span className="text-[10px] uppercase tracking-wide font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">You</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {m.full_name || 'No name'}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isMe ? (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                                                <cfg.icon size={12} /> {cfg.label}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setRoleModal(m)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition hover:ring-2 hover:ring-brand-200 dark:hover:ring-brand-500/40 ${cfg.badge}`}
                                            >
                                                <cfg.icon size={12} /> {cfg.label} ▾
                                            </button>
                                        )}
                                    </div>
                                    <div className="shrink-0 w-24 text-right">
                                        {!isMe && (
                                            <button
                                                onClick={() => handleRemove(m)}
                                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            >
                                                <UserX size={12} /> Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Invitations */}
            <Card title={`Pending Invitations (${invitations.length})`}>
                {invitesLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
                ) : invitations.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">No pending invitations.</p>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-5 -mb-5">
                        {invitations.map((inv) => {
                            const cfg = roleConfig[inv.role] || roleConfig.viewer;
                            const expired = new Date(inv.expires_at) < new Date();
                            return (
                                <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <Mail size={14} className="text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{inv.email}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {inv.accepted_at ? (
                                                <span className="text-green-600 dark:text-green-400">Accepted</span>
                                            ) : expired ? (
                                                <span className="text-red-500 dark:text-red-400">Expired</span>
                                            ) : (
                                                <span>Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                                        {cfg.label}
                                    </span>
                                    {!inv.accepted_at && !expired && (
                                        <>
                                            <button
                                                onClick={() => copyInviteLink(inv.token)}
                                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                                            >
                                                Copy link
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Revoke this invitation?')) revokeInvite.mutate(inv.id);
                                                }}
                                                className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Invite Modal */}
            <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member">
                <form onSubmit={handleSendInvite} className="space-y-4">
                    <Input
                        label="Email *"
                        type="email"
                        required
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                    <Select
                        label="Role"
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                        <option value="sales">Sales — Create companies, contacts, send messages</option>
                        <option value="viewer">Viewer — Read-only access</option>
                        <option value="admin">Admin — Full access + manage team</option>
                    </Select>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createInvite.isPending}>
                            {createInvite.isPending ? 'Sending…' : 'Send Invitation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Role Change Modal */}
            <RoleModal
                user={roleModal}
                open={!!roleModal}
                onClose={() => setRoleModal(null)}
                onChange={handleRoleChange}
                currentUserId={user?.id}
            />
        </div>
    );
}
