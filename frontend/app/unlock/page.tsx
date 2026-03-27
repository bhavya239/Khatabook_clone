'use client';
/**
 * Unlock Screen — PIN entry to access the main app.
 * Shown after the user triggers the secret from the calculator.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function UnlockPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, unlock } = useAuth();
  const router = useRouter();

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 6) handleSubmit(next);
  };

  const handleSubmit = async (p: string) => {
    if (!isAuthenticated) {
      // Not logged in → go to login
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    const ok = await unlock(p);
    setLoading(false);
    if (ok) {
      router.push('/dashboard');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-5xl mb-3">🔐</div>
        <h1 className="text-2xl font-bold text-white">Enter PIN</h1>
        <p className="text-gray-400 text-sm mt-1">Enter your 6-digit PIN to unlock</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600 bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-400 text-sm -mt-4">{error}</p>}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            disabled={loading || d === ''}
            onClick={() => {
              if (d === '⌫') setPin((p) => p.slice(0, -1));
              else if (d) handleDigit(d);
            }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full text-xl sm:text-2xl font-medium transition-transform active:scale-95 ${
              d === ''
                ? 'cursor-default'
                : d === '⌫'
                ? 'bg-gray-800 text-red-400 hover:bg-gray-700'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/')}
        className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
      >
        ← Back to calculator
      </button>
    </div>
  );
}
