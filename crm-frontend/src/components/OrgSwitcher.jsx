import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useOrg } from '../lib/OrgContext';
import { Link } from 'react-router-dom';

export default function OrgSwitcher() {
    const { organizations, activeOrg, switchOrg } = useOrg();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!activeOrg) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shrink-0 shadow-soft">
                    <Building2 size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">Organization</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                        {activeOrg.name}
                    </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-pop dark:shadow-pop-dark py-1 z-40 max-h-64 overflow-y-auto animate-scale-in origin-top">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Your Organizations
                    </div>
                    {organizations.map((org) => (
                        <button
                            key={org.id}
                            onClick={() => {
                                if (String(org.id) !== String(activeOrg.id)) {
                                    switchOrg(org.id);
                                }
                                setOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition ${String(org.id) === String(activeOrg.id)
                                    ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${String(org.id) === String(activeOrg.id)
                                    ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-soft'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}>
                                <Building2 size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">{org.name}</div>
                                <div className="text-xs text-slate-400 dark:text-slate-500">
                                    {org.user_role} · {org.company_count} companies
                                </div>
                            </div>
                            {String(org.id) === String(activeOrg.id) && (
                                <Check size={14} className="text-brand-600 dark:text-brand-400 shrink-0" />
                            )}
                        </button>
                    ))}

                    <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 pb-0.5">
                        <Link
                            to="/organizations/new"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition rounded-b-xl"
                        >
                            <Plus size={14} />
                            Create new organization
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
