import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Building2, MailPlus, Send, Calendar,
    FileText, ListChecks, Settings as SettingsIcon,
    LogOut, User, Users, ScrollText, BarChart3
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';

const baseItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/templates', label: 'Templates', icon: FileText },
    { to: '/send', label: 'Send Message', icon: MailPlus },
    { to: '/bulk-send', label: 'Bulk Send', icon: Send },
    { to: '/meetings', label: 'Meetings', icon: Calendar },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },   // ← NAYA
    { to: '/queue', label: 'Queue', icon: ListChecks },
];

const adminItems = [
    { to: '/team', label: 'Team', icon: Users },
    { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
];

export default function Sidebar() {
    const { user, profile, isAdmin, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        toast.success('Logged out');
    };

    return (
        <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
            <div className="h-14 flex items-center px-5 border-b border-slate-100">
                <span className="font-bold text-brand-600 text-lg">CRM</span>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {baseItems.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                            )
                        }
                    >
                        <Icon size={18} /> {label}
                    </NavLink>
                ))}

                {/* Admin only section */}
                {isAdmin && (
                    <>
                        <div className="pt-3 pb-1 px-3 text-xs uppercase tracking-wide text-slate-400">
                            Admin
                        </div>
                        {adminItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                                    )
                                }
                            >
                                <Icon size={18} /> {label}
                            </NavLink>
                        ))}
                    </>
                )}

                <div className="pt-3 pb-1 px-3 text-xs uppercase tracking-wide text-slate-400">
                    Account
                </div>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                            isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                        )
                    }
                >
                    <SettingsIcon size={18} /> Settings
                </NavLink>
            </nav>

            <div className="p-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <User size={14} className="text-brand-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 truncate capitalize">
                            {profile?.role || 'User'}
                        </p>
                        <p className="text-sm font-medium truncate" title={user?.email}>
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </aside>
    );
}