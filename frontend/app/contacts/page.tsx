'use client';
import { useState, useEffect, useCallback } from 'react';
import { contactAPI } from '@/lib/api';
import { Contact } from '@/lib/types';
import NewContactModal from '@/components/NewContactModal';

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await contactAPI.getAll();
      setContacts(res.data.contacts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await contactAPI.delete(id);
      load();
    } catch (e) {
      alert('Failed to delete contact');
    }
  };

  if (loading) return <div className="text-gray-400">Loading contacts…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-400 text-sm">Manage your ledger contacts</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <p className="text-gray-500">No contacts added yet.</p>
        ) : (
          contacts.map(c => (
            <div key={c._id} className="glass p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center text-lg font-bold text-indigo-400">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{c.name}</h3>
                    <p className="text-gray-400 text-sm">{c.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c._id, c.name)}
                  className="text-gray-600 hover:text-red-400 p-1"
                  title="Delete Contact"
                >
                  🗑️
                </button>
              </div>

              <div className="flex justify-between items-end border-t border-gray-800 pt-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Net Balance</p>
                  <p className={`font-bold text-lg ${c.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {c.balance >= 0 ? '+' : '-'}{fmt(c.balance)}
                  </p>
                </div>
                {c.balance > 0 && (
                  <button className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors">
                    Send Reminder
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && <NewContactModal onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}
