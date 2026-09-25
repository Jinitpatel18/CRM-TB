import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    if (!open) return null;
    const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-950/45 dark:bg-black/60 backdrop-blur-[2px] animate-overlay-in" onClick={onClose} />
            <div
                className={`relative bg-white dark:bg-slate-900 w-full ${widths[size]} rounded-t-2xl sm:rounded-2xl shadow-pop dark:shadow-pop-dark border dark:border-slate-800 max-h-[92vh] sm:max-h-[90vh] overflow-auto animate-slide-up sm:animate-pop-in safe-bottom`}
            >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-t-2xl sm:rounded-t-2xl z-10">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight pr-2">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 sm:p-5">{children}</div>
            </div>
        </div>
    );
}
