'use client';

import React, { useState, useRef, useEffect } from 'react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function OtpModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Enter Security Code",
  description = "A 6-digit OTP has been sent to your registered email.",
  isLoading = false 
}: OtpModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus exactly on mount reset
  useEffect(() => {
    if (isOpen) {
      setOtp(Array(6).fill(''));
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // Only numeric

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1); // Keep last digit if overflow
    setOtp(newOtp);

    // Auto-advance
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Backspace cascades backwards if input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6).replace(/\D/g, '');
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    // Focus next available or end
    const lastFilled = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const submitOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError(null);
    try {
      await onSubmit(code);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h2>
          <p className="text-sm text-gray-500 text-center mb-6">{description}</p>

          {/* OTP Digit Block */}
          <div 
            className="flex justify-between gap-2 mb-6"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center mb-4 bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={submitOtp}
              disabled={isLoading || otp.join('').length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Verify & Submit'
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
