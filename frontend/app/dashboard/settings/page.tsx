'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import OtpModal from '@/components/OtpModal';
import { Camera, Mail, Shield, Lock, CreditCard, Loader2 } from 'lucide-react';

type OtpMode = 'EMAIL' | 'PASSWORD' | 'PIN' | null;

export default function SettingsPage() {
  const { user, refreshUser, updateAutoLock } = useAuth();
  
  // Local Form States
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  
  // UI States
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // OTP Modal State
  const [otpMode, setOtpMode] = useState<OtpMode>(null);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // ── Profile Image Upload ──────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be less than 5MB');
      return;
    }

    try {
      setLoadingAction('image');
      const formData = new FormData();
      formData.append('image', file);
      
      await authAPI.uploadProfileImage(formData);
      await refreshUser();
      showSuccess('Profile photo updated successfully!');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to map image');
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Email Update ──────────────────────────────────────────
  const handleRequestEmailUpdate = async () => {
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      showError('Please enter a valid email address.');
      return;
    }
    
    try {
      setLoadingAction('email');
      await authAPI.requestEmailUpdate(newEmail);
      setOtpTarget(newEmail);
      setOtpMode('EMAIL');
      setIsOtpOpen(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to request email update');
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Password Update ───────────────────────────────────────
  const handleRequestPasswordChange = async () => {
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    
    try {
      setLoadingAction('password');
      // Trigger a Public OTP standard dispatch to their current email
      await authAPI.forgotPasswordOtp(user.email || '');
      setOtpTarget(user.email || 'your email');
      setOtpMode('PASSWORD');
      setIsOtpOpen(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to request password change');
    } finally {
      setLoadingAction(null);
    }
  };

  // ── PIN Update ────────────────────────────────────────────
  const handleRequestPinChange = async () => {
    if (!/^\d{6}$/.test(newPin)) {
      showError('PIN must be exactly 6 numeric digits.');
      return;
    }
    
    try {
      setLoadingAction('pin');
      // Secure private dispatch
      await authAPI.sendOtp(user.email || '', 'app unlock PIN change');
      setOtpTarget(user.email || 'your email');
      setOtpMode('PIN');
      setIsOtpOpen(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to request PIN change');
    } finally {
      setLoadingAction(null);
    }
  };

  // ── OTP Submission Gateway ────────────────────────────────
  const handleOtpSubmit = async (code: string) => {
    try {
      setLoadingAction('otp_submit');
      if (otpMode === 'EMAIL') {
        await authAPI.updateEmail(code);
        setNewEmail('');
        await refreshUser();
        showSuccess('Email has been successfully updated!');
      } else if (otpMode === 'PASSWORD') {
        await authAPI.changePassword({ email: user.email!, otp: code, newPassword });
        setNewPassword('');
        showSuccess('Password has been securely changed.');
      } else if (otpMode === 'PIN') {
        await authAPI.changePin({ email: user.email!, otp: code, newPin });
        setNewPin('');
        showSuccess('Application unlock PIN strongly updated.');
      }
      setIsOtpOpen(false);
    } catch (err: any) {
      throw err; // Re-throw to OtpModal for inline error display
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Personal Settings</h1>
          <p className="text-gray-500 mt-1">Manage your identity, security preferences, and credential controls.</p>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
         <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
         </div>
      )}
      {successMsg && (
         <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <p className="text-sm text-green-700 font-medium">{successMsg}</p>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ── Left Column: Profile Card ────────────────────────── */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="relative inline-block mb-4">
              {user.avatar || user.profileImage ? (
                <img 
                  src={user.profileImage || user.avatar} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-xl mx-auto">
                  <span className="text-3xl font-bold text-blue-600">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg hover:bg-blue-700 transition-colors"
                disabled={loadingAction === 'image'}
              >
                {loadingAction === 'image' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/jpg,image/webp" 
                onChange={handleImageChange}
              />
            </div>
            
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 text-sm">{user.phone}</p>
            <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
               {user.role === 'superadmin' ? 'Super Administrator' : user.role === 'admin' ? 'Administrator' : 'Standard User'}
            </div>
          </div>
        </div>

        {/* ── Right Column: Core Settings ──────────────────────── */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Email Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Email Address</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Update your primary email. We will send an OTP to verify ownership.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder={user.email || "Add an email address..."}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button
                onClick={handleRequestEmailUpdate}
                disabled={!newEmail || loadingAction === 'email'}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingAction === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                Change
              </button>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Security & Credentials</h3>
              </div>
              {!user.email && (
                 <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                   Email Required
                 </span>
              )}
            </div>

            {!user.email ? (
               <div className="text-sm p-4 bg-gray-50 rounded-lg text-gray-500 border border-gray-100">
                 Please attach and verify an email address to your profile first. A registered email is required to securely receive OTPs for modifying critical access credentials like your Password and Application PIN.
               </div>
            ) : (
              <div className="space-y-6">
                {/* Password */}
                <div className="pb-6 border-b border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Password</label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      placeholder="Enter new 6+ char password"
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      onClick={handleRequestPasswordChange}
                      disabled={!newPassword || loadingAction === 'password'}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingAction === 'password' && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update
                    </button>
                  </div>
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Unlock PIN</label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Enter strictly 6 digits"
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all tracking-widest font-mono"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      onClick={handleRequestPinChange}
                      disabled={newPin.length !== 6 || loadingAction === 'pin'}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingAction === 'pin' && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto Lock settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Lock className="w-5 h-5 text-gray-400" />
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900">Auto-Lock Inactivity</h3>
                   <p className="text-sm text-gray-500">Require PIN after inactivity periods.</p>
                 </div>
               </div>
               <select
                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                 value={user.autoLockTime === null ? 'null' : String(user.autoLockTime)}
                 onChange={(e) => {
                   const val = e.target.value === 'null' ? null : Number(e.target.value);
                   updateAutoLock(val);
                   showSuccess('Auto-lock preference saved.');
                 }}
               >
                 <option value="null">Never Lock (Disabled)</option>
                 <option value="30">30 Seconds</option>
                 <option value="60">1 Minute</option>
               </select>
            </div>
          </div>

        </div>
      </div>

      {/* Shared OTP Modal */}
      <OtpModal 
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onSubmit={handleOtpSubmit}
        isLoading={loadingAction === 'otp_submit'}
        title={otpMode === 'EMAIL' ? 'Verify New Email' : otpMode === 'PASSWORD' ? 'Verify Password Update' : 'Verify PIN Update'}
        description={`A 6-digit security code was dispatched securely to ${otpTarget}.`}
      />
    </div>
  );
}
