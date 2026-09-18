export default function Table({ columns, data, empty = 'No data', rowKey = 'id', onRowClick }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                        {columns.map((c) => (
                            <th key={c.key} className="px-4 py-2 font-medium">{c.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data?.length === 0 && (
                        <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">{empty}</td></tr>
                    )}
                    {data?.map((row) => (
                        <tr
                            key={row[rowKey]}
                            onClick={() => onRowClick?.(row)}
                            className={`border-b border-slate-100 hover:bg-slate-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                        >
                            {columns.map((c) => (
                                <td key={c.key} className="px-4 py-2">
                                    {c.render ? c.render(row) : row[c.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}