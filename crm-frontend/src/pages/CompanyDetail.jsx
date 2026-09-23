import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input, { Select } from '../components/Input';
import Table from '../components/Table';
import Badge from '../components/Badge';
import StatusDropdown from '../components/StatusDropdown';
import ImportContactsModal from '../components/ImportContactsModal';
import AIInsightsPanel from '../components/AIInsightsPanel';
import { useCompany, useUpdateCompanyStatus } from '../hooks/useCompanies';
import { useCreateContact, useUpdateContact } from '../hooks/useContacts';
import { useCompanyActivities } from '../hooks/useActivities';

export default function CompanyDetail() {
    const { id } = useParams();
    const qc = useQueryClient();
    const { data: company, isLoading } = useCompany(id);
    const { data: activities = [] } = useCompanyActivities(id);
    const createContact = useCreateContact();
    const updateContact = useUpdateContact(id);
    const updateStatus = useUpdateCompanyStatus(id);

    const [replyModal, setReplyModal] = useState(null);
    const [modal, setModal] = useState(null); // null | 'create' | 'edit'
    const [importOpen, setImportOpen] = useState(false);

    const [form, setForm] = useState({
        id: null,
        name: '',
        email: '',
        phone: '',
        role: '',
        status: 'Active',
        is_primary_contact: false,
        email_optin: true,
        whatsapp_optin: true,
        call_optin: true,
        do_not_contact: false,
    });

    const handleStatusChange = (newStatus) => {
        updateStatus.mutate({ id: Number(id), status: newStatus });
    };

    const openCreate = () => {
        setForm({
            id: null,
            name: '',
            email: '',
            phone: '',
            role: '',
            status: 'Active',
            is_primary_contact: false,
            email_optin: true,
            whatsapp_optin: true,
            call_optin: true,
            do_not_contact: false,
        });
        setModal('create');
    };

    const openEdit = (contact) => {
        setForm({
            id: contact.id,
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            role: contact.role || '',
            status: contact.status || 'Active',
            is_primary_contact: !!contact.is_primary_contact,
            email_optin: contact.email_optin ?? true,
            whatsapp_optin: contact.whatsapp_optin ?? true,
            call_optin: contact.call_optin ?? true,
            do_not_contact: contact.do_not_contact ?? false,
        });
        setModal('edit');
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            if (modal === 'edit') {
                await updateContact.mutateAsync({
                    id: form.id,
                    name: form.name,
                    email: form.email || null,
                    phone: form.phone || null,
                    role: form.role || null,
                    status: form.status,
                    is_primary_contact: form.is_primary_contact,
                    email_optin: form.email_optin,
                    whatsapp_optin: form.whatsapp_optin,
                    call_optin: form.call_optin,
                    do_not_contact: form.do_not_contact,
                });
                toast.success('Contact updated');
            } else {
                await createContact.mutateAsync({
                    company_id: Number(id),
                    name: form.name,
                    email: form.email || null,
                    phone: form.phone || null,
                    role: form.role || null,
                    is_primary_contact: form.is_primary_contact,
                });
                toast.success('Contact added');
            }
            setModal(null);
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (isLoading) return <p>Loading…</p>;
    if (!company) return <p>Company not found.</p>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                        <h1 className="text-2xl font-semibold">{company.name}</h1>
                        <StatusDropdown value={company.status} onChange={handleStatusChange} />
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        {company.industry || '—'} · {company.email || 'no email'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setImportOpen(true)}>
                        <Upload size={14} className="mr-1" /> Import
                    </Button>
                    <Button onClick={openCreate}>+ Add Contact</Button>
                </div>
            </div>

            {/* Contacts */}
            <Card title={`Contacts (${company.contacts?.length || 0})`}>
                <Table
                    data={company.contacts || []}
                    empty="No contacts yet"
                    onRowClick={openEdit}
                    columns={[
                        {
                            key: 'name',
                            label: 'Name',
                            render: (r) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-brand-600 font-medium">{r.name}</span>
                                    {r.is_primary_contact && <Badge>Primary</Badge>}
                                    {r.do_not_contact && <Badge tone="Failed">DNC</Badge>}
                                </div>
                            ),
                        },
                        { key: 'role', label: 'Role' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone' },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (r) => <Badge>{r.status}</Badge>,
                        },
                    ]}
                />
            </Card>

            {/* Activity History */}
            <Card title="Activity History">
                <Table
                    data={activities}
                    empty="No activity yet"
                    columns={[
                        { key: 'activity_type', label: 'Type' },
                        { key: 'subject', label: 'Subject' },
                        { key: 'contact_name', label: 'Contact' },
                        { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
                        {
                            key: 'sent_by_email',
                            label: 'Sent By',
                            render: (r) => (
                                <span className="text-xs">
                                    {r.sent_by_name || r.sent_by_email || '—'}
                                </span>
                            ),
                        },
                        {
                            key: 'sent_at',
                            label: 'Sent',
                            render: (r) => (r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'),
                        },
                        {
                            key: 'response_received',
                            label: 'Reply',
                            render: (r) =>
                                r.response_received ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setReplyModal(r);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition"
                                    >
                                        💬 Reply
                                    </button>
                                ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                ),
                        },
                    ]}
                />
            </Card>

            {/* 🆕 AI Insights */}
            <Card title="AI Customer Insights">
                <AIInsightsPanel companyId={Number(id)} />
            </Card>

            {/* Add / Edit Contact Modal */}
            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal === 'edit' ? 'Edit Contact' : 'Add Contact'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Name *"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            label="Phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Role"
                            placeholder="CEO, Manager…"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        />
                        {modal === 'edit' && (
                            <Select
                                label="Status"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                <option>Active</option>
                                <option>Inactive</option>
                                <option>DoNotContact</option>
                            </Select>
                        )}
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.is_primary_contact}
                            onChange={(e) =>
                                setForm({ ...form, is_primary_contact: e.target.checked })
                            }
                        />
                        Primary contact
                    </label>

                    {modal === 'edit' && (
                        <div className="border-t pt-3 space-y-2">
                            <p className="text-xs font-medium text-slate-700">
                                Communication Preferences
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.email_optin}
                                        onChange={(e) => setForm({ ...form, email_optin: e.target.checked })}
                                    />
                                    Email opt-in
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.whatsapp_optin}
                                        onChange={(e) =>
                                            setForm({ ...form, whatsapp_optin: e.target.checked })
                                        }
                                    />
                                    WhatsApp opt-in
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.call_optin}
                                        onChange={(e) => setForm({ ...form, call_optin: e.target.checked })}
                                    />
                                    Call opt-in
                                </label>
                                <label className="flex items-center gap-2 text-red-600">
                                    <input
                                        type="checkbox"
                                        checked={form.do_not_contact}
                                        onChange={(e) =>
                                            setForm({ ...form, do_not_contact: e.target.checked })
                                        }
                                    />
                                    Do Not Contact
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createContact.isPending || updateContact.isPending}
                        >
                            {modal === 'edit' ? 'Save Changes' : 'Add'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Reply Details Modal */}
            <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Customer Reply">
                {replyModal && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Subject</p>
                                <p className="font-medium text-slate-800">{replyModal.subject || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Reply Received</p>
                                <p className="font-medium text-slate-800">
                                    {replyModal.response_at
                                        ? new Date(replyModal.response_at).toLocaleString()
                                        : '—'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 mb-1">Reply Body</p>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto text-slate-800">
                                {replyModal.response_body || '(No body)'}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="secondary" onClick={() => setReplyModal(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Import Contacts Modal */}
            <ImportContactsModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                companyId={Number(id)}
                onSuccess={() => {
                    qc.invalidateQueries({ queryKey: ['company', String(id)] });
                    qc.invalidateQueries({ queryKey: ['companies-list'] });
                }}
            />
        </div>
    );
}