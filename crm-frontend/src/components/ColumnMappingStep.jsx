import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

const FIELD_OPTIONS = [
    { value: '', label: 'Ignore' },
    { value: 'name', label: 'Name (Full)' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Contact Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'role', label: 'Role' },
    { value: 'company', label: 'Company Name' },
    { value: 'company_email', label: 'Company Email' },
];

export default function ColumnMappingStep({
    headers = [],
    sampleRow = {},
    autoMapping = {},
    totalRows = 0,
    onConfirm,
    onBack,
    loading = false,
}) {
    const [mapping, setMapping] = useState({});

    useEffect(() => {
        const initial = {};
        const reverse = {};
        Object.entries(autoMapping).forEach(([field, csvHeader]) => {
            if (csvHeader) reverse[csvHeader] = field;
        });
        headers.forEach((h) => {
            initial[h] = reverse[h] || '';
        });
        setMapping(initial);
    }, [headers, autoMapping]);

    const handleChange = (header, value) => {
        setMapping((prev) => ({ ...prev, [header]: value }));
    };

    const hasNameMapped = () => {
        const values = Object.values(mapping);
        if (values.includes('name')) return true;
        if (values.includes('first_name') && values.includes('last_name')) return true;
        return false;
    };

    const hasDuplicates = () => {
        const used = Object.values(mapping).filter((v) => v);
        return used.length !== new Set(used).size;
    };

    const handleContinue = () => {
        if (!hasNameMapped()) return;
        const reverse = {};
        Object.entries(mapping).forEach(([csvHeader, field]) => {
            if (field) reverse[field] = csvHeader;
        });
        onConfirm(reverse);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
                <div className="flex items-center gap-3 text-sm">
                    <Badge tone="Active">{totalRows} rows</Badge>
                    <span className="text-slate-600 dark:text-slate-300">{headers.length} columns detected</span>
                </div>
            </div>

            {!hasNameMapped() && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-lg p-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>
                        <strong>Name is required.</strong> Map either "Name" OR both "First Name" + "Last Name".
                    </span>
                </div>
            )}
            {hasDuplicates() && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>
                        <strong>Duplicate mapping detected.</strong> Two columns are mapped to same field.
                    </span>
                </div>
            )}

            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60">
                        <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                            <th className="px-4 py-2.5">CSV Column</th>
                            <th className="px-4 py-2.5">Sample Value</th>
                            <th className="px-4 py-2.5">Maps To</th>
                        </tr>
                    </thead>
                    <tbody>
                        {headers.map((header) => (
                            <tr key={header} className="border-t border-slate-100 dark:border-slate-800">
                                <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{header}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs font-mono">
                                    {sampleRow[header] != null && sampleRow[header] !== ''
                                        ? String(sampleRow[header]).slice(0, 40)
                                        : '—'}
                                </td>
                                <td className="px-4 py-2.5">
                                    <select
                                        value={mapping[header] || ''}
                                        onChange={(e) => handleChange(header, e.target.value)}
                                        className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 bg-white dark:bg-slate-800 ${mapping[header]
                                                ? 'border-brand-300 bg-brand-50/50 text-slate-800 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200'
                                                : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                                            }`}
                                    >
                                        {FIELD_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles size={12} className="text-brand-500 dark:text-brand-400" />
                <span>We auto-detected the mapping. Verify it and adjust if needed.</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <Button
                    onClick={handleContinue}
                    disabled={loading || !hasNameMapped()}
                >
                    {loading ? (
                        'Processing…'
                    ) : (
                        <>
                            Continue <ArrowRight size={14} className="ml-1" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}