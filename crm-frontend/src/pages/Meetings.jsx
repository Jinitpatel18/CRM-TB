import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Textarea, Select } from '../components/Input';
import { useScheduleMeeting } from '../hooks/useMeetings';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Meetings() {
    const schedule = useScheduleMeeting();
    const [companyId, setCompanyId] = useState('');
    const [contacts, setContacts] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [form, setForm] = useState({
        title: '', description: '', start_time: '', end_time: '',
        location: '', meeting_link: '',
    });

    const { data: companies = [] } = useQuery({
        queryKey: ['companies-lite'],
        queryFn: async () => {
            const { data } = await supabase.from('companies').select('id, name').order('name');
            return data || [];
        },
    });

    useEffect(() => {
        if (!companyId) return setContacts([]);
        supabase.from('contacts').select('id, name, email').eq('company_id', companyId)
            .then(({ data }) => { setContacts(data || []); setAttendees([]); });
    }, [companyId]);

    const checkAvail = async () => {
        if (!form.start_time || !form.end_time) return toast.error('Pick times first');
        try {
            const data = await api.availability({
                contact_ids: attendees.join(','),
                from: new Date(form.start_time).toISOString(),
                to: new Date(form.end_time).toISOString(),
            });
            toast.success(`Busy slots: ${data.busy?.length || 0}`);
        } catch (err) { toast.error(err.message); }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (attendees.length === 0) return toast.error('Pick at least one attendee');

        const payload = {
            company_id: Number(companyId),
            contact_ids: attendees.map(Number),   // ← Ensure numbers
            title: form.title,
            description: form.description || undefined,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
            location: form.location || undefined,
            meeting_link: form.meeting_link || undefined,
        };

        console.log('📤 Sending payload:', payload);   // ← Debug

        try {
            await schedule.mutateAsync(payload);
            toast.success('Meeting scheduled');
            setForm({ title: '', description: '', start_time: '', end_time: '', location: '', meeting_link: '' });
            setAttendees([]);
        } catch (err) {
            console.error('❌ Meeting error:', err);
            toast.error(err.message);
        }
    };

    const toggle = (id) =>
        setAttendees((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule Meeting</h1>
                <p className="text-sm text-slate-500 mt-0.5">Book time with contacts and check availability</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Meeting" className="lg:col-span-2">
                    <form onSubmit={submit} className="space-y-4">
                        <Input label="Title *" required value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        <Textarea label="Description" value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Start *" type="datetime-local" required value={form.start_time}
                                onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                            <Input label="End *" type="datetime-local" required value={form.end_time}
                                onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                        </div>

                        <Input label="Location" value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })} />
                        <Input label="Meeting link (optional — auto-generated if blank)" value={form.meeting_link}
                            onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} />

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={checkAvail} className="w-full sm:w-auto">Check availability</Button>
                            <Button type="submit" disabled={schedule.isPending} className="w-full sm:w-auto">
                                {schedule.isPending ? 'Scheduling…' : 'Schedule'}
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card title={`Attendees (${attendees.length})`}>
                    <Select label="Company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                        <option value="">Select…</option>
                        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
                        {contacts.length === 0 && (
                            <p className="text-sm text-slate-400">Select a company to see contacts.</p>
                        )}
                        {contacts.map((c) => (
                            <label key={c.id}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer text-sm transition ${attendees.includes(c.id)
                                    ? 'border-brand-200 bg-brand-50/60'
                                    : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
                                <input type="checkbox" checked={attendees.includes(c.id)}
                                    onChange={() => toggle(c.id)}
                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30" />
                                <div className="min-w-0">
                                    <div className="font-medium text-slate-800 truncate">{c.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{c.email}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}