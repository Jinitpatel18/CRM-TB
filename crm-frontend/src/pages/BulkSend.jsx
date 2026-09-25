import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Select } from '../components/Input';
import Badge from '../components/Badge';
import FileUploader from '../components/FileUploader';
import { useBulkSend } from '../hooks/useActivities';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function BulkSend() {
    const bulk = useBulkSend();
    const [companyId, setCompanyId] = useState('');
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState([]);
    const [templateId, setTemplateId] = useState('');
    const [templates, setTemplates] = useState([]);
    const [activityType, setActivityType] = useState('Email');
    const [scheduledFor, setScheduledFor] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [result, setResult] = useState(null);

    // Load companies list (from backend API)
    const { data: companies = [] } = useQuery({
        queryKey: ['companies-lite'],
        queryFn: api.listCompanies,
    });

    // ⬇️ Load templates from Supabase (temporary, until we add GET /api/templates)
    useEffect(() => {
        supabase
            .from('message_templates')
            .select('id, name, type')
            .order('name')
            .then(({ data, error }) => {
                if (error) {
                    console.error('Templates load failed:', error);
                    return;
                }
                setTemplates(data || []);
            });
    }, []);

    // Load contacts when company changes
    useEffect(() => {
        if (!companyId) {
            setContacts([]);
            setSelected([]);
            return;
        }
        api.getCompany(companyId).then((c) => {
            setContacts((c.contacts || []).filter((x) => x.status === 'Active'));
            setSelected([]);
        });
    }, [companyId]);

    const toggle = (id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    const submit = async () => {
        if (!templateId || selected.length === 0) {
            return toast.error('Pick template + contacts');
        }
        try {
            const data = await bulk.mutateAsync({
                template_id: Number(templateId),
                activity_type: activityType,
                contact_ids: selected,
                scheduled_for: scheduledFor
                    ? new Date(scheduledFor).toISOString()
                    : undefined,
                attachment_ids: attachments.map((a) => a.id),
            });
            toast.success(`Queued ${data.queued} messages`);
            setResult(data);
            setAttachments([]);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Send</h1>
                <p className="text-sm text-slate-500 mt-0.5">Send a template to many contacts at once</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="1. Configure" className="lg:col-span-1">
                    <div className="space-y-4">
                        <Select
                            label="Company"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                        >
                            <option value="">Select…</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>

                        <Select
                            label="Template"
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                        >
                            <option value="">Select…</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.type})
                                </option>
                            ))}
                        </Select>

                        <Select
                            label="Channel"
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                        >
                            <option>Email</option>
                        </Select>

                        <Input
                            label="Schedule for (optional)"
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                        />

                        {/* ⬇️ File Uploader */}
                        <FileUploader files={attachments} onChange={setAttachments} />

                        <Button
                            className="w-full"
                            onClick={submit}
                            disabled={bulk.isPending}
                        >
                            {bulk.isPending
                                ? 'Queueing…'
                                : `Send to ${selected.length} contact(s)`}
                        </Button>

                        {result && (
                            <div className="text-xs text-slate-500 border-t pt-3">
                                <p className="font-medium text-slate-700">
                                    Queued: {result.queued}
                                </p>
                                <p>IDs: {result.activity_ids.join(', ')}</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card
                    title={`2. Pick contacts (${selected.length}/${contacts.length})`}
                    className="lg:col-span-2"
                >
                    {contacts.length === 0 && (
                        <p className="text-sm text-slate-400">Pick a company first.</p>
                    )}
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {contacts.map((c) => (
                            <label
                                key={c.id}
                                className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${selected.includes(c.id)
                                    ? 'border-brand-200 bg-brand-50/60'
                                    : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(c.id)}
                                    onChange={() => toggle(c.id)}
                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">{c.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {c.email || c.phone} {c.role && `· ${c.role}`}
                                    </div>
                                </div>
                                <Badge>Active</Badge>
                            </label>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}