import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Button from './Button';
import Input, { Textarea, Select } from './Input';
import { useGenerateTemplate } from '../hooks/useAI';

const PRESETS = [
    'Write a follow-up email to a CEO who hasn\'t responded in 5 days',
    'Write a cold outreach email introducing our CPaaS services',
    'Write a meeting confirmation email with agenda',
    'Write a proposal summary email after a demo call',
    'Write a re-engagement email to an inactive customer',
];

export default function AIGenerateModal({ open, onClose, onGenerated }) {
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState('Email');
    const [tone, setTone] = useState('professional');
    const generate = useGenerateTemplate();

    const handleGenerate = async () => {
        if (prompt.trim().length < 5) {
            return toast.error('Please describe what you want (min 5 chars)');
        }

        try {
            const result = await generate.mutateAsync({ prompt, type, tone });
            toast.success('Generated! Review and edit.');
            onGenerated?.(result);
            setPrompt('');
            onClose();
        } catch (err) {
            // Error already toasted by hook
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="✨ Generate with AI" size="lg">
            <div className="space-y-4">
                <Textarea
                    label="What do you want to write?"
                    placeholder="e.g., Write a follow-up email to a CEO about our CPaaS services after 5 days of no response"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick prompts:</p>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPrompt(p)}
                                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:hover:bg-brand-500/15 dark:hover:text-brand-300 text-slate-600 dark:text-slate-300 transition"
                            >
                                {p.slice(0, 45)}…
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
                        <option>Email</option>
                        <option>WhatsApp</option>
                        <option>SMS</option>
                    </Select>
                    <Select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="persuasive">Persuasive</option>
                    </Select>
                </div>

                <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-lg p-3 text-xs text-brand-800 dark:text-brand-300">
                    💡 <strong>Tip:</strong> AI automatically uses {'{{ContactName}}'}, {'{{CompanyName}}'}, and other
                    variables so your template works with any contact.
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={generate.isPending}>
                        {generate.isPending ? (
                            <>
                                <Loader2 size={14} className="animate-spin mr-1.5" /> Generating…
                            </>
                        ) : (
                            <>
                                <Wand2 size={14} className="mr-1.5" /> Generate
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}