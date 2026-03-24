'use client';
/**
 * Dashboard: Shows monthly summary, balance overview, and recent transactions.
 */
import { useEffect, useState, useCallback } from 'react';
import { transactionAPI, contactAPI } from '@/lib/api';
import { SummaryResponse, Transaction, Contact } from '@/lib/types';

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [recent, setRecent]   = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [s, t, c] = await Promise.all([
        transactionAPI.getSummary({ month, year }),
        transactionAPI.getAll({ limit: 5, month, year }),
        contactAPI.getAll(),
      ]);
      setSummary(s.data);
      setRecent(t.data.transactions);
      setContacts(c.data.contacts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(true); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const s = summary?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Overview of your finances</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-[#1e1e2e] border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[#1e1e2e] border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Given"
          value={fmt(s?.totalGiven ?? 0)}
          sub={`${s?.transactionCount ?? 0} transactions`}
          color="text-red-400"
          icon="📤"
        />
        <StatCard
          label="Total Received"
          value={fmt(s?.totalReceived ?? 0)}
          sub="This month"
          color="text-green-400"
          icon="📥"
        />
        <StatCard
          label="Net Balance"
          value={fmt(s?.netBalance ?? 0)}
          sub={(s?.netBalance ?? 0) >= 0 ? 'You are owed' : 'You owe'}
          color={(s?.netBalance ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}
          icon="⚖️"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="glass p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
          {recent.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((tx) => (
                <li key={tx._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                      tx.type === 'given' ? 'bg-red-500/10' : 'bg-green-500/10'
                    }`}>
                      {tx.type === 'given' ? '📤' : '📥'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {tx.contact?.name ?? 'Unknown'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(tx.date).toLocaleDateString('en-IN')}
                        {tx.description ? ` · ${tx.description}` : ''}
                        {tx.isOverdue && <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase tracking-wider text-[10px]">Overdue</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm flex flex-col items-end ${
                    tx.type === 'given' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    <span>{tx.type === 'given' ? '-' : '+'}{fmt(tx.amount)}</span>
                    {tx.penaltyApplied ? <span className="text-[10px] text-rose-500">+ {fmt(tx.penaltyApplied)} fee</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Contacts by Balance */}
        <div className="glass p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Contact Balances</h2>
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-sm">No contacts yet.</p>
          ) : (
            <ul className="space-y-3">
              {contacts.slice(0, 6).map((c) => (
                <li key={c._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600/20 rounded-full flex items-center justify-center text-sm font-bold text-indigo-400">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${c.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {c.balance >= 0 ? '+' : '-'}{fmt(c.balance)}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {c.balance >= 0 ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string; color: string; icon: string;
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium ${color} bg-current/10 px-2 py-1 rounded-full opacity-80`}>
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}
