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
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-left"
            >
                <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400">Organization</div>
                    <div className="text-sm font-medium text-slate-800 truncate">
                        {activeOrg.name}
                    </div>
                </div>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-40 max-h-64 overflow-y-auto">
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
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
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${String(org.id) === String(activeOrg.id)
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${String(org.id) === String(activeOrg.id)
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                <Building2 size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">{org.name}</div>
                                <div className="text-xs text-slate-400">
                                    {org.user_role} · {org.company_count} companies
                                </div>
                            </div>
                            {String(org.id) === String(activeOrg.id) && (
                                <Check size={14} className="text-brand-600 shrink-0" />
                            )}
                        </button>
                    ))}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                        <Link
                            to="/organizations/new"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 transition"
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