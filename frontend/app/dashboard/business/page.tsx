'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

interface Member {
  user: { _id: string; name: string; phone: string; avatar: string };
  role: 'owner' | 'staff';
  joinedAt: string;
}
interface Business {
  _id: string;
  name: string;
  members: Member[];
}

export default function BusinessPage() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/business/me', { headers });
      setBusiness(res.data.business);
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createBusiness = async () => {
    if (!businessName.trim()) return;
    try {
      setError('');
      await api.post('/business/create', { name: businessName }, { headers });
      setMsg('Business created successfully!');
      setBusinessName('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create business');
    }
  };

  const inviteStaff = async () => {
    if (!invitePhone.trim()) return;
    try {
      setError('');
      await api.post('/business/invite', { phone: invitePhone }, { headers });
      setMsg('Staff member invited!');
      setInvitePhone('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to invite staff');
    }
  };

  const removeStaff = async (userId: string) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await api.delete(`/business/remove/${userId}`, { headers });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to remove staff');
    }
  };

  if (loading) return <div className="text-gray-400 text-center p-10">Loading business data...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Business Mode</h1>
        <p className="text-gray-400 text-sm">Manage your workspace and team members</p>
      </div>

      {msg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm">
          {msg}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!business ? (
        /* ── No Business: show create form ── */
        <div className="glass p-6 max-w-md">
          <h2 className="text-lg font-semibold text-white mb-4">Create a Business Workspace</h2>
          <p className="text-gray-400 text-sm mb-4">
            Create a shared workspace to collaborate with your team. You will be the owner with full access.
          </p>
          <div className="flex gap-3">
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Business name (e.g. Patel Traders)"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <button onClick={createBusiness} className="btn-primary px-5">
              Create
            </button>
          </div>
        </div>
      ) : (
        /* ── Business exists: show dashboard ── */
        <div className="space-y-5">
          {/* Header card */}
          <div className="glass p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Business</p>
              <h2 className="text-2xl font-bold text-white">{business.name}</h2>
              <p className="text-gray-400 text-sm mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${user?.businessRole === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  {user?.businessRole}
                </span>
                <span className="ml-2">{business.members.length} member{business.members.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
            <div className="text-5xl">🏢</div>
          </div>

          {/* Invite staff (owner only) */}
          {user?.businessRole === 'owner' && (
            <div className="glass p-5">
              <h3 className="text-white font-semibold mb-3">Invite Staff Member</h3>
              <div className="flex gap-3">
                <input
                  value={invitePhone}
                  onChange={e => setInvitePhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <button onClick={inviteStaff} className="btn-primary px-5 text-sm">
                  Invite
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="glass p-5">
            <h3 className="text-white font-semibold mb-4">Team Members</h3>
            <ul className="space-y-3">
              {business.members.map(m => (
                <li key={m.user._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                      {m.user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{m.user.name}</p>
                      <p className="text-gray-500 text-xs">{m.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${m.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {m.role}
                    </span>
                    {user?.businessRole === 'owner' && m.role !== 'owner' && (
                      <button
                        onClick={() => removeStaff(m.user._id)}
                        className="text-gray-600 hover:text-rose-400 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
