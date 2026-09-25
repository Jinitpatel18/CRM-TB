import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BarChart3, Calendar, Mail, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../lib/AuthContext';

const features = [
    { icon: Mail, text: 'Multi-channel outreach — email, WhatsApp & SMS' },
    { icon: Calendar, text: 'Smart meetings with Google Calendar sync' },
    { icon: Zap, text: 'AI that drafts, improves & analyzes for you' },
    { icon: BarChart3, text: 'Real-time analytics & reply tracking' },
];

export default function Login() {
    const { signIn } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const from = searchParams.get('return') || location.state?.from?.pathname || '/';

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signIn(form.email, form.password);
            if (error) throw error;
            toast.success('Welcome back!');
            nav(from, { replace: true });
        } catch (err) {
            const msg = err.message || 'Login failed';
            if (msg.toLowerCase().includes('invalid login')) {
                toast.error('Incorrect email or password');
            } else if (msg.toLowerCase().includes('email not confirmed')) {
                toast.error('Please confirm your email first');
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen auth-bg flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-pop border border-white/60 overflow-hidden grid lg:grid-cols-2 animate-fade-up">
                {/* Left: brand panel */}
                <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 p-10 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl" />

                    <div className="relative">
                        <img src="./logo.svg" alt="CRM" className="h-9 brightness-0 invert" />
                    </div>

                    <div className="relative space-y-5">
                        <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
                            Close more deals,<br />faster than ever.
                        </h2>
                        <ul className="space-y-3.5">
                            {features.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3 text-sm text-indigo-100">
                                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                        <Icon size={15} className="text-white" />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-xs text-indigo-200/70">
                        © {new Date().getFullYear()} CRM · Modern Sales Platform
                    </p>
                </div>

                {/* Right: form */}
                <div className="p-8 sm:p-10">
                    <div className="lg:hidden flex justify-center mb-6">
                        <img src="./logo.svg" alt="CRM" className="h-9" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                    <p className="text-sm text-slate-500 mt-1.5 mb-7">
                        Sign in to continue to your workspace
                    </p>

                    <form onSubmit={submit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            label="Password"
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <Button type="submit" className="w-full !py-2.5" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-7">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
