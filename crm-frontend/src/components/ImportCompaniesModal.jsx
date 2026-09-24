import { useState, useRef } from 'react';
import { Upload, Check, Loader2, Building2, Plus, Merge } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { api } from '../lib/api';
import ColumnMappingStep from './ColumnMappingStep';

export default function ImportCompaniesModal({ open, onClose, onSuccess }) {
    const [step, setStep] = useState('upload');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [rows, setRows] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [result, setResult] = useState(null);
    const inputRef = useRef(null);
    const [columnMapping, setColumnMapping] = useState(null);

    const reset = () => {
        setStep('upload');
        setFile(null);
        setPreview(null);
        setRows([]);
        setCompanies([]);
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
        const valid = ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls');
        if (!valid) return toast.error('Only CSV or Excel allowed');
        if (f.size > 10 * 1024 * 1024) return toast.error('File must be under 10 MB');
        setFile(f);
    };

    const handleParse = async () => {
        if (!file) return;
        setParsing(true);
        try {
            const detection = await api.detectColumns(file);
            setPreview(detection);
            setColumnMapping(detection.autoMapping || {});
            setStep('map-columns');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setParsing(false);
        }
    };

    const handleMappingConfirm = async (mapping) => {
        setColumnMapping(mapping);
        setParsing(true);
        try {
            // Single company:
            const data = await api.importPreview(companyId, file, mapping);
            // OR multi company:
            // const data = await api.importPreview(null, file, mapping);

            setPreview(data);
            setRows(data.contacts.map((c) => ({ ...c, selected: !c.duplicate })));
            if (data.companies) setCompanies(data.companies);
            setStep('preview');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setParsing(false);
        }
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
        const selected = rows.filter((r) => r.selected && r.name && (r.email || r.phone));
        if (selected.length === 0) return toast.error('Select at least one valid contact');

        setLoading(true);
        try {
            const data = await api.importConfirm(
                null,   // ← null = multi mode
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

    const selectedCount = rows.filter((r) => r.selected && r.name && (r.email || r.phone)).length;
    const newCompanies = companies.filter((c) => !c.existing);
    const existingCompanies = companies.filter((c) => c.existing);

    return (
        <Modal open={open} onClose={handleClose} title="Import Companies + Contacts" size="xl">
            {/* Stepper */}
            <div className="flex items-center gap-2 mb-6 text-xs">
                {['upload', 'map-columns', 'preview', 'result'].map((s, i) => {
                    const stepIndex = ['upload', 'map-columns', 'preview', 'result'].indexOf(step);
                    const labels = {
                        upload: 'Upload',
                        'map-columns': 'Map Columns',
                        preview: 'Preview',
                        result: 'Done',
                    };
                    return (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-medium ${step === s ? 'bg-brand-600 text-white'
                                : stepIndex > i ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                {stepIndex > i ? '✓' : i + 1}
                            </div>
                            <span className={step === s ? 'font-medium text-slate-800' : 'text-slate-500'}>
                                {labels[s]}
                            </span>
                            {i < 3 && <div className="w-8 h-px bg-slate-200" />}
                        </div>
                    );
                })}
            </div>

            {/* STEP 1 */}
            {step === 'upload' && (
                <div className="space-y-4">
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                        className="border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-slate-50 rounded-xl p-8 text-center cursor-pointer transition"
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files[0])}
                        />
                        <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                        <p className="text-sm font-medium text-slate-700">
                            {file ? file.name : 'Drop file or click to upload'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">CSV or Excel · Max 10 MB</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                        <p className="font-medium">📌 CSV must include:</p>
                        <p><strong>Company</strong>, <strong>Name</strong> (required), Email, Phone, Role</p>
                        <p className="text-blue-600">Same company name = same company (case-insensitive).</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleParse} disabled={!file || parsing}>
                            {parsing ? <><Loader2 size={14} className="animate-spin mr-1" /> Parsing…</> : 'Parse File'}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'map-columns' && preview && (
                <ColumnMappingStep
                    headers={preview.headers || []}
                    sampleRow={preview.sampleRows?.[0] || {}}
                    autoMapping={preview.autoMapping || {}}
                    totalRows={preview.totalRows || 0}
                    onConfirm={handleMappingConfirm}
                    onBack={() => setStep('upload')}
                    loading={parsing}
                />
            )}

            {/* STEP 2 */}
            {step === 'preview' && preview && (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3">
                            <div className="text-xs text-slate-500">Companies</div>
                            <div className="text-lg font-semibold">{companies.length}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs text-green-600">New</div>
                            <div className="text-lg font-semibold text-green-700">{newCompanies.length}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xs text-blue-600">Existing</div>
                            <div className="text-lg font-semibold text-blue-700">{existingCompanies.length}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                            <div className="text-xs text-slate-500">Contacts</div>
                            <div className="text-lg font-semibold">{preview.total}</div>
                        </div>
                    </div>

                    {/* Companies list */}
                    <div>
                        <p className="text-xs font-medium text-slate-700 mb-2">
                            Companies ({companies.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {companies.map((c) => (
                                <div
                                    key={c.name}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${c.existing
                                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                                        : 'bg-green-50 border-green-200 text-green-800'
                                        }`}
                                >
                                    {c.existing ? <Merge size={12} /> : <Plus size={12} />}
                                    <span className="font-medium">{c.name}</span>
                                    <span className="text-xs opacity-75">· {c.contact_count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contacts table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto overflow-x-auto">
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
                                    <th className="px-3 py-2">Company</th>
                                    <th className="px-3 py-2">Company Email</th>
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">Email</th>
                                    <th className="px-3 py-2">Phone</th>
                                    <th className="px-3 py-2 w-20">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const invalid = !r.name || !r.company || (!r.email && !r.phone);
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
                                            <td className="px-3 py-2 text-xs font-medium text-slate-700">
                                                {r.company}
                                            </td>
                                            <td className="px-3 py-2 text-xs">{r.company_email || '—'}</td>
                                            <td className="px-3 py-2 text-xs">{r.name}</td>
                                            <td className="px-3 py-2 text-xs">{r.email || '—'}</td>
                                            <td className="px-3 py-2 text-xs">{r.phone || '—'}</td>
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
                        Skip duplicate contacts (matching email or phone in same company)
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
                        <button onClick={() => setStep('upload')} className="text-sm text-slate-500 hover:text-slate-700">
                            ← Back
                        </button>
                        <div className="flex flex-col-reverse sm:flex-row gap-2">
                            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleImport} disabled={loading || selectedCount === 0}>
                                {loading ? (
                                    <><Loader2 size={14} className="animate-spin mr-1" /> Importing…</>
                                ) : (
                                    <>Import {selectedCount} contact{selectedCount !== 1 ? 's' : ''}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {step === 'result' && result && (
                <div className="space-y-4 text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check size={32} className="text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Import Complete</h3>
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 text-sm">
                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-2xl font-semibold text-brand-600">{result.imported}</div>
                                <div className="text-xs text-slate-500">Contacts</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="text-2xl font-semibold text-green-600">{result.companies_created}</div>
                                <div className="text-xs text-slate-500">New Companies</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3">
                                <div className="text-2xl font-semibold text-blue-600">{result.companies_merged}</div>
                                <div className="text-xs text-slate-500">Merged</div>
                            </div>
                        </div>
                        {result.skipped > 0 && (
                            <p className="text-xs text-amber-600 mt-3">
                                {result.skipped} contact(s) skipped (duplicates)
                            </p>
                        )}
                    </div>
                    <Button onClick={handleClose}>Done</Button>
                </div>
            )}
        </Modal>
    );
}