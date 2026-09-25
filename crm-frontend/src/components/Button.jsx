import clsx from 'clsx';

export default function Button({
    children, variant = 'primary', size = 'md', className, ...props
}) {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none';
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5' };
    const variants = {
        primary: 'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-lift',
        secondary: 'bg-white border border-slate-200 text-slate-700 shadow-soft hover:bg-slate-50 hover:border-slate-300',
        danger: 'bg-red-600 text-white shadow-soft hover:bg-red-700 hover:shadow-lift',
        ghost: 'text-slate-600 hover:bg-slate-100',
    };
    return (
        <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>
            {children}
        </button>
    );
}
