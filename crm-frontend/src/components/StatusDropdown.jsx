import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const STATUSES = [
    { value: 'Active', dot: 'bg-green-500', pill: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-400/25' },
    { value: 'Inactive', dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/25' },
    { value: 'Churned', dot: 'bg-red-500', pill: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-400/25' },
    { value: 'Prospect', dot: 'bg-blue-500', pill: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-400/25' },
];

export default function StatusDropdown({ value, onChange, disabled, size = 'md' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const current = STATUSES.find((s) => s.value === value) || STATUSES[0];
    const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${current.pill} ${sizeClass} ${disabled ? 'opacity-60 cursor-default' : 'hover:opacity-90 hover:shadow-soft cursor-pointer'
                    }`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
                {value}
                {!disabled && <ChevronDown size={12} className="opacity-60" />}
            </button>

            {open && (
                <div
                    className="absolute z-30 mt-1.5 left-0 min-w-[140px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-pop dark:shadow-pop-dark py-1 animate-scale-in origin-top-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    {STATUSES.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => {
                                if (s.value !== value) onChange?.(s.value);
                                setOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition ${s.value === value
                                    ? 'bg-brand-50 dark:bg-brand-500/15 font-medium text-brand-700 dark:text-brand-300'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            {s.value}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export { STATUSES };
