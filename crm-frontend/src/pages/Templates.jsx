import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Textarea, Select } from '../components/Input';
import AIGenerateModal from '../components/AIGenerateModal';
import { useCreateTemplate } from '../hooks/useTemplates';

const DEMO_VARS = ['CompanyName', 'ContactName', 'ContactRole', 'ContactEmail'];

export default function Templates() {
    const create = useCreateTemplate();
    const [aiOpen, setAiOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'Email',
        subject: '',
        body: 'Hi {{ContactName}},\n\nI wanted to reach out about {{CompanyName}}…',
        applicable_roles: '',
    });

    const insertVar = (v) => setForm({ ...form, body: `${form.body}{{${v}}}` });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await create.mutateAsync({
                ...form,
                applicable_roles: form.applicable_roles
                    ? form.applicable_roles.split(',').map((s) => s.trim()).filter(Boolean)
                    : undefined,
            });
            toast.success('Template created');
            setForm({ ...form, name: '', subject: '', body: '' });
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create Template</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Write manually or let AI generate for you
                    </p>
                </div>
                <Button onClick={() => setAiOpen(true)} className="shrink-0">
                    <Sparkles size={14} className="mr-1.5" /> Generate with AI
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Template" className="lg:col-span-2">
                    <form onSubmit={submit} className="space-y-4">
                        <Input
                            label="Name *"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <Select
                            label="Type"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option>Email</option>
                            <option>WhatsApp</option>
                            <option>SMS</option>
                        </Select>
                        {form.type === 'Email' && (
                            <Input
                                label="Subject"
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            />
                        )}
                        <Textarea
                            label="Body *"
                            required
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            rows={10}
                        />
                        <Input
                            label="Applicable roles (comma separated)"
                            placeholder="CEO, CTO, Manager"
                            value={form.applicable_roles}
                            onChange={(e) => setForm({ ...form, applicable_roles: e.target.value })}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={create.isPending}>
                                {create.isPending ? 'Saving…' : 'Save Template'}
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card title="Variables">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Click to insert into body.</p>
                    <div className="flex flex-wrap gap-2">
                        {DEMO_VARS.map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => insertVar(v)}
                                className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded font-mono transition"
                            >
                                {`{{${v}}}`}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                        <p className="font-semibold mb-1">Preview:</p>
                        <pre className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-2.5 rounded-lg text-[11px] leading-relaxed">
                            {form.body}
                        </pre>
                    </div>
                </Card>
            </div>

            <AIGenerateModal
                open={aiOpen}
                onClose={() => setAiOpen(false)}
                onGenerated={(data) => {
                    setForm({
                        ...form,
                        name: data.name || form.name,
                        subject: data.subject || '',
                        body: data.body,
                        applicable_roles: (data.applicable_roles || []).join(', '),
                    });
                }}
            />
        </div>
    );
}
