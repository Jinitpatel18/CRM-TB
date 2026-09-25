import clsx from 'clsx';

const colors = {
    Active: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-400/25',
    Inactive: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/25',
    Churned: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-400/25',
    Prospect: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-400/25',
    Sent: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-400/25',
    Pending: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-400/25',
    Failed: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-400/25',
    Delivered: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-400/25',
    Read: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-400/25',
};

export default function Badge({ children, tone }) {
    return (
        <span className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            colors[tone || children] || 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/25'
        )}>
            {children}
        </span>
    );
}
