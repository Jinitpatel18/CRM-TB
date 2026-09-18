import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function FileUploader({ files = [], onChange, maxSize = 10 * 1024 * 1024 }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const uploadFiles = useCallback(
        async (fileList) => {
            const list = Array.from(fileList || []);
            if (!list.length) return;

            setUploading(true);
            const uploaded = [];

            for (const file of list) {
                if (file.size > maxSize) {
                    toast.error(`${file.name} is too large (max 10 MB)`);
                    continue;
                }

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(`${API}/files/upload`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${session?.access_token}` },
                        body: formData,
                    });

                    const json = await res.json();
                    if (!res.ok || !json.success) {
                        throw new Error(json?.error?.message || 'Upload failed');
                    }
                    uploaded.push(json.data);
                    toast.success(`${file.name} uploaded`);
                } catch (err) {
                    toast.error(`${file.name}: ${err.message}`);
                }
            }

            setUploading(false);
            if (uploaded.length) {
                onChange?.([...files, ...uploaded]);
            }
        },
        [files, maxSize, onChange]
    );

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        uploadFiles(e.dataTransfer.files);
    };

    const removeFile = (id) => {
        onChange?.(files.filter((f) => f.id !== id));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Attachments {files.length > 0 && `(${files.length})`}
            </label>

            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${dragging
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
                    } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }}
                />
                {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        Uploading…
                    </div>
                ) : (
                    <>
                        <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                        <p className="text-sm text-slate-600">
                            <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            PDF, images, docs · Max 10 MB per file
                        </p>
                    </>
                )}
            </div>

            {files.length > 0 && (
                <div className="mt-3 space-y-2">
                    {files.map((f) => (
                        <div
                            key={f.id}
                            className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                            <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                <FileText size={14} className="text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{f.file_name}</p>
                                <p className="text-xs text-slate-500">
                                    {f.size ? formatSize(f.size) : f.file_type || 'attachment'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}