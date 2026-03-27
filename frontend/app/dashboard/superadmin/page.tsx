'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  admin:       'bg-amber-500/20 text-amber-400 border-amber-500/30',
  user:        'bg-gray-700/40 text-gray-400 border-gray-600/30',
};

interface User {
  _id: string; name: string; phone: string; role: string; isActive: boolean; createdAt: string;
}
interface Overview {
  users: { total: number; admins: number; superAdmins: number };
  totalTransactions: number; totalContacts: number; totalBusinesses: number; totalRevenue: number;
  recentUsers: User[];
}

export default function SuperAdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ov, us] = await Promise.all([
        api.get('/admin/overview'),
        api.get(`/admin/users?search=${search}`),
      ]);
      setOverview(ov.data.overview);
      setUsers(us.data.users);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed to load data — ensure you have superadmin role');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setMsg(`Role updated to ${role}`);
      load();
    } catch (e: any) { setMsg(e?.response?.data?.message || 'Failed'); }
  };

  const toggleActive = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      load();
    } catch (e: any) { setMsg(e?.response?.data?.message || 'Failed'); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (loading) return <div className="text-gray-400 p-10 text-center">Loading super admin panel...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🛡️ Super Admin Panel
          </h1>
          <p className="text-gray-400 text-sm">Full platform management and user oversight</p>
        </div>
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
          {(['overview', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-lg text-sm">
          {msg}
        </div>
      )}

      {tab === 'overview' && overview && (
        <div className="space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: overview.users.total, icon: '👥' },
              { label: 'Total Transactions', value: overview.totalTransactions, icon: '💸' },
              { label: 'Total Contacts', value: overview.totalContacts, icon: '📋' },
              { label: 'Platform Revenue', value: fmt(overview.totalRevenue), icon: '💰' },
            ].map(card => (
              <div key={card.label} className="glass p-5">
                <div className="text-2xl mb-2">{card.icon}</div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Role breakdown */}
          <div className="glass p-5">
            <h3 className="text-white font-semibold mb-4">Role Breakdown</h3>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Super Admins', count: overview.users.superAdmins, cls: ROLE_BADGE.superadmin },
                { label: 'Admins', count: overview.users.admins, cls: ROLE_BADGE.admin },
                { label: 'Regular Users', count: overview.users.total, cls: ROLE_BADGE.user },
                { label: 'Businesses', count: overview.totalBusinesses, cls: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
              ].map(r => (
                <div key={r.label} className={`px-4 py-3 rounded-xl border ${r.cls} text-center min-w-[110px]`}>
                  <p className="text-2xl font-bold">{r.count}</p>
                  <p className="text-xs mt-1">{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent users */}
          <div className="glass p-5">
            <h3 className="text-white font-semibold mb-4">Recently Joined</h3>
            <div className="space-y-2">
              {overview.recentUsers.map(u => (
                <div key={u._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-gray-500 text-xs">{u.phone}</p>
                  </div>
                  <span className={`border px-2 py-0.5 rounded text-xs font-bold uppercase ${ROLE_BADGE[u.role] ?? ROLE_BADGE.user}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="glass p-5">
          <div className="flex items-center gap-3 mb-5">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u._id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-gray-500 text-xs">{u.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`border px-2 py-0.5 rounded text-xs font-bold uppercase ${ROLE_BADGE[u.role] ?? ROLE_BADGE.user}`}>
                    {u.role}
                  </span>
                  {/* Role selector */}
                  <select
                    value={u.role}
                    onChange={e => changeRole(u._id, e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive(u._id)}
                    className={`text-xs px-3 py-1 rounded-lg border transition-colors ${u.isActive ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}`}
                  >
                    {u.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
