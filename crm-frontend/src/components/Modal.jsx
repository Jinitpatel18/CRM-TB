import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    if (!open) return null;
    const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/40 animate-overlay-in" onClick={onClose} />
            <div
                className={`relative bg-white w-full ${widths[size]} rounded-t-2xl sm:rounded-xl shadow-xl max-h-[92vh] sm:max-h-[90vh] overflow-auto animate-slide-up sm:animate-fade-in safe-bottom`}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-xl z-10">
                    <h3 className="font-semibold pr-2">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-lg hover:bg-slate-100 active:bg-slate-200"
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
