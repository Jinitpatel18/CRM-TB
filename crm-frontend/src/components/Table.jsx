import { ChevronRight } from 'lucide-react';

export default function Table({ columns, data, empty = 'No data', rowKey = 'id', onRowClick }) {
    const clickable = !!onRowClick;

    return (
        <div>
            {/* ── Mobile: card list ── */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {data?.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">{empty}</p>
                )}
                {data?.map((row) => {
                    const title = columns[0];
                    const rest = columns.slice(1);
                    return (
                        <div
                            key={row[rowKey]}
                            onClick={() => onRowClick?.(row)}
                            className={`py-3 transition-colors ${clickable ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60' : ''}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-slate-800 dark:text-slate-100 break-words">
                                        {title.render ? title.render(row) : row[title.key]}
                                    </div>
                                </div>
                                {clickable && (
                                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                            {rest.length > 0 && (
                                <dl className="mt-2 space-y-1">
                                    {rest.map((c) => (
                                        <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                                            <dt className="text-slate-400 dark:text-slate-500 text-xs pt-0.5 shrink-0">{c.label}</dt>
                                            <dd className="text-right min-w-0 break-words">
                                                {c.render ? c.render(row) : row[c.key] ?? '—'}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Desktop: table ── */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
                            {columns.map((c) => (
                                <th key={c.key} className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data?.length === 0 && (
                            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">{empty}</td></tr>
                        )}
                        {data?.map((row) => (
                            <tr
                                key={row[rowKey]}
                                onClick={() => onRowClick?.(row)}
                                className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-500/10 ${clickable ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((c) => (
                                    <td key={c.key} className="px-4 py-2.5">
                                        {c.render ? c.render(row) : row[c.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
