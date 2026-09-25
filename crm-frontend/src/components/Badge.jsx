import clsx from 'clsx';

const colors = {
    Active: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20',
    Inactive: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20',
    Churned: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20',
    Prospect: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    Sent: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    Pending: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    Failed: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20',
    Delivered: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20',
    Read: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
};

export default function Badge({ children, tone }) {
    return (
        <span className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            colors[tone || children] || 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20'
        )}>
            {children}
        </span>
    );
}
