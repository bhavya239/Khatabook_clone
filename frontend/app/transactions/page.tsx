'use client';
import { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from '@/lib/api';
import { Transaction } from '@/lib/types';
import NewTransactionModal from '@/components/NewTransactionModal';

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'given' | 'received'>('all');

  const load = useCallback(async () => {
    try {
      const p: any = { limit: 50 };
      if (typeFilter !== 'all') p.type = typeFilter;
      const res = await transactionAPI.getAll(p);
      setTxs(res.data.transactions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete transaction? This will reverse the contact balance.')) return;
    try {
      await transactionAPI.delete(id);
      load();
    } catch (e) {
      alert('Failed to delete transaction');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 text-sm">Ledger entry history</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary px-4 py-2 text-sm">
          + New Entry
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'given', 'received'] as const).map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              typeFilter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : txs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions found.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {txs.map(tx => (
              <div key={tx._id} className="p-3 sm:p-4 flex items-start sm:items-center justify-between hover:bg-white/5 transition-colors group gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                    tx.type === 'given' ? 'bg-red-500/10' : 'bg-green-500/10'
                  }`}>
                    {tx.type === 'given' ? '📤' : '📥'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{tx.contact?.name || 'Deleted Contact'}</h3>
                    <p className="text-gray-500 text-xs mt-0.5 flex flex-wrap gap-1 items-center">
                      <span>{new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}</span>
                      {tx.category && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{tx.category}</span>}
                      {tx.isOverdue && <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase tracking-wider text-[10px] border border-rose-500/30">OVERDUE</span>}
                    </p>
                    {tx.description && <p className="text-gray-400 text-xs mt-1 truncate max-w-[160px] sm:max-w-none">{tx.description}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-right flex-shrink-0">
                  <div>
                    <span className={`font-bold block text-right text-sm ${tx.type === 'given' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'given' ? '-' : '+'}{fmt(tx.amount)}
                    </span>
                    {tx.penaltyApplied ? (
                      <span className="text-[10px] text-rose-500 block mt-0.5">+{fmt(tx.penaltyApplied)} fee</span>
                    ) : null}
                    <span className="text-gray-600 text-xs block text-right mt-0.5">Bal: {fmt(tx.balanceAfter)}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(tx._id)}
                    className="text-gray-500 hover:text-red-400 p-1.5 transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && <NewTransactionModal onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}
