import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Textarea, Select } from '../components/Input';
import FileUploader from '../components/FileUploader';
import { useSendMessage } from '../hooks/useActivities';
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

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Send Message</h1>

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
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        />
                    )}

                    <Textarea
                        label="Body"
                        value={form.body}
                        onChange={(e) => setForm({ ...form, body: e.target.value })}
                    />

                    {/* ⬇️ File Uploader */}
                    <FileUploader files={attachments} onChange={setAttachments} />

                    <Input
                        label="Schedule for (optional)"
                        type="datetime-local"
                        value={form.scheduled_for}
                        onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                    />

                    <div className="flex justify-end">
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