import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input, { Select } from '../components/Input';
import Table from '../components/Table';
import StatusDropdown from '../components/StatusDropdown';
import ImportCompaniesModal from '../components/ImportCompaniesModal';
import {
    useCompanies,
    useCreateCompany,
    useUpdateCompanyStatus,
} from '../hooks/useCompanies';

export default function Companies() {
    const nav = useNavigate();
    const qc = useQueryClient();
    const [importOpen, setImportOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        industry: '',
        status: 'Prospect',
    });

    const { data: companies = [], isLoading } = useCompanies();
    const createCompany = useCreateCompany();
    const updateStatus = useUpdateCompanyStatus();

    const filtered = useMemo(() => {
        return companies.filter((c) => {
            if (statusFilter && c.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                if (
                    !c.name?.toLowerCase().includes(q) &&
                    !c.email?.toLowerCase().includes(q) &&
                    !c.industry?.toLowerCase().includes(q)
                )
                    return false;
            }
            return true;
        });
    }, [companies, statusFilter, search]);

    const counts = useMemo(() => {
        return companies.reduce(
            (acc, c) => {
                acc[c.status] = (acc[c.status] || 0) + 1;
                acc.all = (acc.all || 0) + 1;
                return acc;
            },
            {}
        );
    }, [companies]);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await createCompany.mutateAsync(form);
            toast.success('Company created');
            setOpen(false);
            setForm({ name: '', email: '', phone: '', industry: '', status: 'Prospect' });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleStatusChange = (company, newStatus) => {
        updateStatus.mutate({ id: company.id, status: newStatus });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Companies</h1>
                    <p className="text-sm text-slate-500">
                        {companies.length} total ·{' '}
                        <span className="text-green-600">{counts.Active || 0} active</span> ·{' '}
                        <span className="text-slate-500">{counts.Inactive || 0} inactive</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setImportOpen(true)}>
                        <Upload size={14} className="mr-1" /> Import
                    </Button>
                    <Button onClick={() => setOpen(true)}>+ New Company</Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                        label="Search"
                        placeholder="Name, email, industry…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Select
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All statuses ({counts.all || 0})</option>
                        <option value="Active">Active ({counts.Active || 0})</option>
                        <option value="Inactive">Inactive ({counts.Inactive || 0})</option>
                        <option value="Churned">Churned ({counts.Churned || 0})</option>
                        <option value="Prospect">Prospect ({counts.Prospect || 0})</option>
                    </Select>
                    <div className="flex items-end">
                        {(statusFilter || search) && (
                            <button
                                onClick={() => {
                                    setStatusFilter('');
                                    setSearch('');
                                }}
                                className="text-sm text-brand-600 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card>
                {isLoading ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                ) : (
                    <Table
                        data={filtered}
                        empty="No companies match your filters"
                        onRowClick={(row) => nav(`/companies/${row.id}`)}
                        columns={[
                            {
                                key: 'name',
                                label: 'Name',
                                render: (r) => (
                                    <div>
                                        <span className="font-medium text-slate-800">{r.name}</span>
                                        {r.industry && (
                                            <div className="text-xs text-slate-400">{r.industry}</div>
                                        )}
                                    </div>
                                ),
                            },
                            { key: 'email', label: 'Email', render: (r) => r.email || '—' },
                            {
                                key: 'contact_count',
                                label: 'Contacts',
                                render: (r) => (
                                    <span className="text-slate-600 text-sm">{r.contact_count}</span>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (r) => (
                                    <StatusDropdown
                                        value={r.status}
                                        onChange={(newStatus) => handleStatusChange(r, newStatus)}
                                        size="sm"
                                    />
                                ),
                            },
                            {
                                key: 'created_at',
                                label: 'Created',
                                render: (r) => new Date(r.created_at).toLocaleDateString(),
                            },
                        ]}
                    />
                )}
            </Card>

            {/* Create Company Modal */}
            <Modal open={open} onClose={() => setOpen(false)} title="New Company">
                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Name *"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
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
                    <Input
                        label="Industry"
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />
                    <Select
                        label="Status"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        {['Prospect', 'Active', 'Inactive', 'Churned'].map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </Select>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createCompany.isPending}>
                            {createCompany.isPending ? 'Creating…' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ⬇️ Import Companies Modal */}
            <ImportCompaniesModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onSuccess={() => {
                    qc.invalidateQueries({ queryKey: ['companies-list'] });
                }}
            />
        </div>
    );
}