export default function Card({ title, action, children, className }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className || ''}`}>
            {(title || action) && (
                <div className="flex items-center justify-between flex-wrap gap-2 px-4 sm:px-5 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    {action}
                </div>
            )}
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}
