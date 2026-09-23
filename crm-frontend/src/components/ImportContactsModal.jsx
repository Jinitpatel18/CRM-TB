import { useState, useRef } from 'react';
import { Upload, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { api } from '../lib/api';

export default function ImportContactsModal({ open, onClose, companyId, onSuccess }) {
    const [step, setStep] = useState('upload');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [rows, setRows] = useState([]);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [result, setResult] = useState(null);
    const inputRef = useRef(null);

    const reset = () => {
        setStep('upload');
        setFile(null);
        setPreview(null);
        setRows([]);
        setResult(null);
        setLoading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFile = (f) => {
        if (!f) return;
        const ext = f.name.toLowerCase();
        const valid =
            ext.endsWith('.csv') ||
            ext.endsWith('.xlsx') ||
            ext.endsWith('.xls') ||
            ext.endsWith('.pdf');
        if (!valid) return toast.error('Only CSV, Excel, or PDF allowed');
        if (f.size > 10 * 1024 * 1024) return toast.error('File must be under 10 MB');
        setFile(f);
    };

    const handleParse = async () => {
        if (!file) return;
        setParsing(true);
        try {
            const data = await api.importPreview(companyId, file);
            setPreview(data);
            setRows(
                data.contacts.map((c) => ({
                    ...c,
                    selected: !c.duplicate,
                }))
            );
            setStep('preview');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setParsing(false);
        }
    };

    const updateRow = (tempId, field, value) => {
        setRows((prev) =>
            prev.map((r) => (r._tempId === tempId ? { ...r, [field]: value } : r))
        );
    };

    const toggleRow = (tempId) => {
        setRows((prev) =>
            prev.map((r) => (r._tempId === tempId ? { ...r, selected: !r.selected } : r))
        );
    };

    const toggleAll = (checked) => {
        setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
    };

    const handleImport = async () => {
        const selected = rows.filter(
            (r) => r.selected && r.name && (r.email || r.phone)
        );
        if (selected.length === 0) return toast.error('Select at least one valid contact');

        setLoading(true);
        try {
            const data = await api.importConfirm(
                companyId,
                selected.map(({ selected, _tempId, duplicate, ...c }) => c),
                skipDuplicates
            );
            setResult(data);
            setStep('result');
            onSuccess?.();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedCount = rows.filter(
        (r) => r.selected && r.name && (r.email || r.phone)
    ).length;

    return (
        <Modal open={open} onClose={handleClose} title="Import Contacts" size="xl">
            {/* Stepper */}
            <div className="flex items-center gap-2 mb-6 text-xs">
                {['upload', 'preview', 'result'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-medium ${step === s
                                    ? 'bg-brand-600 text-white'
                                    : ['upload', 'preview', 'result'].indexOf(step) > i
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-400'
                                }`}
                        >
                            {['upload', 'preview', 'result'].indexOf(step) > i ? '✓' : i + 1}
                        </div>
                        <span
                            className={
                                step === s ? 'font-medium text-slate-800' : 'text-slate-500 capitalize'
                            }
                        >
                            {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview & Edit' : 'Done'}
                        </span>
                        {i < 2 && <div className="w-8 h-px bg-slate-200" />}
                    </div>
                ))}
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
                <div className="space-y-4">
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            handleFile(e.dataTransfer.files[0]);
                        }}
                        className="border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-slate-50 rounded-xl p-8 text-center cursor-pointer transition"
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,.pdf"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files[0])}
                        />
                        <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                        <p className="text-sm font-medium text-slate-700">
                            {file ? file.name : 'Drop file or click to upload'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">CSV, Excel, or PDF · Max 10 MB</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                        <p className="font-medium">📌 Column names should include:</p>
                        <p>
                            <strong>Name</strong> (required), Email, Phone, Role, Company
                        </p>
                        <p className="text-blue-600">
                            We auto-detect columns — column order doesn't matter.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t">
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleParse} disabled={!file || parsing}>
                            {parsing ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-1" /> Parsing…
                                </>
                            ) : (
                                'Parse File'
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 2: PREVIEW */}
            {step === 'preview' && preview && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-lg p-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <div>
                                <span className="text-slate-500">Total:</span>{' '}
                                <span className="font-semibold">{preview.total}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Valid:</span>{' '}
                                <span className="font-semibold text-green-600">{preview.valid_count}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Duplicates:</span>{' '}
                                <span className="font-semibold text-amber-600">
                                    {preview.contacts.filter((c) => c.duplicate).length}
                                </span>
                            </div>
                        </div>
                        <Badge tone="Active">{preview.source}</Badge>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="text-left text-xs text-slate-500">
                                    <th className="px-3 py-2 w-10">
                                        <input
                                            type="checkbox"
                                            checked={rows.length > 0 && rows.every((r) => r.selected)}
                                            onChange={(e) => toggleAll(e.target.checked)}
                                        />
                                    </th>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Phone</th>
                                    <th className="px-3 py-2">Role</th>
                                    <th className="px-3 py-2 w-20">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const invalid = !r.name || (!r.email && !r.phone);
                                    return (
                                        <tr
                                            key={r._tempId}
                                            className={`border-b border-slate-100 ${invalid ? 'bg-red-50/50' : r.duplicate ? 'bg-amber-50/50' : ''
                                                }`}
                                        >
                                            <td className="px-3 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={r.selected}
                                                    disabled={invalid}
                                                    onChange={() => toggleRow(r._tempId)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    value={r.name || ''}
                                                    onChange={(e) => updateRow(r._tempId, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    value={r.email || ''}
                                                    onChange={(e) => updateRow(r._tempId, 'email', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    value={r.phone || ''}
                                                    onChange={(e) => updateRow(r._tempId, 'phone', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    value={r.role || ''}
                                                    onChange={(e) => updateRow(r._tempId, 'role', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-xs">
                                                {invalid ? (
                                                    <span className="text-red-600">Invalid</span>
                                                ) : r.duplicate ? (
                                                    <span className="text-amber-600">Duplicate</span>
                                                ) : (
                                                    <span className="text-green-600">Ready</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={skipDuplicates}
                            onChange={(e) => setSkipDuplicates(e.target.checked)}
                        />
                        Skip duplicate contacts (matching email or phone)
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
                        <button
                            onClick={() => setStep('upload')}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            ← Back
                        </button>
                        <div className="flex flex-col-reverse sm:flex-row gap-2">
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleImport} disabled={loading || selectedCount === 0}>
                                {loading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin mr-1" /> Importing…
                                    </>
                                ) : (
                                    <>
                                        Import {selectedCount} contact{selectedCount !== 1 ? 's' : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: RESULT */}
            {step === 'result' && result && (
                <div className="space-y-4 text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check size={32} className="text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Import Complete</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            <span className="font-medium text-green-600">{result.imported}</span> contacts
                            imported
                            {result.skipped > 0 && (
                                <>
                                    {' · '}
                                    <span className="font-medium text-amber-600">{result.skipped}</span> skipped
                                    (duplicates)
                                </>
                            )}
                        </p>
                    </div>
                    <Button onClick={handleClose}>Done</Button>
                </div>
            )}
        </Modal>
    );
}