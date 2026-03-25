'use client';
/**
 * Gate Page — Universal PIN Entry
 * Shown before login/signup when user comes from the calculator secret.
 * The universal PIN (123456) is checked here entirely client-side.
 * On success → redirected to the intended destination (login/signup).
 */
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const UNIVERSAL_PIN = '123456';
const MAX_ATTEMPTS = 5;

function GateContent() {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');
  const [lockTimer, setLockTimer] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/auth/signup';

  // Check if already verified this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = sessionStorage.getItem('universal_pin_ok');
      if (verified === 'true') {
        router.replace(redirect);
      }
    }
  }, [redirect, router]);

  // Countdown timer when locked
  useEffect(() => {
    if (!locked) return;
    setLockTimer(30);
    const interval = setInterval(() => {
      setLockTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setLocked(false);
          setAttempts(0);
          setPin('');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleDigit = (d: string) => {
    if (locked || pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 6) handleSubmit(next);
  };

  const handleSubmit = (p: string) => {
    if (p === UNIVERSAL_PIN) {
      sessionStorage.setItem('universal_pin_ok', 'true');
      router.replace(redirect);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError('');
      } else {
        setError(`Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-white">Enter App PIN</h1>
        <p className="text-gray-500 text-sm mt-1">Enter the 6-digit universal PIN to continue</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? 'bg-amber-500 border-amber-500 scale-110'
                : 'border-gray-600 bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Error / Lock message */}
      {locked ? (
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <p className="text-red-400 font-semibold">Too many wrong attempts</p>
          <p className="text-gray-500 text-sm mt-1">
            Try again in <span className="text-amber-400 font-bold">{lockTimer}s</span>
          </p>
        </div>
      ) : (
        error && <p className="text-red-400 text-sm -mt-4">{error}</p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-4">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            disabled={locked || d === ''}
            onClick={() => {
              if (d === '⌫') setPin((p) => p.slice(0, -1));
              else if (d) handleDigit(d);
            }}
            className={`w-20 h-20 rounded-full text-2xl font-medium transition-all active:scale-95 ${
              d === ''
                ? 'cursor-default opacity-0'
                : d === '⌫'
                ? 'bg-gray-800 text-red-400 hover:bg-gray-700 disabled:opacity-30'
                : 'bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-gray-700 text-xs">KhataBook · Secure Access</p>
    </div>
  );
}

export default function GatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading…</div>}>
      <GateContent />
    </Suspense>
  );
}
