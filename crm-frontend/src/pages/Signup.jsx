import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../lib/AuthContext';

export default function Signup() {
    const { signUp } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            return toast.error('Passwords do not match');
        }
        if (form.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const { error } = await signUp(form.email, form.password);
            if (error) throw error;
            toast.success('Account created! You can now sign in.');
            nav('/login');
        } catch (err) {
            toast.error(err.message || 'Signup failed');
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
                    Create your team account
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
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={form.confirm}
                        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating account…' : 'Sign Up'}
                    </Button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-600 hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}