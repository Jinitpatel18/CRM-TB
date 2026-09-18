import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    if (!open) return null;
    const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className={`relative bg-white rounded-xl shadow-xl w-full ${widths[size]} max-h-[90vh] overflow-auto`}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 sticky top-0 bg-white">
                    <h3 className="font-semibold">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}