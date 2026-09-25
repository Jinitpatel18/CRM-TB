import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Textarea, Select } from '../components/Input';
import FileUploader from '../components/FileUploader';
import { useSendMessage } from '../hooks/useActivities';
import { useImproveEmail } from '../hooks/useAI';
import { api } from '../lib/api';

export default function SendMessage() {
    const { data: companies = [] } = useQuery({
        queryKey: ['companies-lite'],
        queryFn: api.listCompanies,
    });

    const [companyId, setCompanyId] = useState('');
    const [contacts, setContacts] = useState([]);
    const [contactId, setContactId] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [form, setForm] = useState({
        activity_type: 'Email',
        subject: '',
        body: '',
        scheduled_for: '',
    });

    const send = useSendMessage();
    const improve = useImproveEmail();

    // Load contacts when company changes
    useEffect(() => {
        if (!companyId) {
            setContacts([]);
            setContactId('');
            return;
        }
        api.getCompany(companyId).then((c) => {
            setContacts(c.contacts || []);
            setContactId('');
        });
    }, [companyId]);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await send.mutateAsync({
                company_id: Number(companyId),
                contact_id: Number(contactId),
                activity_type: form.activity_type,
                subject: form.subject || undefined,
                body: form.body || undefined,
                scheduled_for: form.scheduled_for
                    ? new Date(form.scheduled_for).toISOString()
                    : undefined,
                attachment_ids: attachments.map((a) => a.id),
            });
            toast.success(form.scheduled_for ? 'Scheduled' : 'Sent');
            setForm({ ...form, subject: '', body: '', scheduled_for: '' });
            setAttachments([]);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleImprove = async () => {
        if (form.body.trim().length < 5) {
            return toast.error('Write some content in Body first');
        }
        try {
            const result = await improve.mutateAsync({
                subject: form.subject,
                body: form.body,
                instruction: 'Make it more professional and concise',
            });
            setForm({
                ...form,
                subject: result.subject || form.subject,
                body: result.body,
            });
            toast.success('✨ Email improved!');
        } catch (err) {
            // Error handled by hook
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Send Message</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Reach a contact instantly or schedule for later</p>
            </div>

            <Card>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Company *"
                            required
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
                            label="Contact *"
                            required
                            value={contactId}
                            onChange={(e) => setContactId(e.target.value)}
                            disabled={!companyId}
                        >
                            <option value="">Select…</option>
                            {contacts.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.email || c.phone})
                                </option>
                            ))}
                        </Select>
                    </div>

                    <Select
                        label="Channel *"
                        value={form.activity_type}
                        onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                    >
                        <option>Email</option>
                    </Select>

                    {form.activity_type === 'Email' && (
                        <Input
                            label="Subject"
                            placeholder="Your subject line…"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        />
                    )}

                    {/* Body with AI Improve button */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Body</span>
                            <button
                                type="button"
                                onClick={handleImprove}
                                disabled={improve.isPending}
                                className="text-xs inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/15 dark:hover:bg-brand-500/25 px-2.5 py-1 rounded-full font-medium disabled:opacity-50 transition"
                            >
                                {improve.isPending ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" /> Improving…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={12} /> Improve with AI
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            rows={8}
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/70 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-soft dark:shadow-soft-dark
                transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-400/20 focus:border-brand-500 dark:focus:border-brand-400"
                            placeholder="Write your message... or use AI to improve it ✨"
                        />
                    </div>

                    {/* File Uploader */}
                    <FileUploader files={attachments} onChange={setAttachments} />

                    <Input
                        label="Schedule for (optional)"
                        type="datetime-local"
                        value={form.scheduled_for}
                        onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                    />

                    <div className="flex justify-end pt-1">
                        <Button
                            type="submit"
                            disabled={!companyId || !contactId || send.isPending}
                        >
                            {send.isPending
                                ? 'Sending…'
                                : form.scheduled_for
                                    ? 'Schedule'
                                    : 'Send now'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
