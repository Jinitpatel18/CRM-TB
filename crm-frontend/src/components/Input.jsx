export default function Input({ label, error, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>}
            <input
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/70 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-soft dark:shadow-soft-dark
          transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-400/20 focus:border-brand-500 dark:focus:border-brand-400
          disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 ${className || ''}`}
                {...props}
            />
            {error && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{error}</span>}
        </label>
    );
}

export function Textarea({ label, error, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>}
            <textarea
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/70 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-soft dark:shadow-soft-dark
          transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-400/20 focus:border-brand-500 dark:focus:border-brand-400
          disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 ${className || ''}`}
                rows={5}
                {...props}
            />
            {error && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{error}</span>}
        </label>
    );
}

export function Select({ label, children, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>}
            <select
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/70 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 shadow-soft dark:shadow-soft-dark
          transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-400/20 focus:border-brand-500 dark:focus:border-brand-400
          disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 ${className || ''}`}
                {...props}
            >
                {children}
            </select>
        </label>
    );
}
