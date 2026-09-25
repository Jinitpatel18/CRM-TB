export default function Card({ title, action, children, className }) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-soft dark:shadow-soft-dark transition-shadow hover:shadow-lift/60 dark:hover:shadow-lift-dark/60 ${className || ''}`}>
            {(title || action) && (
                <div className="flex items-center justify-between flex-wrap gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
                    {action}
                </div>
            )}
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}
