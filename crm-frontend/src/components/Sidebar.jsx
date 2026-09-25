import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Building2, MailPlus, Send, Calendar,
    FileText, ListChecks, Settings as SettingsIcon,
    LogOut, User, Users, ScrollText, BarChart3
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';
import OrgSwitcher from './OrgSwitcher';
import ThemeToggle from './ThemeToggle';

const baseItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/templates', label: 'Templates', icon: FileText },
    { to: '/send', label: 'Send Message', icon: MailPlus },
    { to: '/bulk-send', label: 'Bulk Send', icon: Send },
    { to: '/meetings', label: 'Meetings', icon: Calendar },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/queue', label: 'Queue', icon: ListChecks },
];

const adminItems = [
    { to: '/team', label: 'Team', icon: Users },
    { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
];

const linkClass = ({ isActive }) =>
    clsx(
        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
        isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    );

export default function Sidebar({ onNavigate, className }) {
    const { user, profile, isAdmin, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        toast.success('Logged out');
    };

    return (
        <aside className={clsx(
            'w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full',
            className
        )}>
            {/* Logo + theme toggle */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
                <img src="./logo.svg" alt="CRM" className="h-8 dark:hidden" />
                <img src="./logo-white.svg" alt="CRM" className="h-8 hidden dark:block" />
                <ThemeToggle />
            </div>

            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <OrgSwitcher />
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {baseItems.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={onNavigate}
                        className={linkClass}
                    >
                        <Icon size={18} className={clsx(
                            'shrink-0 transition-colors',
                            'group-hover:scale-105'
                        )} />
                        {label}
                    </NavLink>
                ))}

                {/* Admin only section */}
                {isAdmin && (
                    <>
                        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Admin
                        </div>
                        {adminItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={onNavigate}
                                className={linkClass}
                            >
                                <Icon size={18} className="shrink-0" />
                                {label}
                            </NavLink>
                        ))}
                    </>
                )}

                <div className="pt-4 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Account
                </div>
                <NavLink to="/settings" onClick={onNavigate} className={linkClass}>
                    <SettingsIcon size={18} className="shrink-0" /> Settings
                </NavLink>
            </nav>

            {/* User footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 safe-bottom shrink-0">
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shrink-0 shadow-soft">
                        <User size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold capitalize">
                            {profile?.role || 'User'}
                        </p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={user?.email}>
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </aside>
    );
}
