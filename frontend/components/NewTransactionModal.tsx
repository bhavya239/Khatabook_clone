'use client';
import { useState, useEffect } from 'react';
import { transactionAPI, contactAPI } from '@/lib/api';
import { Contact } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export default function NewTransactionModal({
  onClose, onSaved
}: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({
    contact: '',
    type: 'given' as 'given' | 'received',
    amount: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().slice(0, 16),
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    contactAPI.getAll().then(r => setContacts(r.data.contacts)).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact) return setError('Please select a contact');
    if (Number(form.amount) < 1) return setError('Amount must be > 0');

    setLoading(true);
    setError('');
    try {
      await transactionAPI.create({
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        dueDate: form.type === 'given' && form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-xl font-bold text-white mb-4">New Ledger Entry</h2>

        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          {user?.businessId && (
            <div className={`p-4 rounded-xl border-2 transition-colors cursor-pointer flex items-center justify-between ${
              form.category === 'business' 
                ? 'bg-indigo-600/20 border-indigo-500' 
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => setForm(f => ({ ...f, category: f.category === 'business' ? 'other' : 'business' }))}
            >
              <div>
                <p className={`font-semibold ${form.category === 'business' ? 'text-indigo-400' : 'text-gray-300'}`}>🏢 Business Transaction</p>
                <p className="text-xs text-gray-500 mt-0.5">Link this expense to your business P&L</p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                form.category === 'business' ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
              }`}>
                {form.category === 'business' && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
          )}

          <div className="flex p-1 bg-gray-900 rounded-lg">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, type: 'given' }))}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                form.type === 'given' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              📤 You Gave
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, type: 'received' }))}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                form.type === 'received' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              📥 You Got
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Contact</label>
            <select
              required value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Contact</option>
              {contacts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Amount (₹)</label>
            <input
              type="number" required min="1" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xl font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Date & Time</label>
              <input
                type="datetime-local" required value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Category</label>
              <select
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="other">Other</option>
                <option value="loan">Loan</option>
                {!user?.businessId && <option value="business">Business</option>}
                <option value="personal">Personal</option>
                <option value="rent">Rent</option>
                <option value="food">Food</option>
              </select>
            </div>
          </div>

          {form.type === 'given' && (
            <div>
              <label className="text-sm text-rose-400 mb-1 block font-medium">Due Date (Optional)</label>
              <input
                type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-gray-900 border border-rose-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              />
              <p className="text-xs text-gray-500 mt-1">A 2% penalty is applied daily after this date.</p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description (optional)</label>
            <input
              type="text" value={form.description} placeholder="What was this for?"
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            A WhatsApp notification <strong className="text-green-400">will be sent automatically</strong> if possible.
          </p>
        </form>
      </div>
    </div>
  );
}
