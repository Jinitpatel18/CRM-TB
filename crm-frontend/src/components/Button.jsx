import clsx from 'clsx';

export default function Button({
    children, variant = 'primary', size = 'md', className, ...props
}) {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none';
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5' };
    const variants = {
        primary: 'bg-brand-600 text-white shadow-soft hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 hover:shadow-lift dark:shadow-soft-dark dark:hover:shadow-lift-dark',
        secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-soft dark:shadow-soft-dark hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600',
        danger: 'bg-red-600 text-white shadow-soft dark:shadow-soft-dark hover:bg-red-700 hover:shadow-lift dark:hover:shadow-lift-dark',
        ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    };
    return (
        <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>
            {children}
        </button>
    );
}
