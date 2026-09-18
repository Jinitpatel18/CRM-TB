export default function Input({ label, error, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
            <input
                className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          disabled:bg-slate-50 ${className || ''}`}
                {...props}
            />
            {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
        </label>
    );
}

export function Textarea({ label, error, className, ...props }) {
    return (
        <label className="block">
            {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
            <textarea
                className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          ${className || ''}`}
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
            {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
            <select
                className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 ${className || ''}`}
                {...props}
            >
                {children}
            </select>
        </label>
    );
}