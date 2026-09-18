import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
    const { signIn } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h1 className="text-2xl font-semibold text-center mb-2">
                    <span className="text-brand-600">CRM</span>
                </h1>
                <p className="text-center text-slate-500 text-sm mb-6">
                    Sign in to your account
                </p>

                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <Input
                        label="Password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-brand-600 hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}