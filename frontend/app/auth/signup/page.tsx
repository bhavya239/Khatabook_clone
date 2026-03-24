'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', phone: '', password: '', pin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handlePinChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const pinArr = form.pin.split('');
    while (pinArr.length < 6) pinArr.push('');
    pinArr[index] = val.slice(-1);
    setForm({ ...form, pin: pinArr.join('') });
    
    if (val && index < 5) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }
  };

  const handlePinKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !form.pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pin && !/^\d{6}$/.test(form.pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(form.name, form.phone, form.password, form.pin || undefined);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={key !== 'pin'}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="glass p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📒</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 text-sm">Join KhataBook today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('name', 'Full Name', 'text', 'Raj Kumar')}
          {field('phone', 'Phone Number', 'tel', '+91XXXXXXXXXX')}
          {field('password', 'Password', 'password', '••••••••')}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Unlock PIN <span className="text-gray-600">(optional, 6 digits)</span>
            </label>
            <div className="flex gap-2 justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={form.pin[i] || ''}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKey(i, e)}
                  className="w-12 h-14 bg-gray-900 border border-gray-700 rounded-xl text-center text-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
