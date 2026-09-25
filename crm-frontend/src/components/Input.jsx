export default function Input({ label, error, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>}
            <input
                className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-soft
          transition-all duration-150 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500
          disabled:bg-slate-50 disabled:text-slate-400 ${className || ''}`}
                {...props}
            />
            {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
        </label>
    );
}

export function Textarea({ label, error, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>}
            <textarea
                className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-soft
          transition-all duration-150 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500
          disabled:bg-slate-50 disabled:text-slate-400 ${className || ''}`}
                rows={5}
                {...props}
            />
            {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
        </label>
    );
}

export function Select({ label, children, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>}
            <select
                className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-soft
          transition-all duration-150 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500
          disabled:bg-slate-50 disabled:text-slate-400 ${className || ''}`}
                {...props}
            >
                {children}
            </select>
        </label>
    );
}
