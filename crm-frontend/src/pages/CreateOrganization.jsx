import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { api } from '../lib/api';
import { useOrg } from '../lib/OrgContext';

export default function CreateOrganization() {
    const nav = useNavigate();
    const { reload: reloadOrgs, switchOrg } = useOrg();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        industry: '',
    });
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            return toast.error('Organization name is required');
        }

        setLoading(true);
        try {
            const org = await api.createOrganization({
                name: form.name.trim(),
                email: form.email || undefined,
                phone: form.phone || undefined,
                industry: form.industry || undefined,
            });

            toast.success(`Organization "${org.name}" created!`);

            // Reload orgs and switch to new org
            await reloadOrgs();

            // Small delay for state to update
            setTimeout(() => {
                if (org?.id) {
                    switchOrg(org.id);
                } else {
                    nav('/');
                }
            }, 500);
        } catch (err) {
            toast.error(err.message || 'Failed to create organization');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Back button */}
            <button
                onClick={() => nav(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft size={14} /> Back
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                    <Building2 size={24} className="text-brand-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold">Create Organization</h1>
                    <p className="text-sm text-slate-500">
                        Organizations keep your CRM data separate. Each org has its own companies, contacts, and team.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Organization Name *"
                        required
                        placeholder="e.g., SMSCloud Hub"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Business Email"
                            type="email"
                            placeholder="contact@company.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            label="Phone"
                            placeholder="+91 9876543210"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Industry"
                        placeholder="e.g., IT, Retail, Finance"
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                        💡 <strong>You'll be the admin</strong> of this organization. You can invite team members after creation.
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => nav(-1)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-1.5" />
                                    Creating…
                                </>
                            ) : (
                                'Create Organization'
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}