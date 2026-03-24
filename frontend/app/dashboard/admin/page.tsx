'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ totalUsers: number; totalTransactions: number; totalRevenue: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Hard redirect if not an admin
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    
    adminAPI.getStats()
      .then((res) => setStats(res.data.stats))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stats'));
  }, [user, router]);

  if (error) return <div className="flex h-64 items-center justify-center text-red-400">{error}</div>;
  if (!stats) return <div className="flex h-64 items-center justify-center text-gray-400">Loading Admin Portal...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          👑 Super Admin Portal
        </h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide statistics and management overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 border-l-4 border-rose-500 rounded-lg">
          <p className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">Total Users</p>
          <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        
        <div className="glass p-6 border-l-4 border-rose-500 rounded-lg">
          <p className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">Platform Transactions</p>
          <p className="text-4xl font-bold text-white">{stats.totalTransactions.toLocaleString('en-IN')}</p>
        </div>

        <div className="glass p-6 border-l-4 border-green-500 rounded-lg">
          <p className="text-green-300 text-xs font-bold uppercase tracking-wider mb-2">Aggregate Volume Tracked</p>
          <p className="text-4xl font-bold text-green-400">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      <div className="glass p-6 mt-8 rounded-lg bg-red-900/10 border border-red-500/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🔒</span>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Strict Data Privacy Enforced</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              As a Super Admin, you are granted access to high-level platform statistics. 
              By explicit security design, you <strong>cannot</strong> view personal lists of contacts, nor can you read individual descriptive transaction histories belonging to users. Data privacy is cryptographically enforced by the backend server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
